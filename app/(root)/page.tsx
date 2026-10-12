import InterviewCard from "@/components/InterviewCard";
import InterviewsList from "@/components/InterviewsList";
import { Button } from "@/components/ui/button";
import { dummyInterviews } from "@/constants";
import Image from "next/image";
import Link from "next/link";
import { PlusCircle, Mic } from "lucide-react";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const curatedTemplates = [
    {
      id: "1",
      role: "Frontend Engineer",
      type: "Technical",
      level: "Junior",
      techstack: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
      createdAt: "2024-03-15T10:00:00Z",
    },
    {
      id: "2",
      role: "Full Stack Developer",
      type: "Mixed",
      level: "Senior",
      techstack: ["Node.js", "Express", "MongoDB", "React"],
      createdAt: "2024-03-14T15:30:00Z",
    },
    {
      id: "template_sys_design",
      role: "System Design & Cloud",
      type: "Technical",
      level: "Senior",
      techstack: ["PostgreSQL", "Docker", "AWS", "Redis"],
      createdAt: "2024-03-12T12:00:00Z",
    },
    {
      id: "template_behavioral",
      role: "Engineering Lead",
      type: "Behavioral",
      level: "Lead",
      techstack: ["Leadership", "STAR Method", "Conflict Resolution"],
      createdAt: "2024-03-10T09:00:00Z",
    },
  ];

  return (
    <>
      {/* Hero CTA */}
      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary-200/15 text-primary-200 border border-primary-200/30 w-fit">
            <Mic className="size-3.5" />
            <span>Real-time Voice AI Interviewer</span>
          </div>

          <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
          <p className="text-lg">
            Practice real spoken interview questions with our interactive AI interviewer. Speak naturally and get instant scoring and coaching.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild className="btn-primary max-sm:w-full h-12 px-6 rounded-full font-bold">
              <Link href="/interview">
                <PlusCircle className="size-4 mr-2" />
                Setup Custom Interview
              </Link>
            </Button>
            <Button asChild variant="outline" className="max-sm:w-full h-12 px-6 rounded-full border-border/60 text-light-200 hover:bg-dark-200">
              <Link href="/interview/1">
                <span>Try Quick Demo Interview</span>
              </Link>
            </Button>
          </div>
        </div>
        <Image
          src="/robot.png"
          alt="robo-dude"
          width={400}
          height={400}
          className="max-sm:hidden object-contain"
        />
      </section>

      {/* Your Interviews (Dynamic from DB & LocalStorage) */}
      <InterviewsList
        initialInterviews={dummyInterviews.map((d) => ({
          ...d,
          interviewId: d.id,
        }))}
        title="Your Past & Created Interviews"
      />

      {/* Featured Templates */}
      <section className="flex flex-col gap-6 mt-12 mb-16">
        <div className="flex items-center justify-between">
          <div>
            <h2>Instant Practice Interviews</h2>
            <p className="text-xs text-light-400 mt-1">
              Jump straight into curated voice sessions for popular tech stacks.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/interview">Create Custom</Link>
          </Button>
        </div>

        <div className="interviews-section">
          {curatedTemplates.map((interview) => (
            <InterviewCard
              {...interview}
              interviewId={interview.id}
              key={interview.id}
            />
          ))}
        </div>
      </section>
    </>
  );
}