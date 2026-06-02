import type { Persona } from "@/config/personas";
import { SiteHeader } from "@/components/SiteHeader";

type PersonaLandingProps = {
  persona: Persona;
};

export function PersonaLanding({ persona }: PersonaLandingProps) {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50">
      <SiteHeader showBack />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-sm font-medium uppercase tracking-wide text-sky-800">
          {persona.audience}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          {persona.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-600">
          {persona.description}
        </p>

        <section className="mt-10 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">
            What you will be able to do
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-zinc-700">
            {persona.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </section>

        <p className="mt-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          This portal is under development. Full registration and dashboard
          features will be added in upcoming sprints.
        </p>
      </main>
    </div>
  );
}
