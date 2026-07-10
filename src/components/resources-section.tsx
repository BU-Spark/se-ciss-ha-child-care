import {
  formatAgencyAddress,
  OFFICIAL_CCRR_AGENCIES,
} from "@/config/ccrr-agencies";

type ResourcesSectionProps = {
  /** Extra note shown under the intro (portal-specific). */
  notice?: string;
};

export function ResourcesSection({ notice }: ResourcesSectionProps) {
  return (
    <section id="resources" className="scroll-mt-20 flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-[#1a2f5e]">Resources</h2>
        <p className="mt-1 text-sm text-zinc-500 max-w-2xl leading-relaxed">
          Official Massachusetts CCR&amp;R agencies that host EEC orientation.
          Contact your regional agency for paperwork and local support.
        </p>
        {notice ? (
          <p className="mt-2 text-sm text-zinc-600">{notice}</p>
        ) : null}
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-zinc-700 leading-relaxed">
        <p className="font-medium text-[#1a2f5e]">Paperwork</p>
        <p className="mt-1">
          EEC is collecting required paperwork from each CCR&amp;R. Packets for{" "}
          <span className="font-medium">Child Care Choices of Boston</span> and{" "}
          <span className="font-medium">Seven Hills Child Care Resources</span>{" "}
          will be downloadable here as soon as they are published. Until then,
          reach out to the agency using the address below.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {OFFICIAL_CCRR_AGENCIES.map((agency) => (
          <article
            key={agency.id}
            className="border border-zinc-200 rounded-xl bg-white p-5 flex flex-col gap-2 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-[#1a2f5e] text-sm leading-snug">
                  {agency.name}
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500">{agency.region}</p>
              </div>
              {agency.paperworkStatus === "available" ? (
                <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                  Download ready
                </span>
              ) : null}
            </div>

            <p className="text-sm text-zinc-600 leading-relaxed">
              {formatAgencyAddress(agency)}
            </p>

            {agency.paperwork && agency.paperworkStatus === "available" ? (
              <a
                href={agency.paperwork.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[#1a2f5e] hover:underline"
              >
                {agency.paperwork.label} ↗
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
