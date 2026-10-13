import { NextResponse } from "next/server";
import { getInterview, getEvaluation } from "@/lib/interviews-store";
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
    const cachedEvaluation = getEvaluation(id);
    if (cached) {
      return NextResponse.json({
        success: true,
        interview: cached,
        evaluation: cachedEvaluation || null,
      });
    }

    // 2. Check dummy interviews
    const dummy = dummyInterviews.find((d) => d.id === id);
    if (dummy) {
      return NextResponse.json({
        success: true,
        interview: dummy,
        evaluation: cachedEvaluation || null,
      });
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
        let evaluationData = cachedEvaluation || null;
        try {
          const { data: dbEval } = await supabaseAdmin
            .from("evaluations")
            .select("*")
            .eq("interview_id", id)
            .maybeSingle();

          if (dbEval) {
            evaluationData = {
              id: dbEval.id,
              interviewId: id,
              userId: dbEval.user_id,
              role: dbEval.role,
              level: dbEval.level,
              totalScore: Number(dbEval.total_score) || 0,
              categoryScores: dbEval.category_scores || [],
              strengths: dbEval.strengths || [],
              areasForImprovement: dbEval.areas_for_improvement || [],
              finalAssessment: dbEval.final_assessment,
              questionReviews: dbEval.question_reviews || [],
              createdAt: dbEval.created_at,
            };
          }
        } catch {
          // Table might not exist yet
        }

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
          evaluation: evaluationData,
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
