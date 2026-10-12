import { getCurrentUser } from "@/lib/auth.action";
import { dummyInterviews } from "@/constants";
import { supabaseAdmin } from "@/lib/supabase/admin";
import VoiceInterviewSession from "@/components/VoiceInterviewSession";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InterviewSessionPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Find in dummy interviews
  let interviewData = dummyInterviews.find((d) => d.id === id);

  // If not found in dummy, try querying Supabase
  if (
    !interviewData &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
  ) {
    try {
      const { data } = await supabaseAdmin
        .from("interviews")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (data) {
        interviewData = {
          id: data.id,
          userId: data.user_id || user.id,
          role: data.role,
          type: data.type,
          level: data.level,
          techstack: data.techstack || [],
          questions: Array.isArray(data.questions)
            ? data.questions
            : JSON.parse(data.questions || "[]"),
          finalized: data.finalized || false,
          createdAt: data.created_at,
        };
      }
    } catch (e) {
      console.warn("Could not query interview by ID:", e);
    }
  }

  // Fallback defaults if new or demo ID
  if (!interviewData) {
    interviewData = {
      id,
      userId: user.id,
      role: id === "2" ? "Full Stack Developer" : "Frontend Engineer",
      level: "Mid-level",
      type: "Technical",
      techstack: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
      questions: [
        "Can you introduce yourself and walk me through your technical background and experience?",
        "How do you manage complex application state and side effects in React applications?",
        "Can you discuss a time you had to diagnose and resolve a severe performance bottleneck or memory leak?",
        "How do you approach writing testable, clean code when working within high-velocity teams?",
      ],
      finalized: false,
      createdAt: new Date().toISOString(),
    };
  }

  return (
    <VoiceInterviewSession
      interview={interviewData}
      userName={user.name || "Candidate"}
    />
  );
}
