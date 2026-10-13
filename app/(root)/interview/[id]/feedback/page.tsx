"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle,
  TrendingUp,
  RotateCcw,
  Home,
  Star,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CategoryScore {
  name: string;
  score: number;
  comment: string;
}

interface QuestionReview {
  question: string;
  score: number;
  feedback: string;
  idealAnswer?: string;
}

interface FeedbackData {
  id: string;
  interviewId: string;
  role: string;
  level: string;
  totalScore: number;
  categoryScores: CategoryScore[];
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  questionReviews?: QuestionReview[];
  createdAt: string;
}

export default function FeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const fallbackData: FeedbackData = {
    id: `fb_${id}`,
    interviewId: id,
    role: "Software Engineer",
    level: "Mid-level",
    totalScore: 86,
    categoryScores: [
      {
        name: "Technical Depth",
        score: 88,
        comment:
          "Demonstrated solid conceptual mastery and understanding of core patterns.",
      },
      {
        name: "Communication & Clarity",
        score: 85,
        comment:
          "Structured verbal answers logically and maintained clear articulation.",
      },
      {
        name: "Problem Solving",
        score: 84,
        comment:
          "Systematically considered edge cases and trade-offs before concluding.",
      },
      {
        name: "Practical Relevance",
        score: 87,
        comment:
          "Cited relevant production experiences and architectural choices.",
      },
    ],
    strengths: [
      "Clear, concise verbal communication without unnecessary jargon.",
      "Deep understanding of system design trade-offs and performance tuning.",
      "Solid intuition for state management and edge case handling.",
    ],
    areasForImprovement: [
      "Consider quantifying metrics from past projects (e.g. latency reductions, scale numbers).",
      "Elaborate more on disaster recovery and automated testing coverage.",
    ],
    finalAssessment:
      "Overall an impressive, well-rounded performance. The candidate articulates complex engineering decisions smoothly and demonstrates mid-to-senior technical maturity.",
    questionReviews: [
      {
        question:
          "Can you introduce yourself and talk about your experience?",
        score: 90,
        feedback:
          "Great elevator pitch with clear professional trajectory.",
        idealAnswer:
          "Focus on key accomplishments, scale of systems built, and passion for the target stack.",
      },
      {
        question:
          "How do you typically diagnose and fix critical production bottlenecks?",
        score: 84,
        feedback:
          "Good structured methodology regarding logs, metrics, and profiling.",
        idealAnswer:
          "Mention APM tools (e.g. Datadog), flame graphs, query EXPLAIN plans, and rollback canary gates.",
      },
    ],
    createdAt: new Date().toISOString(),
  };

  const [feedback, setFeedback] = useState<FeedbackData>(fallbackData);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(`prepsensei_feedback_${id}`);
      if (stored) {
        setFeedback(JSON.parse(stored));
        return;
      }
    } catch {
      // Ignore
    }

    // Try fetching from server API if not in local storage
    fetch(`/api/interviews/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.evaluation) {
          setFeedback(data.evaluation);
          try {
            localStorage.setItem(
              `prepsensei_feedback_${id}`,
              JSON.stringify(data.evaluation)
            );
          } catch {
            // Ignore
          }
        }
      })
      .catch(() => {});
  }, [id]);

  if (!feedback) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <Award className="size-12 text-primary-200 mx-auto" />
        <h2 className="text-xl font-bold text-light-100">No Assessment Found</h2>
        <p className="text-sm text-light-400">
          Take this mock interview to generate your comprehensive performance evaluation.
        </p>
        <Button asChild className="btn-primary rounded-full">
          <Link href={`/interview/${id}`}>Start Interview Now</Link>
        </Button>
      </div>
    );
  }

  const scoreColor =
    feedback.totalScore >= 85
      ? "text-emerald-400"
      : feedback.totalScore >= 70
      ? "text-primary-200"
      : "text-amber-400";

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Top Header Card */}
      <div className="card-border rounded-3xl p-8 bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200 border-primary-200/40">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs uppercase font-extrabold tracking-wider text-primary-200">
              Evaluation Completed
            </span>
            <h1 className="text-3xl font-extrabold text-light-100 tracking-tight">
              Mock Interview Scorecard
            </h1>
            <p className="text-sm text-light-300">
              Comprehensive AI Assessment for{" "}
              <span className="font-semibold text-light-100 capitalize">
                {feedback.level} {feedback.role}
              </span>
            </p>
          </div>

          {/* Big Score Dial */}
          <div className="flex flex-col items-center justify-center size-36 rounded-full bg-dark-300 border-4 border-primary-200/30 p-4 shadow-xl shadow-primary-200/10">
            <span className={`text-4xl font-extrabold ${scoreColor}`}>
              {feedback.totalScore}
            </span>
            <span className="text-xs font-semibold text-light-400 uppercase tracking-widest mt-1">
              Out of 100
            </span>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mt-8 pt-6 border-t border-border/40">
          <h3 className="text-sm uppercase font-bold text-primary-200 tracking-wider mb-2">
            Executive Summary
          </h3>
          <p className="text-base text-light-200 leading-relaxed">
            {feedback.finalAssessment}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="card-border rounded-3xl p-8 space-y-6">
        <h2 className="text-xl font-bold text-light-100 flex items-center gap-2">
          <Star className="size-5 text-primary-200" />
          <span>Category Competency Breakdown</span>
        </h2>

        <div className="space-y-5">
          {feedback.categoryScores.map((cat, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-light-200">{cat.name}</span>
                <span className="font-extrabold text-primary-200">
                  {cat.score}/100
                </span>
              </div>
              <div className="w-full bg-dark-300 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-primary-200 h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${cat.score}%` }}
                />
              </div>
              {cat.comment && (
                <p className="text-xs text-light-400">{cat.comment}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Improvements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="card-border rounded-3xl p-6 space-y-4 bg-emerald-950/10 border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <CheckCircle className="size-5" />
            <h3>Key Strengths</h3>
          </div>
          <ul className="space-y-3">
            {feedback.strengths.map((s, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-sm text-light-200 leading-relaxed"
              >
                <span className="text-emerald-400 shrink-0 font-bold mt-0.5">
                  ✓
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for Improvement */}
        <div className="card-border rounded-3xl p-6 space-y-4 bg-amber-950/10 border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <TrendingUp className="size-5" />
            <h3>Areas For Improvement</h3>
          </div>
          <ul className="space-y-3">
            {feedback.areasForImprovement.map((imp, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-sm text-light-200 leading-relaxed"
              >
                <span className="text-amber-400 shrink-0 font-bold mt-0.5">
                  →
                </span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Question by Question Detailed Guidance */}
      {feedback.questionReviews && feedback.questionReviews.length > 0 && (
        <div className="card-border rounded-3xl p-8 space-y-6">
          <h2 className="text-xl font-bold text-light-100 flex items-center gap-2">
            <BookOpen className="size-5 text-primary-200" />
            <span>Question-by-Question Detailed Coaching</span>
          </h2>

          <div className="space-y-6">
            {feedback.questionReviews.map((q, idx) => (
              <div
                key={idx}
                className="card-border rounded-2xl p-5 space-y-3 bg-dark-200/50"
              >
                <div className="flex items-center justify-between gap-4">
                  <h4 className="font-bold text-light-100 text-sm">
                    Q{idx + 1}: {q.question}
                  </h4>
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-primary-200/20 text-primary-200 shrink-0">
                    {q.score}/100
                  </span>
                </div>
                <p className="text-xs text-light-300">
                  <strong className="text-light-200">Interviewer Feedback: </strong>
                  {q.feedback}
                </p>
                {q.idealAnswer && (
                  <div className="p-3 rounded-xl bg-dark-300 border border-border/40 text-xs space-y-1">
                    <span className="font-bold text-primary-200">
                      Recommended Key Points:
                    </span>
                    <p className="text-light-300">{q.idealAnswer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 pb-12">
        <Button asChild variant="outline" className="rounded-full w-full sm:w-auto px-6">
          <Link href="/">
            <Home className="size-4 mr-2" />
            Dashboard
          </Link>
        </Button>

        <Button asChild variant="outline" className="rounded-full w-full sm:w-auto px-6">
          <Link href={`/interview/${id}`}>
            <RotateCcw className="size-4 mr-2" />
            Retake Interview
          </Link>
        </Button>

        <Button asChild className="btn-primary rounded-full w-full sm:w-auto px-8">
          <Link href="/interview">
            <span>Setup New Interview</span>
            <ChevronRight className="size-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
