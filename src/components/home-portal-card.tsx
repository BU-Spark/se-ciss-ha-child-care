"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

import type { Persona } from "@/config/personas";

export function HomePortalCard({ persona }: { persona: Persona }) {
  const { isLoaded, isSignedIn } = useAuth();
  const portalHref = persona.href;
  const authHref = `/sign-up?redirect_url=${encodeURIComponent(portalHref)}`;
  const href = isLoaded && !isSignedIn ? authHref : portalHref;

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-[#1a2f5e] hover:shadow-md"
    >
      <h2 className="text-base font-semibold text-zinc-900 group-hover:text-[#1a2f5e] transition-colors">
        {persona.title}
      </h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-500">
        {persona.description}
      </p>
      <span className="mt-4 text-sm font-medium text-[#1a2f5e]">
        {isLoaded && !isSignedIn ? "Sign up to open →" : "Open portal →"}
      </span>
    </Link>
  );
}
