import { NextResponse } from "next/server";
import { executeWithGeminiKeyRotation } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth.action";
import { getRandomInterviewCover } from "@/lib/utils";

function generateTailoredQuestions(
  role: string,
  level: string,
  type: string,
  techstack: string,
  amount: number
): string[] {
  const roleLower = role.toLowerCase();
  const baseQuestions: string[] = [];

  baseQuestions.push(
    `Can you introduce yourself and talk about your experience as a ${level} ${role}?`
  );

  if (roleLower.includes("front") || techstack.toLowerCase().includes("react")) {
    baseQuestions.push(
      "How do you manage complex application state, side effects, and re-rendering performance in modern frontend architectures?"
    );
    baseQuestions.push(
      "Can you walk me through your strategy for optimizing Core Web Vitals, page load speed, and asset bundles in production?"
    );
    baseQuestions.push(
      "Tell me about a challenging cross-browser or UI state synchronization bug you diagnosed and resolved."
    );
  } else if (
    roleLower.includes("back") ||
    techstack.toLowerCase().includes("node") ||
    techstack.toLowerCase().includes("python")
  ) {
    baseQuestions.push(
      "How do you approach database schema indexing, query optimization, and connection pooling under heavy concurrent traffic?"
    );
    baseQuestions.push(
      "How do you design idempotent REST or GraphQL APIs and handle distributed caching and rate-limiting?"
    );
    baseQuestions.push(
      "Tell me about a time you investigated a severe latency spike or memory leak in a backend service."
    );
  } else {
    baseQuestions.push(
      `How do you typically structure, test, and deploy applications utilizing ${techstack || "modern engineering stacks"}?`
    );
    baseQuestions.push(
      "Can you describe a high-impact technical hurdle you encountered recently and how you evaluated the trade-offs?"
    );
    baseQuestions.push(
      "How do you maintain high code quality, documentation, and system resilience in fast-moving engineering teams?"
    );
  }

  if (type.toLowerCase().includes("behavior") || type.toLowerCase().includes("mix")) {
    baseQuestions.push(
      "Tell me about a time you had a technical disagreement with a team member or stakeholder and how you reached alignment."
    );
  }

  return baseQuestions.slice(0, Math.max(3, amount));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      role = "Software Engineer",
      level = "Mid-level",
      type = "Technical",
      techstack = [],
      amount = 4,
      focusAreas = "",
    } = body;

    const user = await getCurrentUser();
    const userId = user?.id || "demo_candidate_id";

    const techStackList = Array.isArray(techstack)
      ? techstack.join(", ")
      : String(techstack);

    const prompt = `You are a Principal Technical Interviewer conducting a realistic, voice-based interview.
Generate ${amount} high-quality, spoken-friendly interview questions for the following candidate:
- Job Role: ${role}
- Experience Level: ${level}
- Interview Style/Type: ${type} (e.g. Technical, Behavioral, System Design, or Mixed)
- Core Tech Stack: ${techStackList || "General Software Engineering"}
${focusAreas ? `- Special Focus Areas: ${focusAreas}` : ""}

Rules for voice questions:
1. Make questions conversational and clear when spoken aloud via Text-to-Speech.
2. Avoid bullet points, code blocks, slashes (/), asterisks, or complex markdown that sounds unnatural when read aloud.
3. Start with an introductory warm-up question, move into core technical or scenario questions, and include one problem-solving challenge.
4. Return ONLY a valid JSON array of strings containing the questions.

Example format:
["Can you tell me about a recent project you built using React and how you managed application state?", "How do you handle error boundaries and logging in production Next.js apps?"]`;

    let questions: string[] = [];

    try {
      questions = await executeWithGeminiKeyRotation(async (ai) => {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const text = response.text?.trim() || "[]";
        let cleaned = text;
        if (cleaned.startsWith("```")) {
          cleaned = cleaned
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();
        }

        try {
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((q: unknown) => String(q).trim());
          }
        } catch (e) {
          console.warn("Error parsing Gemini JSON:", e);
        }

        return cleaned
          .split("\n")
          .map((line) => line.replace(/^[-*•\d.]+\s*/, "").trim())
          .filter((q) => q.length > 10);
      });
    } catch (geminiError) {
      console.warn(
        "Gemini API key pool note (will use smart tailored question generator until keys are added):",
        geminiError instanceof Error ? geminiError.message : geminiError
      );
      questions = generateTailoredQuestions(
        role,
        level,
        type,
        techStackList,
        amount
      );
    }

    const finalQuestions =
      questions.length > 0
        ? questions
        : generateTailoredQuestions(role, level, type, techStackList, amount);

    const interviewId = `interview_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const coverImage = getRandomInterviewCover();

    const newInterview = {
      id: interviewId,
      userId,
      role,
      level,
      type,
      techstack: Array.isArray(techstack)
        ? techstack
        : techStackList.split(",").map((s) => s.trim()).filter(Boolean),
      questions: finalQuestions,
      coverImage,
      finalized: false,
      createdAt: new Date().toISOString(),
    };

    // Attempt to persist to Supabase if configured
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
    ) {
      try {
        await supabaseAdmin.from("interviews").insert({
          role: newInterview.role,
          type: newInterview.type,
          level: newInterview.level,
          techstack: newInterview.techstack,
          questions: newInterview.questions,
          finalized: false,
          cover_image: newInterview.coverImage,
          created_at: newInterview.createdAt,
          ...(userId && userId.includes("-") ? { user_id: userId } : {}),
        });
      } catch (dbErr) {
        console.warn("Could not persist interview to Supabase (using in-memory):", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      interview: newInterview,
    });
  } catch (error) {
    console.error("Error creating interview:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate interview. Please try again.",
      },
      { status: 500 }
    );
  }
}
