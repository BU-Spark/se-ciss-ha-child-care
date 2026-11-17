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
            <div className="w-9 h-7 rounded bg-[#1a2f5e] flex items-center justify-center text-white text-[10px] font-bold">
              M
            </div>
            <span className="font-semibold text-[#1a2f5e] text-sm">
              CCFA Information Sessions
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
            Welcome to CCFA Information Session Registration!
          </h1>
          <p className="mt-4 text-base text-blue-100 max-w-2xl leading-relaxed">
            We&apos;re so glad you&apos;re here! This is where Massachusetts child
            care providers can sign up for an information session about Child
            Care Financial Assistance (CCFA). These sessions explain how CCFA
            works, what it means for your program and the families you serve,
            and how to get started. It only takes a few minutes to register.
          </p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pt-12 pb-24">
        <div className="mb-8 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
          <p className="text-sm font-medium text-[#1a2f5e]">Getting started</p>
          <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
            Let&apos;s get you to the right place. Please choose the box below
            that describes you:
          </p>
          <ul className="mt-3 list-disc pl-5 text-sm text-zinc-600 space-y-1.5 leading-relaxed">
            <li>
              <strong>Are you a child care provider?</strong>{" "}
              Choose <strong>Child Care Provider.</strong> You&apos;ll create an
              account with your work email, and then you can browse upcoming
              sessions and pick one that fits your schedule.
            </li>
            <li>
              <strong>Are you on staff at a CCRR agency?</strong>{" "}
              Choose <strong>CCRR Staff</strong> and sign in with the account
              your team administrator set up for you.
            </li>
            <li>
              <strong>Are you staff at EEC?</strong>{" "}
              Choose <strong>EEC Administrator</strong> and sign in with your
              EEC account.
            </li>
          </ul>
          <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
            Already have an account? Welcome back! Click <strong>Sign in</strong>{" "}
            at the top of the page.
          </p>
        </div>
        <p className="text-sm font-medium text-zinc-500 mb-3">
          Choose your portal to continue
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
