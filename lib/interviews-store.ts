// In-memory persistent cache for created interviews across sessions
export interface StoredInterview {
  id: string;
  userId: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  questions: string[];
  coverImage?: string;
  finalized: boolean;
  createdAt: string;
}

// Global declaration to survive Next.js dev server hot reload
declare global {
  // eslint-disable-next-line no-var
  var __prepsensei_interviews: Map<string, StoredInterview> | undefined;
}

if (!global.__prepsensei_interviews) {
  global.__prepsensei_interviews = new Map<string, StoredInterview>();
}

export const interviewsStore = global.__prepsensei_interviews;

// In-memory persistent cache for feedback evaluations
declare global {
  // eslint-disable-next-line no-var
  var __prepsensei_evaluations: Map<string, any> | undefined;
}

if (!global.__prepsensei_evaluations) {
  global.__prepsensei_evaluations = new Map<string, any>();
}

export const evaluationsStore = global.__prepsensei_evaluations;

export function saveEvaluation(interviewId: string, evaluation: any) {
  evaluationsStore.set(interviewId, evaluation);
}

export function getEvaluation(interviewId: string): any | undefined {
  return evaluationsStore.get(interviewId);
}

export function saveInterview(interview: StoredInterview) {
  interviewsStore.set(interview.id, interview);
}

export function getInterview(id: string): StoredInterview | undefined {
  return interviewsStore.get(id);
}

export function getAllInterviews(): StoredInterview[] {
  return Array.from(interviewsStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

