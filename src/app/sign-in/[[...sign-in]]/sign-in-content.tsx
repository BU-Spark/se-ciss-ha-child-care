"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SignInContent() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") ?? "/";
  const signUpUrl = `/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <div className="border-b border-zinc-200 bg-white px-6 py-4 text-center">
        <p className="text-sm font-medium text-[#1a2f5e]">Sign in to continue</p>
        <p className="mt-1 text-xs text-zinc-500">
          No account yet?{" "}
          <a href={signUpUrl} className="font-medium text-[#1a2f5e] underline">
            Sign up first
          </a>
          .
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <SignIn
          fallbackRedirectUrl={redirectUrl}
          forceRedirectUrl={redirectUrl}
          signUpUrl={signUpUrl}
        />
      </div>
    </div>
  );
}
