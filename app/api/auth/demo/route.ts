import { NextResponse } from "next/server";

const DEMO_SESSION_COOKIE = "prepsensei_demo_session";

export async function POST() {
  const response = NextResponse.json(
    {
      success: true,
      message: "Signed in as Demo Candidate",
      user: {
        id: "demo_candidate_id",
        name: "Demo Candidate",
        email: "candidate@prepsensei.com",
      },
    },
    { status: 200 }
  );

  response.cookies.set(
    DEMO_SESSION_COOKIE,
    JSON.stringify({
      id: "demo_candidate_id",
      name: "Demo Candidate",
      email: "candidate@prepsensei.com",
    }),
    {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    }
  );

  return response;
}
