"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

type NavItem = {
  label: string;
  segment: string;
  href: (base: string) => string;
};

type PersonaNavProps = {
  basePath: string;
  subtitle?: string;
  /** Kept for backwards-compatible call sites; portal links are intentionally hidden. */
  extraNavItems?: NavItem[];
};

export function PersonaNav({ basePath, subtitle }: PersonaNavProps) {
  return (
    <header className="border-b border-[#e2e6ed] bg-white sticky top-0 z-10">
      <div className="mx-auto max-w-5xl px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link href={basePath} className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded bg-[#1a2f5e] flex items-center justify-center text-white text-xs font-bold">
              M
            </div>
            <span className="font-semibold text-[#1a2f5e] text-sm">
              EEC Orientation
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {subtitle ? (
              <span className="hidden sm:inline text-sm text-zinc-600 truncate max-w-[14rem]">
                {subtitle}
              </span>
            ) : null}
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  );
}
