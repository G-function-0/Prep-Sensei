"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export default function GlobalErrorHandler() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
          ? reason
          : "An unexpected error occurred.";

      // Filter out internal Next.js bail-out errors
      if (
        message.includes("Dynamic server usage") ||
        message.includes("NEXT_REDIRECT") ||
        message.includes("cancelled")
      ) {
        return;
      }

      toast.error(message, {
        duration: 6000,
      });
    };

    const handleError = (event: ErrorEvent) => {
      if (
        event.message?.includes("ResizeObserver") ||
        event.message?.includes("Script error")
      ) {
        return;
      }

      toast.error(event.message || "An error occurred in the application.", {
        duration: 6000,
      });
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  return null;
}
