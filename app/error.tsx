"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error caught:", error);
    toast.error(error.message || "An unexpected error occurred", {
      duration: 6000,
    });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="card-border max-w-md w-full p-8 flex flex-col items-center gap-4">
        <div className="p-3 rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-light-100">Something went wrong</h2>
        <p className="text-sm text-light-400">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <Button
          onClick={() => reset()}
          className="btn flex items-center gap-2 mt-4 cursor-pointer"
        >
          <RotateCcw className="size-4" />
          <span>Try Again</span>
        </Button>
      </div>
    </div>
  );
}
