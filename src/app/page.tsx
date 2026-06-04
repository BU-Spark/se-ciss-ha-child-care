import Link from "next/link";
import { personas } from "@/config/personas";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">

      {/* Header */}
      <header className="border-b border-[#e2e6ed] bg-white">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#1a2f5e] flex items-center justify-center text-white text-xs font-bold">M</div>
            <span className="font-semibold text-[#1a2f5e] text-sm">EEC Orientation</span>
          </div>
          <span className="text-xs text-zinc-400">Massachusetts Department of Early Education and Care</span>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-[#1a2f5e] text-white px-6" style={{ padding: "2.5rem 1.5rem" }}>
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-300 mb-4">Commonwealth of Massachusetts</p>
          <h1 className="text-3xl font-bold sm:text-4xl">EEC Orientation Management</h1>
          <p className="mt-4 text-base text-blue-100 max-w-2xl leading-relaxed">
            Unified system for child care providers to register for orientation sessions and for CCR&amp;R agencies and EEC to track participation statewide.
          </p>
        </div>
      </div>

      {/* Cards */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-6" style={{ paddingTop: "3rem", paddingBottom: "8rem" }}>
        <p className="text-sm font-medium text-zinc-500" style={{ marginBottom: ".5rem", marginTop: "0rem" }}>Select your portal to continue</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" style={{ marginBottom: "6rem" }}>
          {personas.map((persona) => (
            <Link
              key={persona.id}
              href={persona.href}
              className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-[#1a2f5e] hover:shadow-md"
            >
              <h2 className="text-base font-semibold text-zinc-900 group-hover:text-[#1a2f5e] transition-colors">
                {persona.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-500">
                {persona.description}
              </p>
              <span className="mt-5 text-sm font-medium text-[#1a2f5e]">
                Open portal →
              </span>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-4 px-6">
        <div className="mx-auto max-w-5xl flex items-center justify-between text-xs text-zinc-400">
          <span>© 2024 Massachusetts Department of Early Education and Care</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-zinc-600">Accessibility</a>
            <a href="#" className="hover:text-zinc-600">Contact Support</a>
            <a href="#" className="hover:text-zinc-600">Privacy Policy</a>
          </div>
        </div>
      </footer>

    </div>
  );
}