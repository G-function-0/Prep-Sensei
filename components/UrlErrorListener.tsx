"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function UrlErrorListener() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const message = searchParams.get("message");

    if (error || errorDescription) {
      const displayMsg =
        errorDescription ||
        (error === "unsupported_provider"
          ? "Google OAuth provider is not enabled in Supabase yet. Please enable it in Authentication -> Providers -> Google."
          : `Authentication error: ${error}`);
      toast.error(displayMsg, { duration: 8000 });
    } else if (message) {
      toast.info(message, { duration: 6000 });
    }

    // Also check window hash for OAuth fragment errors (#error=...&error_description=...)
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashError = hashParams.get("error");
      const hashErrorDescription = hashParams.get("error_description");

      if (hashError || hashErrorDescription) {
        toast.error(
          hashErrorDescription || `Authentication error: ${hashError}`,
          { duration: 8000 }
        );
      }
    }
  }, [searchParams]);

  return null;
}
