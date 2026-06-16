"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SignUpContent() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") ?? "/";
  const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <div className="border-b border-zinc-200 bg-white px-6 py-4 text-center">
        <p className="text-sm font-medium text-[#1a2f5e]">Create your account</p>
        <p className="mt-1 text-xs text-zinc-500">
          Provider: <span className="font-mono">deep.patel.0603@gmail.com</span> · CCR&amp;R:{" "}
          <span className="font-mono">deeppatel0306@gmail.com</span> · EEC:{" "}
          <span className="font-mono">deepp03@bu.edu</span>
        </p>
        <p className="mt-2 text-xs text-zinc-400">
          Already have an account?{" "}
          <a href={signInUrl} className="font-medium text-[#1a2f5e] underline">
            Sign in
          </a>
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <SignUp
          fallbackRedirectUrl={redirectUrl}
          forceRedirectUrl={redirectUrl}
          signInUrl={signInUrl}
        />
      </div>
    </div>
  );
}
