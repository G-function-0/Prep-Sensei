"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import {
  Sparkles,
  ArrowRight,
  Code2,
  Briefcase,
  Layers,
  ListOrdered,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ROLE_PRESETS = [
  "Frontend Engineer",
  "Backend Developer",
  "Full Stack Engineer",
  "React & Next.js Specialist",
  "DevOps & Cloud Architect",
  "System Design & Lead",
  "Product Manager",
  "Data Engineer",
];

const TECH_PRESETS = [
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
  "PostgreSQL",
  "Python",
  "Docker",
  "AWS",
  "GraphQL",
  "Tailwind CSS",
  "Redis",
];

export default function SetupInterviewPage() {
  const router = useRouter();
  const [role, setRole] = useState("Frontend Engineer");
  const [level, setLevel] = useState("Mid-level");
  const [type, setType] = useState("Technical");
  const [techstack, setTechstack] = useState<string[]>([
    "React",
    "Next.js",
    "TypeScript",
  ]);
  const [customTech, setCustomTech] = useState("");
  const [amount, setAmount] = useState(4);
  const [focusAreas, setFocusAreas] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleTech = (tech: string) => {
    if (techstack.includes(tech)) {
      setTechstack(techstack.filter((t) => t !== tech));
    } else {
      setTechstack([...techstack, tech]);
    }
  };

  const addCustomTech = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    if (!customTech.trim()) return;
    const clean = customTech.trim();
    if (!techstack.includes(clean)) {
      setTechstack([...techstack, clean]);
    }
    setCustomTech("");
  };

  const handleCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.trim()) {
      toast.error("Please specify a job role.");
      return;
    }

    try {
      setIsGenerating(true);
      toast.loading(
        "Gemini is generating tailored voice interview questions...",
        { id: "gen-interview" }
      );

      const res = await fetch("/api/interviews/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          level,
          type,
          techstack,
          amount,
          focusAreas,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(
          data.message || "Failed to generate interview. Please try again.",
          { id: "gen-interview", duration: 8000 }
        );
        return;
      }

      toast.success("Interview created successfully! Launching session...", {
        id: "gen-interview",
        duration: 3000,
      });

      // Save to localStorage for demo persistence
      if (typeof window !== "undefined" && data.interview) {
        try {
          const stored = localStorage.getItem("prepsensei_interviews");
          const existing = stored ? JSON.parse(stored) : [];
          localStorage.setItem(
            "prepsensei_interviews",
            JSON.stringify([data.interview, ...existing])
          );
          localStorage.setItem(
            `prepsensei_interview_${data.interview.id}`,
            JSON.stringify(data.interview)
          );
        } catch {
          // Ignore
        }
      }

      router.push(`/interview/${data.interview.id}`);
    } catch (err) {
      console.error(err);
      toast.error(`Error generating interview: ${err}`, { id: "gen-interview" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-primary-200">
            Interview Studio
          </span>
          <h1 className="text-3xl font-extrabold text-light-100 tracking-tight mt-1">
            Setup Your AI Mock Interview
          </h1>
          <p className="text-light-300 text-sm mt-1">
            Configure your target role and stack. Our AI interviewer will conduct a live, voice-interactive session.
          </p>
        </div>
        <div className="hidden sm:block">
          <Image src="/robot.png" alt="ai" width={70} height={70} className="opacity-90" />
        </div>
      </div>

      <form onSubmit={handleCreateInterview} className="space-y-8">
        {/* Role Selection */}
        <div className="card-border p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-primary-200 font-semibold">
            <Briefcase className="size-5" />
            <label className="text-base text-light-100">Target Role</label>
          </div>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Senior Frontend Engineer"
            className="w-full bg-dark-200 border border-input rounded-xl px-4 py-3 text-light-100 placeholder:text-light-400 focus:outline-none focus:ring-2 focus:ring-primary-200/50 text-base"
            required
          />
          <div className="space-y-1">
            <span className="text-xs text-light-400 font-medium">Quick suggestions:</span>
            <div className="flex flex-wrap gap-2 pt-1">
              {ROLE_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setRole(p)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                    role === p
                      ? "bg-primary-200/20 border-primary-200 text-primary-200"
                      : "border-border/60 text-light-300 hover:bg-dark-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Level and Type Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seniority Level */}
          <div className="card-border p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-primary-200 font-semibold">
              <Layers className="size-5" />
              <label className="text-base text-light-100">Experience Level</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {["Junior", "Mid-level", "Senior", "Lead / Staff"].map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setLevel(lvl)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                    level === lvl
                      ? "bg-primary-200/20 border-primary-200 text-primary-100 ring-1 ring-primary-200"
                      : "border-border/50 text-light-300 hover:bg-dark-200"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Interview Type */}
          <div className="card-border p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-primary-200 font-semibold">
              <Cpu className="size-5" />
              <label className="text-base text-light-100">Interview Focus</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {["Technical", "Behavioral", "System Design", "Mixed"].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                    type === t
                      ? "bg-primary-200/20 border-primary-200 text-primary-100 ring-1 ring-primary-200"
                      : "border-border/50 text-light-300 hover:bg-dark-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="card-border p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-primary-200 font-semibold">
            <Code2 className="size-5" />
            <label className="text-base text-light-100">Tech Stack & Tools</label>
          </div>

          <div className="flex flex-wrap gap-2">
            {TECH_PRESETS.map((t) => {
              const selected = techstack.includes(t);
              return (
                <button
                  type="button"
                  key={t}
                  onClick={() => toggleTech(t)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    selected
                      ? "bg-primary-200 text-dark-100 font-bold border-primary-200"
                      : "border-border/60 text-light-300 hover:bg-dark-300"
                  }`}
                >
                  {selected ? `✓ ${t}` : `+ ${t}`}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 pt-2">
            <input
              type="text"
              value={customTech}
              onChange={(e) => setCustomTech(e.target.value)}
              onKeyDown={addCustomTech}
              placeholder="Add other tech (e.g. Prisma, Rust, Kubernetes)..."
              className="flex-1 bg-dark-200 border border-input rounded-xl px-4 py-2.5 text-sm text-light-100 placeholder:text-light-400 focus:outline-none focus:ring-2 focus:ring-primary-200/50"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addCustomTech}
              className="rounded-xl"
            >
              Add
            </Button>
          </div>

          {techstack.length > 0 && (
            <p className="text-xs text-light-400">
              Selected: <span className="text-light-200">{techstack.join(", ")}</span>
            </p>
          )}
        </div>

        {/* Questions Count & Focus */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-border p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-primary-200 font-semibold">
              <ListOrdered className="size-5" />
              <label className="text-base text-light-100">Questions</label>
            </div>
            <div className="flex items-center gap-3">
              {[3, 4, 5, 6].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setAmount(num)}
                  className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                    amount === num
                      ? "bg-primary-200 text-dark-100 border-primary-200"
                      : "border-border/60 text-light-300 hover:bg-dark-200"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="text-xs text-light-400">
              Recommended: 4 questions (~10-15 min voice session).
            </p>
          </div>

          <div className="md:col-span-2 card-border p-6 rounded-2xl space-y-2">
            <label className="text-base text-light-100 font-semibold">
              Special Focus / Job Description (Optional)
            </label>
            <textarea
              rows={2}
              value={focusAreas}
              onChange={(e) => setFocusAreas(e.target.value)}
              placeholder="e.g. Focus heavily on React performance, micro-frontends, and system architecture questions..."
              className="w-full bg-dark-200 border border-input rounded-xl p-3 text-sm text-light-100 placeholder:text-light-400 focus:outline-none focus:ring-2 focus:ring-primary-200/50 resize-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={isGenerating}
            className="w-full btn-primary h-14 rounded-2xl text-base font-bold flex items-center justify-center gap-3 cursor-pointer shadow-lg shadow-primary-200/10 hover:shadow-primary-200/25 transition-all"
          >
            <Sparkles className="size-5" />
            <span>
              {isGenerating
                ? "Generating Custom Voice Interview..."
                : "Generate & Start Voice Interview"}
            </span>
            <ArrowRight className="size-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}