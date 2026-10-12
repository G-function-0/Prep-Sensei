import { GoogleGenAI } from "@google/genai";

// Cooldown tracker for exhausted keys (key index -> expiry timestamp)
const keyCooldowns = new Map<number, number>();
let roundRobinIndex = 0;

/**
 * Retrieves all configured Gemini API keys from environment variables.
 * Supports:
 * - GEMINI_API_KEYS (comma or newline separated: "key1,key2,key3,key4,key5")
 * - GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_3, GEMINI_API_KEY_4, GEMINI_API_KEY_5
 * - GEMINI_API_KEY (primary fallback)
 */
export function getGeminiKeyPool(): string[] {
  const keys: string[] = [];

  // Check comma/newline separated pool
  if (process.env.GEMINI_API_KEYS) {
    const splitKeys = process.env.GEMINI_API_KEYS.split(/[\n,]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 5 && !k.includes("placeholder"));
    keys.push(...splitKeys);
  }

  // Check numbered environment variables (1 to 10)
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key && key.trim().length > 5 && !key.includes("placeholder")) {
      keys.push(key.trim());
    }
  }

  // Check standard single key
  if (process.env.GEMINI_API_KEY) {
    const stdKey = process.env.GEMINI_API_KEY.trim();
    if (stdKey.length > 5 && !stdKey.includes("placeholder")) {
      keys.push(stdKey);
    }
  }

  // Deduplicate while preserving order
  const uniqueKeys = Array.from(new Set(keys));

  // If no keys configured, provide placeholder so app compiles, but log warning
  if (uniqueKeys.length === 0) {
    return [process.env.GEMINI_API_KEY || ""];
  }

  return uniqueKeys;
}

/**
 * Creates an instance of GoogleGenAI using the specified key with aistudio-build telemetry header.
 */
export function createGenAIInstance(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function isQuotaOrRateLimitError(error: unknown): boolean {
  if (!error) return false;
  const msg = String(error).toLowerCase();
  const status = (error as { status?: number })?.status;
  return (
    status === 429 ||
    status === 503 ||
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("resourceexhausted") ||
    msg.includes("resource_exhausted") ||
    msg.includes("rate_limit") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("overloaded")
  );
}

/**
 * Executes a Gemini operation using round-robin key rotation with automatic failover
 * if any key encounters a quota or rate-limit error.
 */
export async function executeWithGeminiKeyRotation<T>(
  operation: (ai: GoogleGenAI, key: string, keyIndex: number) => Promise<T>
): Promise<T> {
  const pool = getGeminiKeyPool();

  if (pool.length === 0 || !pool[0]) {
    throw new Error(
      "No Gemini API keys found. Please set GEMINI_API_KEY or GEMINI_API_KEYS (comma-separated) in your environment variables."
    );
  }

  const now = Date.now();
  const totalKeys = pool.length;
  let lastError: unknown = null;

  // Try each key in the pool, starting from current roundRobinIndex
  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const currentIndex = (roundRobinIndex + attempt) % totalKeys;
    const cooldownExpires = keyCooldowns.get(currentIndex);

    // Skip if on cooldown (unless it's the only key)
    if (cooldownExpires && cooldownExpires > now && totalKeys > 1) {
      continue;
    }

    const selectedKey = pool[currentIndex];
    const ai = createGenAIInstance(selectedKey);

    try {
      const result = await operation(ai, selectedKey, currentIndex);

      // Advance round-robin pointer for the next call
      roundRobinIndex = (currentIndex + 1) % totalKeys;
      keyCooldowns.delete(currentIndex); // clear any past cooldown
      return result;
    } catch (error) {
      lastError = error;
      console.warn(
        `Gemini API key #${currentIndex + 1} of ${totalKeys} failed:`,
        error instanceof Error ? error.message : error
      );

      if (isQuotaOrRateLimitError(error)) {
        // Place on 60 second cooldown
        keyCooldowns.set(currentIndex, now + 60_000);
        console.warn(
          `Key #${currentIndex + 1} quota reached. Automatically failing over to next key in pool...`
        );
        // Continue loop to try next key immediately
      } else {
        // If it's a non-retryable invalid argument or prompt error, throw immediately
        const errMsg = String(error).toLowerCase();
        if (
          errMsg.includes("invalid_argument") ||
          errMsg.includes("bad request")
        ) {
          throw error;
        }
      }
    }
  }

  // If all keys in pool failed, throw descriptive error
  throw new Error(
    `All available Gemini API keys (${totalKeys} keys in pool) were exhausted or encountered errors. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}
