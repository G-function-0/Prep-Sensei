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

    const prompt = `Interviewer for ${level} ${role}.
Q: "${currentQuestion}"
A: "${candidateAnswer || "(No answer)"}"
${isLastQuestion ? "Final Q: briefly acknowledge (1 sentence), thank them, and invite them to view final scorecard." : `Next Q: "${nextQuestion}". Briefly acknowledge A (1 sentence) and ask Next Q.`}
Plain text only. Max 40 words. No markdown.`;

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
