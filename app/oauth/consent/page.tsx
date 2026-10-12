"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function ConsentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const clientId = searchParams.get("client_id") || "PrepSensei Application";
  const redirectUri = searchParams.get("redirect_uri");
  const scope = searchParams.get("scope") || "profile email interviews";
  const state = searchParams.get("state") || "";

  const scopesList = scope.split(" ").filter(Boolean);

  const handleAuthorize = async () => {
    try {
      setIsProcessing(true);
      toast.success("Authorization granted successfully!");

      if (redirectUri) {
        const callbackUrl = new URL(redirectUri);
        callbackUrl.searchParams.set("state", state);
        callbackUrl.searchParams.set("code", "auth_code_" + Date.now());
        window.location.href = callbackUrl.toString();
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error(err);
      toast.error(`Authorization error: ${err}`);
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    toast.error("Authorization request cancelled by user.");
    if (redirectUri) {
      try {
        const callbackUrl = new URL(redirectUri);
        callbackUrl.searchParams.set("error", "access_denied");
        callbackUrl.searchParams.set("error_description", "User denied authorization");
        if (state) callbackUrl.searchParams.set("state", state);
        window.location.href = callbackUrl.toString();
        return;
      } catch {
        // Fallback to home
      }
    }
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card-border max-w-lg w-full">
        <div className="card p-8 flex flex-col gap-6">
          <div className="flex items-center gap-3 justify-center">
            <Image src="/logo.svg" alt="logo" width={38} height={32} />
            <h2 className="text-xl font-bold text-primary-100">PrepSensei</h2>
          </div>

          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-primary-200/10 text-primary-200 mx-auto">
              <ShieldCheck className="size-8" />
            </div>
            <h3 className="text-lg font-semibold text-light-100">
              Authorize Application
            </h3>
            <p className="text-sm text-light-400">
              <span className="font-semibold text-light-200">{clientId}</span> is requesting permission to access your PrepSensei account.
            </p>
          </div>

          <div className="border border-border/40 rounded-xl p-4 bg-dark-200/50 space-y-3">
            <p className="text-xs uppercase tracking-wider text-light-400 font-semibold">
              Permissions Requested:
            </p>
            <ul className="space-y-2 text-sm text-light-200">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary-200 shrink-0" />
                <span>View your profile information (Name, Email)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary-200 shrink-0" />
                <span>Access your mock interview questions and history</span>
              </li>
              {scopesList.map(
                (s) =>
                  !["profile", "email", "interviews"].includes(s) && (
                    <li key={s} className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-primary-200 shrink-0" />
                      <span>{s}</span>
                    </li>
                  )
              )}
            </ul>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isProcessing}
              className="flex-1 rounded-full border-border/60 hover:bg-dark-300 text-light-300 cursor-pointer"
            >
              <XCircle className="size-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAuthorize}
              disabled={isProcessing}
              className="btn flex-1 rounded-full cursor-pointer"
            >
              <CheckCircle2 className="size-4 mr-2" />
              {isProcessing ? "Authorizing..." : "Authorize"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConsentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-light-400">
          Loading authorization consent...
        </div>
      }
    >
      <ConsentContent />
    </Suspense>
  );
}
