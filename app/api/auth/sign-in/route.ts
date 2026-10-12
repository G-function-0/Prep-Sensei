import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const isSupabaseLive = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
    );

    if (isSupabaseLive) {
      const supabase = await createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: password || "password123",
      });

      if (error) {
        let msg = error.message;
        if (error.message.toLowerCase().includes("email not confirmed")) {
          msg =
            "Your email has not been confirmed yet. Please check your inbox for the confirmation link, or disable 'Confirm email' in Supabase Dashboard (Authentication -> Providers -> Email) to allow instant login.";
        } else if (
          error.message.toLowerCase().includes("invalid login credentials")
        ) {
          msg =
            "Invalid email or password. If you haven't created an account yet, please sign up first.";
        }
        return NextResponse.json(
          { success: false, message: msg },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Signed in successfully",
      });
    }

    // Fallback demo session
    const response = NextResponse.json({
      success: true,
      message: "Signed in",
    });
    response.cookies.set(
      "prepsensei_demo_session",
      JSON.stringify({
        id: "demo_user_" + email.replace(/[^a-zA-Z0-9]/g, "_"),
        name: "Candidate",
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
