# Prep-Sensei Project Analysis & Implementation Status

## 1. Project Overview
Prep-Sensei is an AI-powered voice mock interview platform built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Supabase (Authentication & PostgreSQL), and Google Gemini API (`@google/genai`).

## 2. Architecture & Data Flow
- **Authentication**:
  - Supabase Auth (Email + Google OAuth) for registered users.
  - Demo Candidate mode (`/api/auth/demo` and cookie `prepsensei_demo_session`) for friction-free instant testing.
  - Automatic fallback to demo session when Supabase is offline or unconfigured.
- **Interview Generation**:
  - `app/api/interviews/create/route.ts`: Generates tailored interview questions based on candidate role, level, type, tech stack, and focus area.
  - Multi-key rotation with automatic failover across a pool of Gemini API keys (`GEMINI_API_KEYS` / `GEMINI_API_KEY_1..10`).
  - Graceful fallback generator in case of total quota exhaustion.
  - Generates standard UUIDs and stores new interviews in `lib/interviews-store.ts` memory cache and Supabase.
- **Voice Interview Flow**:
  - Client component `VoiceInterviewSession.tsx` conducts live turn-by-turn interview.
  - **Speech-to-Text (STT)**: Web SpeechRecognition API (`webkitSpeechRecognition`) transcribes candidate speech directly in real-time, with manual text-editing support and start/pause toggle.
  - **Text-to-Speech (TTS)**: Web `speechSynthesis` API vocalizes interviewer greeting, questions, and conversational feedback.
  - **Turn Progression**: `app/api/interviews/turn/route.ts` acknowledges candidate's answers and transitions to next question using Gemini (`gemini-3.8-flash`).
  - **Autoplay/Audio Protection**: Interactive "Start Voice Interview" gate ensures user gesture unlocks browser TTS and STT permissions without browser blocking.
  - **Mic Echo Suppression**: Microphone transcription automatically pauses while AI interviewer is speaking.
- **Evaluation & Feedback**:
  - `app/api/interviews/evaluate/route.ts`: Evaluates full interview transcript with multi-category scoring (Technical Depth, Communication, Problem Solving, Practical Relevance), strengths, areas for improvement, and per-question reviews.
  - `app/(root)/interview/[id]/feedback/page.tsx`: Interactive feedback report display with score cards and breakdown.

## 3. Gemini API Key Management
- Multiple keys can be supplied via:
  - `GEMINI_API_KEYS`: Comma-separated list (`key1,key2,key3,key4,key5`).
  - `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`, etc.
  - `GEMINI_API_KEY`: Single default key.
- `executeWithGeminiKeyRotation` handles round-robin selection, tracks 60s cooldown on HTTP 429/ResourceExhausted quota errors, and automatically fails over to next available key without interrupting the user.
- Fixed cooldown deadlock: If all keys are marked on cooldown, cooldowns are reset and keys are retried immediately rather than skipping all requests.

## 4. Status of Completed Fixes
1. **Gemini Key Pool & Failover**: Tested and verified working with `gemini-3.8-flash`. Failover and cooldown recovery functioning.
2. **Interview Persistence & Hydration**:
   - Implemented `lib/interviews-store.ts` shared memory store.
   - Created `/api/interviews/[id]` endpoint.
   - Enhanced `VoiceInterviewSession.tsx` and `InterviewsList.tsx` with local storage hydration so newly created interviews preserve custom role, stack, and questions.
3. **Voice Interview Flow**:
   - Two-way voice working: Web SpeechRecognition for candidate input and SpeechSynthesis for interviewer output.
   - Integrated start gate to bypass browser autoplay restrictions.
   - Echo suppression added to mute STT during TTS playback.
4. **All Endpoints Verified**:
   - `POST /api/interviews/create` verified (status 200).
   - `GET /api/interviews/[id]` verified (status 200).
   - `POST /api/interviews/turn` verified (status 200).
   - `POST /api/interviews/evaluate` verified (status 200).

## 5. Codebase Cleanup (Vapi & Firebase Removal)
1. **Removed Vapi & Firebase**:
   - Deleted unused [lib/vapi.sdk.ts](file:///c:/Users/mirro/Desktop/Project%20Sundar/Madigineer/Prep-Sensei/lib/vapi.sdk.ts).
   - Deleted obsolete route directory `app/api/vapi/` (superseded by `/api/interviews/create`).
   - Deleted unused [components/Agent.tsx](file:///c:/Users/mirro/Desktop/Project%20Sundar/Madigineer/Prep-Sensei/components/Agent.tsx) mockup component.
   - Removed obsolete `AgentProps` from [types/index.d.ts](file:///c:/Users/mirro/Desktop/Project%20Sundar/Madigineer/Prep-Sensei/types/index.d.ts).
   - Cleaned commented-out Vapi imports and dead assistant schemas in [constants/index.ts](file:///c:/Users/mirro/Desktop/Project%20Sundar/Madigineer/Prep-Sensei/constants/index.ts).
   - Uninstalled `@vapi-ai/web` package dependency from `package.json`.
   - Verified 0 remaining traces of `vapi` and `firebase` in codebase.
2. **TypeScript & Build Health**:
   - Fixed missing generic type parameter on [components/FormField.tsx](file:///c:/Users/mirro/Desktop/Project%20Sundar/Madigineer/Prep-Sensei/components/FormField.tsx).
   - Executed `tsc --noEmit` and confirmed zero compiler/type errors.

