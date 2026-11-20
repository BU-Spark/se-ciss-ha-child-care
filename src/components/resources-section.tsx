import {
  formatAgencyAddress,
  OFFICIAL_CCRR_AGENCIES,
} from "@/config/ccrr-agencies";

const VOUCHER_PROVIDER_FORMS = [
  {
    label: "Voucher Services Agreement",
    href: "https://www.sevenhills.org/hubfs/EEC-VOUCHER-SERVICES-AGREEMENT-4-26.pdf",
  },
  {
    label: "Provider Contact Form",
    href: "https://www.sevenhills.org/hubfs/Provider_Contact_Information-form-1.pdf",
  },
  {
    label: "Provider Rate Statement — FCC",
    href: "https://www.sevenhills.org/hubfs/family_child_care_provider_rate_statement4-1.pdf",
  },
  {
    label: "Provider Rate Statement — CBC",
    href: "https://www.sevenhills.org/hubfs/centers_provider_rate_statement9-1.pdf",
  },
  {
    label: "Early Education and Care Rate Chart",
    href: "https://www.sevenhills.org/hubfs/EEC_FY27%20RATE%20INCREASE%20CHART_JULY26.pdf",
  },
  { label: "W-9", href: "https://www.sevenhills.org/hubfs/CCR/W9-form.pdf" },
  {
    label: "Holiday Closure Form — FCC Systems",
    href: "https://www.sevenhills.org/hubfs/FY27-FCC-System-Approved-Closure-form.pdf",
  },
  {
    label: "Holiday Closure Form — CBC Providers",
    href: "https://www.sevenhills.org/hubfs/FY27-Center-Based-Approved-Closure-form.pdf",
  },
  {
    label: "WLS Provider Profile Form — FCC Providers",
    href: "https://www.sevenhills.org/hubfs/UpdatedFamilyChildcareForm5-9-24.pdf",
  },
  {
    label: "WLS Provider Profile Form — CCC Providers",
    href: "https://www.sevenhills.org/hubfs/UpdatedGroupChildcareForm5-9-24.pdf",
  },
  {
    label: "Transportation Agreement",
    href: "https://www.sevenhills.org/hubfs/FY26-Transport-Agreement_CCRR.pdf",
  },
  {
    label: "Confirmation of Provider",
    href: "https://www.sevenhills.org/hubfs/CCR-Confirmation-of-Provider.pdf",
  },
  {
    label: "End of Placement Form",
    href: "https://www.sevenhills.org/hubfs/End-of-Placement.pdf",
  },
  {
    label: "Provider Checklist — FCC Providers",
    href: "https://www.sevenhills.org/hubfs/ProviderChecklistIndependentFamilyChildCare.pdf",
  },
  {
    label: "Provider Checklist — CCC Providers",
    href: "https://www.sevenhills.org/hubfs/ProviderChecklistCenterBasedPrograms.pdf",
  },
  {
    label: "Provider Exit Form",
    href: "https://www.sevenhills.org/hubfs/PROVIDER-EXIT-INTERVIEW-form.pdf",
  },
  {
    label: "Direct Deposit Form",
    href: "https://www.sevenhills.org/hubfs/DIRECT-DEPOSIT-AUTHORIZATON-FORM.pdf",
  },
];

export function ResourcesSection() {
  return (
    <section id="resources" className="scroll-mt-20 flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-[#1a2f5e]">Resources</h2>
      </div>

      <div className="text-sm text-zinc-700 leading-relaxed">
        <h3 className="font-semibold text-[#1a2f5e]">Paperwork</h3>
        <p className="mt-1 max-w-4xl">
          During the CCFA information session, we&apos;ll walk through the
          required paperwork listed below, so you&apos;ll know exactly what you
          need to become a CCFA provider. You don&apos;t need to have anything
          completed before the session, but feel free to look over the list
          ahead of time and bring any questions that you have.
        </p>
        <div className="mt-3 grid gap-x-6 sm:grid-cols-2">
          {VOUCHER_PROVIDER_FORMS.map((form) => (
            <a
              key={form.label}
              href={form.href}
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-zinc-200 py-2 text-sm font-medium text-[#1a2f5e] hover:underline"
            >
              {form.label} <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[#1a2f5e]">CCR&amp;R Contacts</h3>
        <p className="mt-1 max-w-3xl text-sm text-zinc-600 leading-relaxed">
          Questions? If you have questions about registering for a CCFA
          information session or about the paperwork needed to become a CCFA
          provider, please reach out to your local CCR&amp;R agency from the
          list below. They&apos;re happy to help!
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
                <p className="mt-0.5 text-xs text-zinc-500">
                  {[agency.region, ...(agency.additionalRegions ?? [])].join(" and ")}
                </p>
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

            <a
              href={`tel:${agency.phone.replaceAll(/[^\d+]/g, "")}`}
              className="text-sm text-zinc-600 hover:text-[#1a2f5e] hover:underline"
            >
              {agency.phone}
            </a>
            <a
              href={agency.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[#1a2f5e] hover:underline"
            >
              Visit website <span aria-hidden="true">↗</span>
            </a>

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
