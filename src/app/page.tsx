import { personas } from "@/config/personas";
import { HomeAuth } from "@/components/home-auth";
import { HomePortalCard } from "@/components/home-portal-card";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-[#e2e6ed] bg-white">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#1a2f5e] flex items-center justify-center text-white text-xs font-bold">
              M
            </div>
            <span className="font-semibold text-[#1a2f5e] text-sm">
              EEC Orientation
            </span>
          </div>
          <HomeAuth />
        </div>
      </header>

      <div className="bg-[#1a2f5e] text-white px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-300 mb-4">
            Commonwealth of Massachusetts
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl tracking-tight">
            EEC Orientation Management
          </h1>
          <p className="mt-4 text-base text-blue-100 max-w-2xl leading-relaxed">
            Unified system for early care and education providers to register
            for orientation sessions and for CCR&amp;R agencies and EEC to track
            participation statewide.
          </p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pt-12 pb-24">
        <div className="mb-8 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
          <p className="text-sm font-medium text-[#1a2f5e]">Getting started</p>
          <ol className="mt-2 list-decimal pl-5 text-sm text-zinc-600 space-y-1.5 leading-relaxed">
            <li>
              <strong>Providers:</strong> click <strong>Sign up</strong> with
              your work email, then open the Provider portal to browse sessions.
            </li>
            <li>
              <strong>CCR&amp;R staff</strong> and{" "}
              <strong>EEC administrators</strong> sign in with accounts
              provisioned by your team administrator.
            </li>
            <li>
              Already have an account? Use <strong>Sign in</strong> from the
              header.
            </li>
          </ol>
        </div>
        <p className="text-sm font-medium text-zinc-500 mb-3">
          Select your portal to continue
        </p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((persona) => (
            <HomePortalCard key={persona.id} persona={persona} />
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
