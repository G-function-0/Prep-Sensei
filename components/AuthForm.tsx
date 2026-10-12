"use client";

import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, Sparkles } from "lucide-react";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { supabase } from "@/lib/supabase/client";
import FormField from "./FormField";

const authFormSchema = (type: FormType) => {
  return z.object({
    name: type === "sign-up" ? z.string().min(3) : z.string().optional(),
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });
};

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      if (type === "sign-up") {
        const { name, email, password } = data;
        const res = await fetch("/api/auth/sign-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const result = await res.json();

        if (!result?.success) {
          toast.error(result?.message || "Failed to create account", {
            duration: 8000,
          });
          return;
        }

        toast.info(result.message || "Account created successfully.", {
          duration: 8000,
        });
        router.push("/sign-in");
      } else {
        const { email, password } = data;
        const res = await fetch("/api/auth/sign-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const result = await res.json();

        if (!result?.success) {
          toast.error(result?.message || "Failed to log in", {
            duration: 8000,
          });
          return;
        }

        toast.success("Signed in successfully. Redirecting...", {
          duration: 3000,
        });
        window.location.assign("/");
      }
    } catch (error) {
      console.error(error);
      toast.error(`There was an error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("provider is not enabled") ||
          error.message.toLowerCase().includes("unsupported provider")
        ) {
          toast.error(
            "Google login is not enabled in your Supabase project yet. Go to Supabase Dashboard -> Authentication -> Providers -> Google to enable it.",
            { duration: 8000 }
          );
        } else {
          toast.error(error.message, { duration: 6000 });
        }
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      toast.error("Google sign in failed. Please check your Supabase configuration.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    try {
      setIsLoading(true);
      toast.loading("Signing in with demo account...", { id: "demo-login" });

      const res = await fetch("/api/auth/demo", {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        // Also set client cookie fallback
        const demoUser = JSON.stringify({
          id: "demo_candidate_id",
          name: "Demo Candidate",
          email: "candidate@prepsensei.com",
        });
        document.cookie = `prepsensei_demo_session=${encodeURIComponent(
          demoUser
        )}; path=/; max-age=604800; SameSite=Lax`;

        toast.success("Signed in as Demo Candidate! Entering dashboard...", {
          id: "demo-login",
          duration: 3000,
        });

        // Trigger full navigation to ensure session is recognized
        window.location.assign("/");
      } else {
        toast.error("Could not sign in as demo candidate.", { id: "demo-login" });
      }
    } catch (err) {
      console.error("Demo sign-in error:", err);
      // Client-side fallback if fetch fails
      const demoUser = JSON.stringify({
        id: "demo_candidate_id",
        name: "Demo Candidate",
        email: "candidate@prepsensei.com",
      });
      document.cookie = `prepsensei_demo_session=${encodeURIComponent(
        demoUser
      )}; path=/; max-age=604800; SameSite=Lax`;
      toast.success("Demo session created! Redirecting...", {
        id: "demo-login",
      });
      window.location.assign("/");
    } finally {
      setIsLoading(false);
    }
  };

  const isSignIn = type === "sign-in";

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" height={32} width={38} />
          <h2 className="text-primary-100">PrepSensei</h2>
        </div>

        <h3>Practice job interviews with AI</h3>

        {/* Quick Demo Access Button */}
        <Button
          type="button"
          onClick={handleDemoSignIn}
          disabled={isLoading || isGoogleLoading}
          className="w-full bg-primary-200/15 hover:bg-primary-200/25 text-primary-200 border border-primary-200/40 rounded-full h-12 flex items-center justify-center gap-2.5 font-semibold text-sm cursor-pointer shadow-sm transition-all"
        >
          <Sparkles className="size-5 text-primary-200 animate-pulse" />
          <span>Quick Access (Skip Login as Demo Candidate)</span>
        </Button>

        <div className="flex items-center gap-4 my-1">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-xs uppercase text-light-400 font-semibold tracking-wider">
            Or sign in with
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        {/* Google OAuth Button */}
        <Button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isLoading}
          className="w-full !bg-dark-200 hover:!bg-dark-300 !text-light-100 border border-input !rounded-full !font-medium py-3 h-11 flex items-center justify-center gap-3 cursor-pointer transition-colors"
        >
          <LogIn className="size-5 text-primary-200" />
          <span>
            {isGoogleLoading
              ? "Connecting to Google..."
              : "Continue with Google"}
          </span>
        </Button>

        <div className="flex items-center gap-4 my-1">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-xs uppercase text-light-400 font-semibold tracking-wider">
            Or with email
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6 form"
          >
            {!isSignIn && (
              <FormField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Your Name"
                type="text"
              />
            )}

            <FormField
              control={form.control}
              name="email"
              label="Email"
              placeholder="Your email address"
              type="email"
            />

            <FormField
              control={form.control}
              name="password"
              label="Password"
              placeholder="Enter your password (min 6 characters)"
              type="password"
            />

            <Button
              className="btn w-full"
              type="submit"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading
                ? "Processing..."
                : isSignIn
                ? "Sign In"
                : "Create an Account"}
            </Button>
          </form>
        </Form>

        <p className="text-center">
          {isSignIn ? "No account yet?" : "Have an account already?"}
          <Link
            href={!isSignIn ? "/sign-in" : "/sign-up"}
            className="font-bold text-user-primary ml-1"
          >
            {!isSignIn ? "Sign In" : "Sign Up"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
