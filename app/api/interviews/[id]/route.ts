import { NextResponse } from "next/server";
import { getInterview } from "@/lib/interviews-store";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { dummyInterviews } from "@/constants";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Check in-memory store
    const cached = getInterview(id);
    if (cached) {
      return NextResponse.json({ success: true, interview: cached });
    }

    // 2. Check dummy interviews
    const dummy = dummyInterviews.find((d) => d.id === id);
    if (dummy) {
      return NextResponse.json({ success: true, interview: dummy });
    }

    // 3. Check Supabase
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
    ) {
      const { data } = await supabaseAdmin
        .from("interviews")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (data) {
        return NextResponse.json({
          success: true,
          interview: {
            id: data.id,
            userId: data.user_id,
            role: data.role,
            type: data.type,
            level: data.level,
            techstack: data.techstack || [],
            questions: Array.isArray(data.questions)
              ? data.questions
              : JSON.parse(data.questions || "[]"),
            finalized: data.finalized || false,
            createdAt: data.created_at,
          },
        });
      }
    }

    return NextResponse.json(
      { success: false, message: "Interview not found" },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: String(error) },
      { status: 500 }
    );
  }
}
