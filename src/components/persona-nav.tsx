"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";

type PersonaNavProps = {
  basePath: string;
  subtitle?: string;
};

const NAV_ITEMS = [
  { label: "Dashboard", segment: "dashboard", href: (base: string) => base },
  { label: "Sessions", segment: "sessions", href: (base: string) => `${base}#sessions` },
  { label: "Resources", segment: "resources", href: (base: string) => `${base}#resources` },
] as const;

function getActiveSegment(pathname: string, basePath: string) {
  if (pathname.startsWith(`${basePath}/sessions`)) {
    return "sessions";
  }

  return "dashboard";
}

function scrollToHash(hash: string) {
  const target = document.querySelector(hash);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function PersonaNav({ basePath, subtitle }: PersonaNavProps) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, [pathname]);

  useEffect(() => {
    if (hash) {
      scrollToHash(hash);
    }
  }, [hash, pathname]);

  const activeSegment =
    hash === "#sessions"
      ? "sessions"
      : hash === "#resources"
        ? "resources"
        : getActiveSegment(pathname, basePath);

  function handleNavClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    const [, targetHash] = href.split("#");
    if (!targetHash || pathname !== basePath) {
      return;
    }

    event.preventDefault();
    const nextHash = `#${targetHash}`;
    window.history.pushState(null, "", `${basePath}${nextHash}`);
    setHash(nextHash);
    scrollToHash(nextHash);
  }

  return (
    <header className="border-b border-[#e2e6ed] bg-white sticky top-0 z-10">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <Link
            href={basePath}
            onClick={() => setHash("")}
            className="flex items-center gap-2"
          >
            <div className="w-7 h-7 rounded bg-[#1a2f5e] flex items-center justify-center text-white text-xs font-bold">
              M
            </div>
            <span className="font-semibold text-[#1a2f5e] text-sm">EEC Orientation</span>
          </Link>
          <nav className="flex gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.segment === activeSegment;
              return (
                <Link
                  key={item.label}
                  href={item.href(basePath)}
                  onClick={(event) => handleNavClick(event, item.href(basePath))}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-[#1a2f5e] border-b-2 border-[#1a2f5e]"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {subtitle ? (
            <span className="text-sm text-zinc-600">{subtitle}</span>
          ) : null}
          <UserButton />
        </div>
      </div>
    </header>
  );
}
