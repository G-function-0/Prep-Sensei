"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Award,
  Bot,
  User,
  Radio,
  Play,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal?: boolean;
    };
  };
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

interface Props {
  interview: {
    id: string;
    role: string;
    level: string;
    type: string;
    techstack: string[];
    questions: string[];
  };
  userName?: string;
}

export default function VoiceInterviewSession({
  interview: initialInterview,
  userName = "Candidate",
}: Props) {
  const router = useRouter();

  // Synchronize interview state with local storage for demo persistence
  const [interview, setInterview] = useState(initialInterview);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(
          `prepsensei_interview_${initialInterview.id}`
        );
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            setInterview(parsed);
          }
        }
      } catch (err) {
        console.warn("Could not retrieve interview from local storage:", err);
      }
    }
  }, [initialInterview.id]);

  const questions = interview.questions && interview.questions.length > 0
    ? interview.questions
    : [
        "Can you introduce yourself and talk about your experience and background?",
        "How do you manage complex application state, side effects, and re-rendering performance?",
        "Can you walk me through your strategy for diagnosing and fixing critical production bottlenecks?",
        "How do you maintain high code quality and resilience within fast-moving engineering teams?",
      ];

  const [hasStarted, setHasStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [candidateAnswer, setCandidateAnswer] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isTtsMuted, setIsTtsMuted] = useState(false);
  const [completedTurns, setCompletedTurns] = useState<
    Array<{ question: string; answer: string; feedback?: string }>
  >([]);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [interviewerMessage, setInterviewerMessage] = useState<string>("");

  const [speechSupported, setSpeechSupported] = useState<boolean>(true);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const isListeningRef = useRef(false);
  const ttsMutedRef = useRef(false);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    ttsMutedRef.current = isTtsMuted;
  }, [isTtsMuted]);

  useEffect(() => {
    hasStartedRef.current = hasStarted;
  }, [hasStarted]);

  const currentQuestion = questions[currentIndex] || "";
  const progressPercent = Math.round(
    ((currentIndex + 1) / questions.length) * 100
  );

  // Initialize Speech Synthesis (TTS)
  const speakText = useCallback((text: string, onDone?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (onDone) onDone();
      return;
    }

    // Pause mic while AI speaks to avoid feedback echo
    if (recognitionRef.current && isListeningRef.current) {
      try {
        isListeningRef.current = false;
        recognitionRef.current.stop();
        setIsListening(false);
      } catch {
        // Ignore
      }
    }

    window.speechSynthesis.cancel();

    if (ttsMutedRef.current) {
      if (onDone) onDone();
      return;
    }

    const cleanText = text.replace(/[*#_`]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick best natural English voice
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice =
      voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Natural") ||
            v.name.includes("Google") ||
            v.name.includes("Samantha") ||
            v.name.includes("Zira") ||
            v.name.includes("Jenny"))
      ) || voices.find((v) => v.lang.startsWith("en"));

    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onstart = () => setIsAiSpeaking(true);

    const finishSpeaking = () => {
      setIsAiSpeaking(false);
      if (onDone) onDone();

      // Automatically restart listening after interviewer finishes speaking
      if (recognitionRef.current && hasStartedRef.current) {
        try {
          isListeningRef.current = true;
          recognitionRef.current.start();
          setIsListening(true);
        } catch {
          // Already listening
        }
      }
    };

    utterance.onend = finishSpeaking;
    utterance.onerror = finishSpeaking;

    window.speechSynthesis.speak(utterance);
  }, []);

  // Initialize Speech Recognition (STT)
  useEffect(() => {
    if (typeof window === "undefined") return;

    type SpeechConstructor = new () => SpeechRecognitionLike;
    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: SpeechConstructor;
      webkitSpeechRecognition?: SpeechConstructor;
    };
    const SpeechRecognition =
      windowWithSpeech.SpeechRecognition ||
      windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      console.warn("Web SpeechRecognition is not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + " ";
        }
        setCandidateAnswer(transcript.trim());
      };

      recognition.onerror = (event: { error: string }) => {
        console.warn("Speech recognition notice:", event.error);
        if (event.error === "not-allowed") {
          toast.error(
            "Microphone permission blocked. You can still type your answers directly."
          );
          setIsListening(false);
          isListeningRef.current = false;
        }
      };

      recognition.onend = () => {
        // Auto-restart if we are still expected to be listening and not AI speaking
        if (isListeningRef.current && !ttsMutedRef.current) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
            isListeningRef.current = false;
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn("Could not start speech recognition:", e);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handler to start the interview session (unblocks browser audio policies)
  const handleStartSession = () => {
    setHasStarted(true);
    hasStartedRef.current = true;

    const greeting = `Hello ${userName}! Welcome to your ${interview.level} ${interview.role} interview. Let's begin with our first question: ${currentQuestion}`;

    setInterviewerMessage(greeting);
    speakText(greeting, () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
          isListeningRef.current = true;
        } catch {
          // Ignore
        }
      }
    });
  };

  // Speak next question when question index advances
  useEffect(() => {
    if (!hasStarted || currentIndex === 0 || !currentQuestion) return;

    const timer = setTimeout(() => {
      const promptText = `Question ${currentIndex + 1}: ${currentQuestion}`;
      setInterviewerMessage(currentQuestion);
      speakText(promptText, () => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
            setIsListening(true);
            isListeningRef.current = true;
          } catch {
            // Ignore
          }
        }
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [currentIndex, currentQuestion, hasStarted, speakText]);

  // Toggle microphone manually
  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.info(
        "Microphone transcription is not supported in this browser. Please type your response directly in the answer box."
      );
      return;
    }

    if (isListening) {
      isListeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
      toast.info("Microphone paused.");
    } else {
      try {
        isListeningRef.current = true;
        recognitionRef.current.start();
        setIsListening(true);
        toast.success("Listening... speak your answer now.");
      } catch (err) {
        console.warn("Speech start err:", err);
      }
    }
  };

  // Finish early and evaluate
  const handleFinishEvaluation = async (
    turnsToEvaluate = completedTurns
  ) => {
    try {
      setIsSubmittingFinal(true);
      toast.loading(
        "Gemini is analyzing your full voice interview transcript & scoring performance...",
        { id: "eval-interview" }
      );

      const allTurns =
        turnsToEvaluate.length > 0
          ? turnsToEvaluate
          : candidateAnswer.trim()
          ? [
              {
                question: currentQuestion,
                answer: candidateAnswer.trim(),
              },
            ]
          : [
              {
                question: currentQuestion,
                answer: "Candidate completed preliminary discussion.",
              },
            ];

      const res = await fetch("/api/interviews/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId: interview.id,
          role: interview.role,
          level: interview.level,
          type: interview.type,
          techstack: interview.techstack,
          turns: allTurns,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to generate evaluation report.", {
          id: "eval-interview",
        });
        return;
      }

      toast.success("Interview completed! Loading your evaluation report...", {
        id: "eval-interview",
      });

      if (typeof window !== "undefined" && data.feedback) {
        localStorage.setItem(
          `prepsensei_feedback_${interview.id}`,
          JSON.stringify(data.feedback)
        );
      }

      router.push(`/interview/${interview.id}/feedback`);
    } catch (err) {
      console.error(err);
      toast.error(`Error completing evaluation: ${err}`, {
        id: "eval-interview",
      });
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  // Submit Answer & Proceed
  const handleSubmitTurn = async () => {
    if (recognitionRef.current && isListening) {
      isListeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const answer = candidateAnswer.trim();
    if (!answer) {
      toast.error("Please speak or type an answer before proceeding.");
      return;
    }

    try {
      setIsAiThinking(true);
      const isLast = currentIndex + 1 >= questions.length;
      const nextQ = isLast ? "" : questions[currentIndex + 1];

      const res = await fetch("/api/interviews/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: interview.role,
          level: interview.level,
          questionIndex: currentIndex,
          totalQuestions: questions.length,
          currentQuestion,
          candidateAnswer: answer,
          nextQuestion: nextQ,
        }),
      });

      const data = await res.json();
      const feedbackText =
        data.interviewerSpeech ||
        (isLast
          ? "Thank you! That completes all questions for this session."
          : `Thank you. Now moving on: ${nextQ}`);

      const updatedTurns = [
        ...completedTurns,
        {
          question: currentQuestion,
          answer,
          feedback: feedbackText,
        },
      ];
      setCompletedTurns(updatedTurns);
      setInterviewerMessage(feedbackText);

      // Reset candidate answer for the next question
      setCandidateAnswer("");

      if (isLast) {
        await handleFinishEvaluation(updatedTurns);
      } else {
        speakText(feedbackText, () => {
          setCurrentIndex((prev) => prev + 1);
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error processing answer. Moving ahead...");
      setCandidateAnswer("");
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
      }
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Top Header & Progress */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-primary-200">
              Live Mock Interview
            </span>
            <span className="text-xs text-light-400">•</span>
            <span className="text-xs text-light-300 font-medium capitalize">
              {interview.level} {interview.role} ({interview.type})
            </span>
          </div>
          <h2 className="text-2xl font-bold text-light-100 mt-1">
            Question {currentIndex + 1} of {questions.length}
          </h2>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Mute TTS button */}
          <button
            type="button"
            onClick={() => {
              const nextState = !isTtsMuted;
              setIsTtsMuted(nextState);
              ttsMutedRef.current = nextState;
              if (nextState && typeof window !== "undefined") {
                window.speechSynthesis.cancel();
              }
              toast.info(nextState ? "AI Voice muted" : "AI Voice unmuted");
            }}
            className="p-2.5 rounded-full border border-border/60 hover:bg-dark-300 text-light-300 transition-colors cursor-pointer"
            title={isTtsMuted ? "Unmute AI Voice" : "Mute AI Voice"}
          >
            {isTtsMuted ? (
              <VolumeX className="size-4 text-destructive-100" />
            ) : (
              <Volume2 className="size-4 text-primary-200" />
            )}
          </button>

          {/* Replay Question */}
          <button
            type="button"
            onClick={() => speakText(currentQuestion)}
            disabled={isAiSpeaking || !hasStarted}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border border-border/60 hover:bg-dark-300 text-light-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="size-3.5" />
            <span>Replay Audio</span>
          </button>

          {/* End Interview Early */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleFinishEvaluation()}
            disabled={isSubmittingFinal}
            className="rounded-full text-xs text-destructive-100 hover:bg-destructive-100/10 border-destructive-100/30"
          >
            End & Evaluate
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-dark-300 rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary-200 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Pre-Session Start Banner if not started */}
      {!hasStarted ? (
        <div className="card-border rounded-3xl p-8 bg-gradient-to-br from-dark-200 via-dark-300 to-dark-200 text-center space-y-6 shadow-xl border-primary-200/30">
          <div className="size-20 rounded-full bg-primary-200/10 border border-primary-200/30 flex items-center justify-center mx-auto text-primary-200">
            <Mic className="size-10" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="text-2xl font-extrabold text-light-100">
              Ready for your {interview.role} interview?
            </h3>
            <p className="text-sm text-light-300 leading-relaxed">
              Your voice session will be conducted by our AI interviewer.
              When you click Start, the interviewer will speak the first question aloud. You can speak into your microphone or type your responses.
            </p>
          </div>

          {interview.techstack && interview.techstack.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
              {interview.techstack.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-dark-100 text-primary-200 border border-primary-200/30"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              type="button"
              onClick={handleStartSession}
              className="btn-primary h-14 px-8 rounded-full text-base font-bold flex items-center gap-3 shadow-lg shadow-primary-200/20 hover:scale-105 transition-all cursor-pointer"
            >
              <Play className="size-5 fill-dark-100" />
              <span>Start Voice Interview</span>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-light-400 pt-2">
            <span className="flex items-center gap-1.5">
              <Check className="size-3.5 text-emerald-400" />
              Web Speech-to-Text
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="size-3.5 text-emerald-400" />
              Instant Voice Response
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="size-3.5 text-emerald-400" />
              Comprehensive Scoring
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Split Interactive Call Stage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: AI Interviewer */}
            <div
              className={`card-border rounded-3xl p-8 flex flex-col items-center justify-between text-center min-h-[340px] transition-all duration-300 ${
                isAiSpeaking
                  ? "ring-2 ring-primary-200/60 shadow-lg shadow-primary-200/10"
                  : ""
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-light-400">
                <Bot className="size-4 text-primary-200" />
                <span>AI INTERVIEWER</span>
              </div>

              <div className="relative my-4">
                <div className="relative size-32 rounded-full overflow-hidden border-2 border-primary-200/40 p-1 bg-dark-300">
                  <Image
                    src="/robot.png"
                    alt="AI Interviewer"
                    width={128}
                    height={128}
                    className="rounded-full object-contain size-full"
                  />
                </div>
                {isAiSpeaking && (
                  <span className="absolute -inset-2 rounded-full border-2 border-primary-200 animate-ping opacity-75" />
                )}
              </div>

              <div className="space-y-2 w-full flex flex-col items-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-dark-300/80 border border-border/40">
                  {isAiSpeaking ? (
                    <>
                      <Radio className="size-3 text-primary-200 animate-pulse" />
                      <span className="text-primary-200">Speaking to you...</span>
                    </>
                  ) : isAiThinking ? (
                    <>
                      <Sparkles className="size-3 text-secondary animate-spin" />
                      <span className="text-secondary">Thinking...</span>
                    </>
                  ) : isListening ? (
                    <>
                      <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-400">Listening to you</span>
                    </>
                  ) : (
                    <span className="text-light-400">Ready</span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-light-100">Senior AI Interviewer</h3>

                {interviewerMessage && (
                  <div className="p-3 rounded-2xl bg-dark-200/90 border border-primary-200/20 text-xs text-light-300 max-w-sm line-clamp-3 italic">
                    &ldquo;{interviewerMessage}&rdquo;
                  </div>
                )}
              </div>
            </div>

            {/* Right: Candidate */}
            <div
              className={`card-border rounded-3xl p-8 flex flex-col items-center justify-between text-center min-h-[340px] transition-all duration-300 ${
                isListening
                  ? "ring-2 ring-emerald-400/60 shadow-lg shadow-emerald-400/10"
                  : ""
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-light-400">
                <User className="size-4 text-emerald-400" />
                <span>CANDIDATE</span>
              </div>

              <div className="relative my-4">
                <div className="relative size-32 rounded-full overflow-hidden border-2 border-emerald-400/40 p-1 bg-dark-300 flex items-center justify-center">
                  <div className="size-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-3xl">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                </div>
                {isListening && (
                  <span className="absolute -inset-2 rounded-full border-2 border-emerald-400 animate-ping opacity-75" />
                )}
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-dark-300/80 border border-border/40">
                  {isListening ? (
                    <>
                      <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-emerald-400">Microphone Active</span>
                    </>
                  ) : (
                    <span className="text-light-400">Microphone Paused</span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-light-100">{userName}</h3>
              </div>
            </div>
          </div>

          {/* Current Question Banner */}
          <div className="card-border rounded-2xl p-6 bg-gradient-to-r from-dark-200 to-dark-100 border-primary-200/30">
            <span className="text-xs uppercase font-bold tracking-wider text-primary-200">
              Current Question
            </span>
            <p className="text-xl sm:text-2xl font-bold text-light-100 mt-2 leading-relaxed">
              &ldquo;{currentQuestion}&rdquo;
            </p>
          </div>

          {/* Candidate Live Transcription & Answer Box */}
          <div className="card-border rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-light-100">
                  Your Answer Transcription
                </span>
                {isListening && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live transcribing
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={isListening ? "default" : "outline"}
                  size="sm"
                  onClick={toggleListening}
                  className={`rounded-full gap-2 cursor-pointer ${
                    isListening
                      ? "bg-emerald-500 hover:bg-emerald-600 text-dark-100 font-bold"
                      : "border-primary-200/40 text-primary-200"
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="size-4" />
                      <span>Pause Mic</span>
                    </>
                  ) : (
                    <>
                      <Mic className="size-4" />
                      <span>Start Speaking</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <textarea
              rows={4}
              value={candidateAnswer}
              onChange={(e) => setCandidateAnswer(e.target.value)}
              placeholder={
                speechSupported
                  ? "Click 'Start Speaking' and speak your answer. Your speech will be transcribed in real-time (you can also edit or type directly)..."
                  : "Type your answer here..."
              }
              className="w-full bg-dark-300 border border-input rounded-xl p-4 text-base text-light-100 placeholder:text-light-400 focus:outline-none focus:ring-2 focus:ring-primary-200/50 resize-y leading-relaxed"
            />

            {/* Action Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <p className="text-xs text-light-400">
                {currentIndex + 1 === questions.length
                  ? "Final question! Submitting will finalize your interview evaluation."
                  : "Speak clearly. When satisfied, click Submit to hear the interviewer's feedback."}
              </p>

              <Button
                type="button"
                onClick={handleSubmitTurn}
                disabled={isAiThinking || isSubmittingFinal || !candidateAnswer.trim()}
                className="w-full sm:w-auto btn-primary px-8 h-12 rounded-full text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
              >
                {isAiThinking || isSubmittingFinal ? (
                  <>
                    <Sparkles className="size-4 animate-spin" />
                    <span>Evaluating Response...</span>
                  </>
                ) : currentIndex + 1 >= questions.length ? (
                  <>
                    <Award className="size-4" />
                    <span>Submit & View Final Score</span>
                  </>
                ) : (
                  <>
                    <span>Submit Answer</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Completed Transcript History */}
          {completedTurns.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border/40">
              <h4 className="text-sm uppercase font-bold text-light-300 tracking-wider">
                Previous Questions ({completedTurns.length})
              </h4>
              <div className="space-y-3">
                {completedTurns.map((turn, idx) => (
                  <div
                    key={idx}
                    className="card-border rounded-xl p-4 text-sm space-y-2 bg-dark-200/50"
                  >
                    <div className="flex items-center gap-2 font-semibold text-primary-200">
                      <CheckCircle2 className="size-4 text-primary-200" />
                      <span>Q{idx + 1}: {turn.question}</span>
                    </div>
                    <p className="text-light-300 pl-6 border-l border-border/40">
                      <span className="font-medium text-light-100">You: </span>
                      {turn.answer}
                    </p>
                    {turn.feedback && (
                      <p className="text-xs text-light-400 pl-6 italic">
                        <span className="font-medium text-primary-200 not-italic">
                          AI Interviewer:{" "}
                        </span>
                        {turn.feedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
