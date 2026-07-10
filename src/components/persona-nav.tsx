"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";

type NavItem = {
  label: string;
  segment: string;
  href: (base: string) => string;
};

type PersonaNavProps = {
  basePath: string;
  subtitle?: string;
  extraNavItems?: NavItem[];
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", segment: "dashboard", href: (base: string) => base },
  { label: "Sessions", segment: "sessions", href: (base: string) => `${base}#sessions` },
  { label: "Resources", segment: "resources", href: (base: string) => `${base}#resources` },
];

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

export function PersonaNav({ basePath, subtitle, extraNavItems = [] }: PersonaNavProps) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = [...NAV_ITEMS, ...extraNavItems];

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    window.addEventListener("popstate", updateHash);
    return () => {
      window.removeEventListener("hashchange", updateHash);
      window.removeEventListener("popstate", updateHash);
    };
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
        : hash === "#registrations"
          ? "registrations"
          : navItems.some((item) => item.segment !== "dashboard" && hash === `#${item.segment}`)
            ? hash.slice(1)
            : getActiveSegment(pathname, basePath);

  function handleNavClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    setMenuOpen(false);
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
      <div className="mx-auto max-w-5xl px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <Link
              href={basePath}
              onClick={() => {
                setHash("");
                setMenuOpen(false);
              }}
              className="flex items-center gap-2 shrink-0"
            >
              <div className="w-7 h-7 rounded bg-[#1a2f5e] flex items-center justify-center text-white text-xs font-bold">
                M
              </div>
              <span className="font-semibold text-[#1a2f5e] text-sm">
                EEC Orientation
              </span>
            </Link>
            <nav className="hidden md:flex gap-1" aria-label="Portal">
              {navItems.map((item) => {
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
              <span className="hidden sm:inline text-sm text-zinc-600 truncate max-w-[10rem]">
                {subtitle}
              </span>
            ) : null}
            <UserButton />
            <button
              type="button"
              className="md:hidden rounded-md border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-50"
              aria-expanded={menuOpen}
              aria-controls="mobile-portal-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        {menuOpen ? (
          <nav
            id="mobile-portal-nav"
            className="md:hidden mt-3 flex flex-col gap-1 border-t border-zinc-100 pt-3"
            aria-label="Portal mobile"
          >
            {navItems.map((item) => {
              const isActive = item.segment === activeSegment;
              return (
                <Link
                  key={item.label}
                  href={item.href(basePath)}
                  onClick={(event) => handleNavClick(event, item.href(basePath))}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-[#1a2f5e] text-white"
                      : "text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
