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
          Providers can sign up with any email. CCR&amp;R staff and EEC admin accounts are linked by your administrator.
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
