"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const DEMO_SESSION_COOKIE = "prepsensei_demo_session";

// Check if Supabase credentials are configured
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      !url.includes("placeholder") &&
      !key.includes("placeholder")
  );
}

export async function signUp(params: SignUpParams) {
  const { name, email, password } = params;

  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password: password || "password123",
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      if (data.user) {
        try {
          // Attempt to insert record in public.users if table exists
          await supabase.from("users").upsert({
            id: data.user.id,
            name: name || "Candidate",
            email,
          });
        } catch (dbErr) {
          console.warn(
            "Profile sync note: Run supabase/schema.sql in your Supabase SQL Editor to create public.users table.",
            dbErr
          );
        }
      }

      // If email confirmation is enabled in Supabase, session is null
      if (!data.session) {
        return {
          success: true,
          message:
            "Account created! Please check your email to confirm your address before signing in, or disable 'Confirm email' in Supabase Dashboard (Authentication -> Providers -> Email).",
        };
      }

      return {
        success: true,
        message: "Account created successfully! You can now sign in.",
      };
    }

    // Demo/offline mode fallback
    const cookieStore = await cookies();
    cookieStore.set(
      DEMO_SESSION_COOKIE,
      JSON.stringify({
        id: "demo_user_" + email.replace(/[^a-zA-Z0-9]/g, "_"),
        name: name || "Candidate",
        email,
      }),
      {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: "lax",
      }
    );

    return {
      success: true,
      message: "Account created successfully.",
    };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      ((error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE" ||
        (error as { name?: string }).name === "DynamicServerError" ||
        (error as { message?: string }).message?.includes("Dynamic server usage"))
    ) {
      throw error;
    }
    console.error("Error signing up:", error);
    return {
      success: false,
      message: "Failed to create account. Please try again.",
    };
  }
}

export async function signIn(params: SignInParams) {
  const { email, password } = params;

  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: password || "password123",
      });

      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          return {
            success: false,
            message:
              "Your email has not been confirmed yet. Please check your inbox for the confirmation link, or disable 'Confirm email' in Supabase Dashboard (Authentication -> Providers -> Email) to allow instant login.",
          };
        }
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          return {
            success: false,
            message:
              "Invalid email or password. If you haven't created an account yet, please sign up first.",
          };
        }
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: true,
      };
    }

    // Demo/offline mode fallback
    const cookieStore = await cookies();
    cookieStore.set(
      DEMO_SESSION_COOKIE,
      JSON.stringify({
        id: "demo_user_" + email.replace(/[^a-zA-Z0-9]/g, "_"),
        name: "Candidate",
        email,
      }),
      {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: "lax",
      }
    );

    return {
      success: true,
    };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      ((error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE" ||
        (error as { name?: string }).name === "DynamicServerError" ||
        (error as { message?: string }).message?.includes("Dynamic server usage"))
    ) {
      throw error;
    }
    console.error("Error signing in:", error);
    return {
      success: false,
      message: "Failed to log into account. Please try again.",
    };
  }
}

export async function signInAsDemo() {
  const cookieStore = await cookies();
  cookieStore.set(
    DEMO_SESSION_COOKIE,
    JSON.stringify({
      id: "demo_candidate_id",
      name: "Demo Candidate",
      email: "candidate@prepsensei.com",
    }),
    {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
    }
  );
  return { success: true };
}

export async function signOut() {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      await supabase.auth.signOut();
    }
  } catch (error) {
    console.error("Error signing out from Supabase:", error);
  }

  const cookieStore = await cookies();
  cookieStore.delete(DEMO_SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Try fetching user profile from users table if available
        let profileName: string | undefined;
        let profileEmail: string | undefined;

        try {
          const { data: profile } = await supabase
            .from("users")
            .select("name, email")
            .eq("id", user.id)
            .maybeSingle();

          profileName = profile?.name;
          profileEmail = profile?.email;
        } catch {
          // Table might not exist yet
        }

        return {
          id: user.id,
          name:
            profileName ||
            user.user_metadata?.name ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "Candidate",
          email: profileEmail || user.email || "candidate@prepsensei.com",
        };
      }
    }

    // Fallback: Check demo session cookie
    const cookieStore = await cookies();
    const demoSession = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
    if (demoSession) {
      try {
        const decoded = decodeURIComponent(demoSession);
        const parsed = JSON.parse(decoded);
        return {
          id: parsed.id || "demo_candidate_id",
          name: parsed.name || "Demo Candidate",
          email: parsed.email || "candidate@prepsensei.com",
        };
      } catch {
        try {
          const parsed = JSON.parse(demoSession);
          return {
            id: parsed.id || "demo_candidate_id",
            name: parsed.name || "Demo Candidate",
            email: parsed.email || "candidate@prepsensei.com",
          };
        } catch {
          return null;
        }
      }
    }

    return null;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      ((error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE" ||
        (error as { name?: string }).name === "DynamicServerError" ||
        (error as { message?: string }).message?.includes("Dynamic server usage"))
    ) {
      throw error;
    }
    console.error("Error retrieving current user:", error);
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return Boolean(user);
}
