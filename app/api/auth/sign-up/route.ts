import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    const isSupabaseLive = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
    );

    if (isSupabaseLive) {
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
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 400 }
        );
      }

      if (data.user) {
        try {
          await supabase.from("users").upsert({
            id: data.user.id,
            name: name || "Candidate",
            email,
          });
        } catch (dbErr) {
          console.warn("User sync note:", dbErr);
        }
      }

      const message = !data.session
        ? "Account created! Please check your email to confirm your address before signing in, or disable 'Confirm email' in Supabase Dashboard (Authentication -> Providers -> Email)."
        : "Account created successfully! You can now sign in.";

      return NextResponse.json({ success: true, message });
    }

    // Fallback demo session
    const response = NextResponse.json({
      success: true,
      message: "Account created successfully",
    });
    response.cookies.set(
      "prepsensei_demo_session",
      JSON.stringify({
        id: "demo_user_" + email.replace(/[^a-zA-Z0-9]/g, "_"),
        name: name || "Candidate",
        email,
      }),
      {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
      }
    );
    return response;
  } catch (err) {
    return NextResponse.json(
      { success: false, message: String(err) },
      { status: 500 }
    );
  }
}
