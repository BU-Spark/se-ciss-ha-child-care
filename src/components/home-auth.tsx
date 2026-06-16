"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";

export function HomeAuth() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div className="h-9 w-32" />;
  }

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-500">Signed in</span>
        <UserButton />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/sign-up"
        className="rounded-md bg-[#1a2f5e] px-4 py-2 text-sm font-medium text-white hover:bg-[#152548]"
      >
        Sign up
      </Link>
      <Link
        href="/sign-in"
        className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        Sign in
      </Link>
    </div>
  );
}
