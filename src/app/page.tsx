import Link from "next/link";

import { SiteHeader } from "@/components/SiteHeader";
import { personas } from "@/config/personas";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Massachusetts EEC Orientation
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-zinc-600">
            Unified system for child care providers to register for orientation
            sessions and for CCR&R agencies and EEC to track participation
            statewide.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((persona) => (
            <Link
              key={persona.id}
              href={persona.href}
              className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:border-sky-200 hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-sky-900">
                {persona.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600">
                {persona.description}
              </p>
              <span className="mt-4 text-sm font-medium text-sky-800">
                Open portal →
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
