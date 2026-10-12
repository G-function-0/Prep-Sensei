import { NextResponse } from "next/server";
import { executeWithGeminiKeyRotation } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      role = "Candidate",
      level = "Mid-level",
      questionIndex = 0,
      totalQuestions = 4,
      currentQuestion = "",
      candidateAnswer = "",
      nextQuestion = "",
    } = body;

    const isLastQuestion = questionIndex + 1 >= totalQuestions;

    const prompt = `You are a warm, professional, and insightful technical interviewer conducting a live voice mock interview for a ${level} ${role} role.

Context:
- Current Question asked: "${currentQuestion}"
- Candidate's Spoken Answer: "${candidateAnswer || "(The candidate paused or gave a brief response)"}"
${
  isLastQuestion
    ? "- This was the final question of the interview."
    : `- Next upcoming question: "${nextQuestion}"`
}

Task:
Respond directly to the candidate as the interviewer.
1. Briefly acknowledge their response (1-2 sentences). For example, comment positively on a good detail, ask for a quick clarification, or note their problem-solving mindset.
2. ${
  isLastQuestion
    ? "Conclude the interview warmly, thank them for their time, and invite them to view their complete performance evaluation."
    : `Transition smoothly into the next question: "${nextQuestion}".`
}

CRITICAL RULES FOR VOICE SPEECH SYNTHESIS:
- Output PLAIN TEXT ONLY. No markdown, no asterisks, no bullets, no emojis.
- Keep the entire response under 60 words so it sounds crisp and conversational when read aloud by the computer voice.
- Sound encouraging, realistic, and professional.`;

    const speechText = await executeWithGeminiKeyRotation(async (ai) => {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      return (
        response.text
          ?.replace(/[*#_`]/g, "")
          .trim() ||
        (isLastQuestion
          ? "Thank you for sharing that. That concludes our interview questions today! Let's examine your detailed evaluation report."
          : `Thank you. Now moving on to the next question: ${nextQuestion}`)
      );
    });

    return NextResponse.json({
      success: true,
      interviewerSpeech: speechText,
      isFinished: isLastQuestion,
    });
  } catch (error) {
    console.error("Error evaluating interview turn:", error);
    return NextResponse.json(
      {
        success: false,
        interviewerSpeech:
          "Thank you for sharing your thoughts. Let's move ahead to the next question.",
        error: String(error),
      },
      { status: 200 } // return 200 with fallback speech so voice flow doesn't freeze
    );
  }
}
