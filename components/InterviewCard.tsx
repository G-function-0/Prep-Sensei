"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "./ui/button";
import dayjs from "dayjs";
import { cn, getRandomInterviewCover } from "@/lib/utils";
import Link from "next/link";
import DisplayTechIcons from "./DisplayTechIcons";

interface Props extends InterviewCardProps {
  id?: string;
  coverImage?: string;
}

const InterviewCard = ({
  id,
  interviewId,
  type,
  techstack = [],
  role,
  createdAt,
  coverImage,
}: Props) => {
  const actualId = interviewId || id || "1";
  const [feedback] = useState<Feedback | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(`prepsensei_feedback_${actualId}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const normalizedType = /mix/gi.test(type || "") ? "Mixed" : type || "Technical";

  const badgeColor =
    {
      Behavioral: "bg-light-400",
      Mixed: "bg-light-600",
      Technical: "bg-light-800",
    }[normalizedType] || "bg-light-600";

  const rawDate = feedback?.createdAt || createdAt;
  const formattedDate = rawDate ? dayjs(rawDate).format("MMM D, YYYY") : "Recently";

  return (
    <div className="card-border w-[360px] max-sm:w-full min-h-96">
      <div className="card-interview">
        <div>
          <div
            className={cn(
              "absolute top-0 right-0 w-fit px-4 py-2 rounded-bl-lg",
              badgeColor
            )}
          >
            <p className="badge-text">{normalizedType}</p>
          </div>

          <Image
            src={coverImage || getRandomInterviewCover()}
            alt="Company logo"
            width={90}
            height={90}
            className="rounded-full object-cover size-[90px]"
          />

          <h3 className="mt-5 capitalize">{role} Interview</h3>

          <div className="flex flex-row gap-5 mt-3">
            <div className="flex flex-row gap-2">
              <Image src="/calendar.svg" alt="date" width={22} height={22} />
              <p>{formattedDate}</p>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <Image src="/star.svg" alt="score" width={22} height={22} />
              <p>{feedback?.totalScore ? `${feedback.totalScore}/100` : "---/100"}</p>
            </div>
          </div>

          <p className="line-clamp-2 mt-5 text-sm text-light-300">
            {feedback?.finalAssessment ||
              "Ready to practice? Launch your AI mock interview session with voice guidance."}
          </p>
        </div>

        <div className="flex flex-row items-center justify-between mt-4">
          <DisplayTechIcons techStack={techstack} />

          <div className="flex gap-2">
            {feedback && (
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href={`/interview/${actualId}/feedback`}>Feedback</Link>
              </Button>
            )}
            <Button asChild className="btn-primary rounded-full" size="sm">
              <Link href={`/interview/${actualId}`}>
                {feedback ? "Retake" : "Start"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;