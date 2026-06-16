import { personas } from "@/config/personas";
import { HomeAuth } from "@/components/home-auth";
import { HomePortalCard } from "@/components/home-portal-card";

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
          <HomeAuth />
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
        <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
          <p className="text-sm font-medium text-[#1a2f5e]">Getting started</p>
          <ol className="mt-2 list-decimal pl-5 text-sm text-zinc-600 space-y-1">
            <li>
              <strong>First time?</strong> Click <strong>Sign up</strong> with your email and create a password.
            </li>
            <li>
              <strong>Provider portal:</strong> use <span className="font-mono">deep.patel.0603@gmail.com</span>
            </li>
            <li>
              <strong>CCR&amp;R staff portal:</strong> use <span className="font-mono">deeppatel0306@gmail.com</span>
            </li>
            <li>
              <strong>EEC admin portal:</strong> use <span className="font-mono">deepp03@bu.edu</span>
            </li>
            <li>Already registered? Click <strong>Sign in</strong> instead.</li>
          </ol>
        </div>
        <p className="text-sm font-medium text-zinc-500" style={{ marginBottom: ".5rem", marginTop: "0rem" }}>Select your portal to continue</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" style={{ marginBottom: "6rem" }}>
          {personas.map((persona) => (
            <HomePortalCard key={persona.id} persona={persona} />
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