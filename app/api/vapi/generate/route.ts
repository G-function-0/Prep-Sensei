import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { GenerateContentResponse, GoogleGenAI } from "@google/genai";

export async function GET() {
  return Response.json({ success: true, data: "THANK YOU!" }, { status: 200 });
}

export async function POST(request: Request) {
  const { type, role, level, techstack, amount, userid } = await request.json();

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = apiKey ? new GoogleGenAI({ apiKey }) : new GoogleGenAI({});

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Prepare questions for a job interview.
The job role is ${role}.
The job experience level is ${level}.
The tech stack used in the job is: ${techstack}.
The focus between behavioural and technical questions should lean towards: ${type}.
The amount of questions required is: ${amount}.
Please return only the questions, without any additional text.
The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
Return the questions formatted strictly as a JSON array of strings like this:
["Question 1", "Question 2", "Question 3"]

Thank you!`,
    });

    const normalizedResponse = response.text;
    if (!normalizedResponse) {
      return Response.json(
        { success: false, error: "No text returned from Gemini" },
        { status: 500 }
      );
    }

    let cleanedText = normalizedResponse.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "");
    }

    let questions: string[] = [];
    try {
      questions = JSON.parse(cleanedText);
    } catch {
      questions = cleanedText
        .split("\n")
        .map((q) => q.trim().replace(/^[-*•\d.]+\s*/, ""))
        .filter((q) => q.length > 0);
    }

    const interview = {
      role: role || "Software Engineer",
      type: type || "Technical",
      level: level || "Mid-level",
      techstack:
        typeof techstack === "string"
          ? techstack.split(",").map((s: string) => s.trim())
          : techstack || [],
      questions,
      userId: userid || "user_demo",
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    const isSupabaseLive = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
    );

    if (isSupabaseLive) {
      try {
        const { error } = await supabaseAdmin.from("interviews").insert({
          role: interview.role,
          type: interview.type,
          level: interview.level,
          techstack: interview.techstack,
          questions: interview.questions,
          user_id: interview.userId,
          finalized: interview.finalized,
          cover_image: interview.coverImage,
          created_at: interview.createdAt,
        });
        if (error) {
          console.warn("Supabase interview insert error:", error);
        }
      } catch (dbErr) {
        console.warn("Failed saving interview to Supabase:", dbErr);
      }
    }

    return Response.json({ success: true, interview }, { status: 200 });
  } catch (error) {
    console.error("Error generating interview:", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}