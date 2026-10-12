"use client";

import { signOut } from "@/lib/auth.action";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // Ignore
    }
    document.cookie =
      "prepsensei_demo_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.assign("/sign-in");
  };

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-2 text-sm text-light-400 hover:text-destructive-100 transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-dark-200"
      title="Sign Out"
    >
      <LogOut className="size-4" />
      <span className="max-sm:hidden">Sign Out</span>
    </button>
  );
}
