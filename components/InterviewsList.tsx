"use client";

import { useState } from "react";
import InterviewCard from "./InterviewCard";
import { PlusCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

interface InterviewItem {
  id: string;
  interviewId?: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  createdAt?: string;
  coverImage?: string;
}

interface Props {
  initialInterviews: InterviewItem[];
  title?: string;
}

export default function InterviewsList({
  initialInterviews = [],
  title = "Your Past Interviews",
}: Props) {
  const [interviews] = useState<InterviewItem[]>(() => {
    if (typeof window === "undefined") return initialInterviews;
    try {
      const stored = localStorage.getItem("prepsensei_interviews");
      if (stored) {
        const parsed: InterviewItem[] = JSON.parse(stored);
        const existingIds = new Set(
          initialInterviews.map((i) => i.id || i.interviewId)
        );
        const newItems = parsed.filter((i) => !existingIds.has(i.id));
        return [...newItems, ...initialInterviews];
      }
    } catch {
      // Ignore
    }
    return initialInterviews;
  });

  return (
    <section className="flex flex-col gap-6 mt-8">
      <div className="flex items-center justify-between">
        <h2>{title}</h2>
        <Button asChild variant="outline" size="sm" className="rounded-full gap-1.5 border-primary-200/40 text-primary-200 hover:bg-primary-200/10">
          <Link href="/interview">
            <PlusCircle className="size-4" />
            <span>Setup New</span>
          </Link>
        </Button>
      </div>

      <div className="interviews-section">
        {interviews.length > 0 ? (
          interviews.map((interview) => (
            <InterviewCard
              {...interview}
              interviewId={interview.id || interview.interviewId}
              key={interview.id || interview.interviewId}
            />
          ))
        ) : (
          <div className="card-border p-8 rounded-2xl text-center space-y-3 w-full max-w-md">
            <Sparkles className="size-8 text-primary-200 mx-auto" />
            <h3 className="text-base font-bold text-light-100">No interviews created yet</h3>
            <p className="text-xs text-light-400">
              Set up your first AI mock interview and start practicing in minutes!
            </p>
            <Button asChild className="btn-primary rounded-full mt-2" size="sm">
              <Link href="/interview">Setup First Interview</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
