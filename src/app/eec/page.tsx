"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth, UserButton } from "@clerk/nextjs";

import { PortalNotice } from "@/components/portal-notice";
import { SiteFooter } from "@/components/site-footer";
import { PersonaGuardBoundary } from "@/components/persona-guard-boundary";
import { usePersonaGuard } from "@/hooks/use-persona-guard";
import { escapeCSV, buildCsv, downloadCsv } from "@/lib/csv";
import { getLanguageLabel } from "@/lib/languages";

type Registration = {
  id: string;
  providerName: string;
  organizationName: string;
  stateProviderId: string | null;
  contactEmail: string;
  phone: string | null;
  providerTypeLabel: string;
  agency: string;
  agencyRegion: string;
  region: string;
  licensingRegion: string;
  subsidyRegion: string;
  preferredLanguage: string;
  sessionTitle: string;
  sessionDate: string;
  sessionEndsAt: string;
  registeredAt: string;
  format: string;
  status: "Attended" | "Registered" | "No-show" | "Waitlisted" | "Cancelled";
  followUpSent: string;
  reminderSent: string;
  feedbackSurveySent: string;
  notes: string;
};

type EecStats = {
  totalRegistrations: number;
  totalCompletions: number;
  completionRate: number;
  activeSessions: number;
  agenciesCount: number;
  regionCount: number;
};

type RegionalRate = { region: string; rate: number };
type TrendPoint = { label: string; count: number };
type AgencyCompliance = {
  agency: string;
  region: string;
  sessions: number;
  registrations: number;
  completions: number;
  completionRate: number;
};
type AuditLog = {
  id: string;
  timestamp: string;
  action: string;
  detail: string;
  agency: string;
};

const NAV_ITEMS = ["Overview", "Registration Data", "Regional Analytics", "Agency Compliance", "Audit Logs"];
const DATE_RANGES = ["Last 30 Days", "Last 7 Days", "Last 90 Days", "All Time"];
const PROVIDER_TYPES = ["All Types", "Center-based", "Family-based", "School-age"];

function StatusBadge({ status }: { status: Registration["status"] }) {
  const styles = {
    Attended: "bg-green-50 text-green-700",
    Registered: "bg-blue-50 text-blue-700",
    "No-show": "bg-red-50 text-red-600",
    Waitlisted: "bg-yellow-50 text-yellow-700",
    Cancelled: "bg-zinc-100 text-zinc-500",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}>
      {status}
    </span>
  );
}

function formatSessionDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

function formatTimeRange(startIso: string, endIso: string) {
  const start = new Date(startIso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
  const end = new Date(endIso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
  return `${start} – ${end} ET`;
}

function formatAuditTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

function StatsCards({ stats }: { stats: EecStats | null }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[
        {
          label: "TOTAL REGISTRATIONS",
          value: stats?.totalRegistrations.toLocaleString() ?? "—",
          sub: "Statewide enrollments",
        },
        {
          label: "TOTAL COMPLETIONS",
          value: stats?.totalCompletions.toLocaleString() ?? "—",
          sub: stats ? `${stats.completionRate}% Rate` : "—",
        },
        {
          label: "ACTIVE SESSIONS",
          value: stats?.activeSessions.toLocaleString() ?? "—",
          sub: stats ? `Across ${stats.regionCount} Regions` : "—",
        },
        {
          label: "CCR&R AGENCIES",
          value: stats?.agenciesCount.toLocaleString() ?? "—",
          sub: "Active Network",
        },
      ].map((stat) => (
        <div key={stat.label} className="bg-white border border-zinc-200 rounded-lg p-4">
          <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">{stat.label}</p>
          <p className="text-2xl font-bold text-zinc-800 mt-1">{stat.value}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{stat.sub}</p>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ trend, maxTrend }: { trend: TrendPoint[]; maxTrend: number }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4">
      <p className="text-sm font-semibold text-zinc-800 mb-3">Registrations Over Time</p>
      <div className="flex items-end gap-1 h-16">
        {trend.map((point, index, arr) => (
          <div
            key={point.label}
            className={`flex-1 rounded-sm ${index === arr.length - 1 ? "bg-[#1a2f5e]" : "bg-blue-100"}`}
            style={{ height: `${(point.count / maxTrend) * 100}%` }}
            title={`${point.label}: ${point.count}`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-zinc-400">
        {trend.filter((_, index) => index % 2 === 0).map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

function RegionalCompletionPanel({ regionalRates }: { regionalRates: RegionalRate[] }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4">
      <p className="text-sm font-semibold text-zinc-800 mb-3">Regional Completion Rate</p>
      <div className="flex flex-col gap-2.5">
        {regionalRates.length === 0 ? (
          <p className="text-xs text-zinc-400">No completion data yet.</p>
        ) : (
          regionalRates.map((rate) => (
            <div key={rate.region} className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-600">{rate.region}</span>
                <span className="font-medium text-zinc-700">{rate.rate}%</span>
              </div>
              <div className="h-1.5 bg-zinc-100 rounded-full">
                <div className="h-full bg-[#1a2f5e] rounded-full" style={{ width: `${rate.rate}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function EecPage() {
  const { isLoaded, userId } = useAuth();
  const { isReady: portalReady, notice: portalNotice, setupMessage, portalLabel, canLoadData } = usePersonaGuard("eec");
  const [activeNav, setActiveNav] = useState("Overview");
  const [agency, setAgency] = useState("All Agencies");
  const [region, setRegion] = useState("All Regions");
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [providerType, setProviderType] = useState("All Types");
  const [language, setLanguage] = useState("All Languages");
  const [stats, setStats] = useState<EecStats | null>(null);
  const [regionalRates, setRegionalRates] = useState<RegionalRate[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [agencyCompliance, setAgencyCompliance] = useState<AgencyCompliance[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [agencies, setAgencies] = useState<string[]>(["All Agencies"]);
  const [regions, setRegions] = useState<string[]>(["All Regions"]);
  const [languages, setLanguages] = useState<string[]>(["All Languages"]);
  const [adminName, setAdminName] = useState("State Administrator");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/me");
        const json = await res.json();
        if (json.success && json.data.profile.name) {
          setAdminName(json.data.profile.name);
        }
      } catch {
        // Profile prefill is best-effort.
      }
    }

    if (canLoadData) {
      loadProfile();
    }
  }, [canLoadData]);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/eec/stats");
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error?.message ?? "Unable to load statewide stats.");
          return;
        }

        setStats(json.data.stats);
        setRegionalRates(json.data.regionalCompletion);
        setTrend(json.data.registrationsOverTime);
        setAgencyCompliance(json.data.agencyCompliance ?? []);
        setAuditLogs(json.data.auditLogs ?? []);
        setAgencies(json.data.filterOptions.agencies);
        setRegions(json.data.filterOptions.regions);
        setLanguages(json.data.filterOptions.languages);
      } catch {
        setError("Unable to load statewide stats.");
      }
    }

    if (canLoadData) {
      loadStats();
    }
  }, [canLoadData]);

  useEffect(() => {
    async function loadRegistrations() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (agency !== "All Agencies") params.set("agency", agency);
        if (region !== "All Regions") params.set("region", region);
        if (dateRange) params.set("dateRange", dateRange);
        if (providerType !== "All Types") params.set("providerType", providerType);
        if (language !== "All Languages") params.set("language", language);

        const res = await fetch(`/api/eec/registrations?${params.toString()}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error?.message ?? "Unable to load registrations.");
          setRegistrations([]);
          return;
        }

        setRegistrations(json.data.registrations);
      } catch {
        setError("Network error. Please try again.");
        setRegistrations([]);
      } finally {
        setLoading(false);
      }
    }

    if (canLoadData) {
      loadRegistrations();
    }
  }, [canLoadData, agency, region, dateRange, providerType, language]);

  const maxTrend = useMemo(
    () => Math.max(...trend.map((point) => point.count), 1),
    [trend],
  );

  const filteredRegistrations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return registrations;

    return registrations.filter(
      (registration) =>
        registration.providerName.toLowerCase().includes(query) ||
        registration.organizationName.toLowerCase().includes(query) ||
        (registration.stateProviderId ?? "").toLowerCase().includes(query) ||
        registration.agency.toLowerCase().includes(query) ||
        registration.region.toLowerCase().includes(query),
    );
  }, [registrations, searchQuery]);

  const pageTitle = useMemo(() => {
    switch (activeNav) {
      case "Registration Data":
        return "Registration Data";
      case "Regional Analytics":
        return "Regional Analytics";
      case "Agency Compliance":
        return "Agency Compliance";
      case "Audit Logs":
        return "Audit Logs";
      default:
        return "EEC Orientation – Administrator";
    }
  }, [activeNav]);

  function exportCsv() {
    const headers = [
      "PID",
      "Program Name",
      "Provider Name",
      "Provider Type",
      "Contact Email",
      "Phone",
      "CCR&R Agency",
      "Session Region",
      "Licensing Region",
      "Subsidy Region",
      "Language",
      "Session Title",
      "Orientation Date",
      "Orientation Time",
      "Format",
      "Registration Date",
      "Registration Time",
      "Attendance Status",
      "Sent Follow-up Email",
      "Sent Reminder",
      "Sent Feedback Survey",
      "Notes",
    ];

    const rows = filteredRegistrations.map((registration) => [
      escapeCSV(registration.stateProviderId ?? ""),
      escapeCSV(registration.organizationName),
      escapeCSV(registration.providerName),
      escapeCSV(registration.providerTypeLabel),
      escapeCSV(registration.contactEmail),
      escapeCSV(registration.phone ?? ""),
      escapeCSV(registration.agency),
      escapeCSV(registration.region),
      escapeCSV(registration.licensingRegion),
      escapeCSV(registration.subsidyRegion),
      escapeCSV(getLanguageLabel(registration.preferredLanguage)),
      escapeCSV(registration.sessionTitle),
      escapeCSV(formatSessionDate(registration.sessionDate)),
      escapeCSV(formatTimeRange(registration.sessionDate, registration.sessionEndsAt)),
      escapeCSV(registration.format),
      escapeCSV(formatSessionDate(registration.registeredAt)),
      escapeCSV(
        new Date(registration.registeredAt).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "America/New_York",
        }) + " ET",
      ),
      escapeCSV(registration.status),
      escapeCSV(registration.followUpSent),
      escapeCSV(registration.reminderSent),
      escapeCSV(registration.feedbackSurveySent),
      escapeCSV(registration.notes),
    ]);

    downloadCsv("eec-registrations.csv", buildCsv(headers, rows));
  }

  if (!isLoaded || !userId) return null;

  return (
    <PersonaGuardBoundary
      portal="eec"
      isReady={portalReady}
      setupMessage={setupMessage}
      portalLabel={portalLabel}
    >
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="border-b border-[#e2e6ed] bg-white sticky top-0 z-10">
        <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded bg-[#1a2f5e] flex items-center justify-center text-white text-xs font-bold">M</div>
              <div>
                <p className="text-sm font-semibold text-[#1a2f5e] leading-tight">EEC Admin</p>
                <p className="text-xs text-zinc-400 leading-tight">Statewide Access</p>
              </div>
            </div>
            <div className="flex items-center gap-3 lg:hidden">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-zinc-800">{adminName}</p>
                <p className="text-xs text-zinc-400">State Administrator</p>
              </div>
              <UserButton />
            </div>
          </div>
          <div className="w-full lg:max-w-xs lg:mx-8 lg:flex-1">
            <input
              type="search"
              placeholder="Search providers or agencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a2f5e]"
              aria-label="Search providers or agencies"
            />
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-zinc-800">{adminName}</p>
              <p className="text-xs text-zinc-400">State Administrator</p>
            </div>
            <UserButton />
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="lg:w-52 bg-white border-b lg:border-b-0 lg:border-r border-zinc-200 flex flex-col py-3 lg:py-4 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 px-2 overflow-x-auto lg:overflow-visible" aria-label="EEC admin">
            {NAV_ITEMS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setActiveNav(item)}
                className={`flex items-center whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                  activeNav === item ? "bg-[#1a2f5e] text-white" : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="px-2 flex flex-col gap-1 mt-3 lg:mt-4 border-t border-zinc-100 pt-3 lg:pt-4">
            <button
              type="button"
              onClick={exportCsv}
              className="w-full bg-[#1a2f5e] text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-[#152548] transition-colors"
            >
              Generate Report
            </button>
          </div>
        </aside>
        <main className="flex-1 px-4 sm:px-6 py-6 flex flex-col gap-6 overflow-auto">
          <PortalNotice message={portalNotice} />
          <h1 className="text-xl font-bold text-[#1a2f5e]">{pageTitle}</h1>

          {activeNav === "Overview" && (
            <>
              <StatsCards stats={stats} />
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2">
                  <TrendChart trend={trend} maxTrend={maxTrend} />
                </div>
                <RegionalCompletionPanel regionalRates={regionalRates} />
              </div>
              <div className="bg-white border border-zinc-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-zinc-800 mb-2">Quick links</p>
                <p className="text-sm text-zinc-600">
                  Use the sidebar to drill into registration records, regional trends, agency compliance, and audit activity.
                </p>
              </div>
            </>
          )}

          {activeNav === "Registration Data" && (
            <>
              <StatsCards stats={stats} />
              <div className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-wrap gap-3">
                {[
                  { label: "Agency", value: agency, setter: setAgency, options: agencies },
                  { label: "Region", value: region, setter: setRegion, options: regions },
                  { label: "Date Range", value: dateRange, setter: setDateRange, options: DATE_RANGES },
                  { label: "Provider Type", value: providerType, setter: setProviderType, options: PROVIDER_TYPES },
                  {
                    label: "Language",
                    value: language,
                    setter: setLanguage,
                    options: languages,
                    formatOption: (option: string) =>
                      option === "All Languages" ? option : getLanguageLabel(option),
                  },
                ].map(({ label, value, setter, options, formatOption }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <label className="text-xs text-zinc-400">{label}</label>
                    <select
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      className="border border-zinc-200 rounded-md px-2 py-1.5 text-xs text-zinc-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#1a2f5e] min-w-[130px]"
                    >
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {formatOption ? formatOption(option) : option}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                  <p className="text-sm font-semibold text-zinc-800">Provider Registrations</p>
                  <button
                    onClick={exportCsv}
                    className="text-xs font-medium text-zinc-600 border border-zinc-200 px-3 py-1.5 rounded-md hover:bg-zinc-50"
                  >
                    ↓ Export CSV
                  </button>
                </div>
                {error && (
                  <div className="px-4 py-3 text-sm text-red-600 border-b border-red-100 bg-red-50">
                    {error}
                  </div>
                )}
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      {[
                        "Provider Name",
                        "Program",
                        "PID",
                        "Agency",
                        "Orientation",
                        "Registered",
                        "Status",
                      ].map((header) => (
                        <th key={header} className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-400">
                          Loading registrations...
                        </td>
                      </tr>
                    ) : filteredRegistrations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-400">
                          No registrations match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredRegistrations.map((registration) => (
                        <tr key={registration.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-zinc-800">{registration.providerName}</td>
                          <td className="px-4 py-3 text-zinc-600">{registration.organizationName}</td>
                          <td className="px-4 py-3 text-zinc-500 font-mono text-xs">
                            {registration.stateProviderId ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-zinc-600">{registration.agency}</td>
                          <td className="px-4 py-3 text-zinc-600">
                            <p>{formatSessionDate(registration.sessionDate)}</p>
                            <p className="text-xs text-zinc-400">
                              {formatTimeRange(registration.sessionDate, registration.sessionEndsAt)}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-zinc-600">
                            {formatDateTime(registration.registeredAt)}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={registration.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
                <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100">
                  <p className="text-xs text-zinc-400">
                    Showing {filteredRegistrations.length} registration{filteredRegistrations.length === 1 ? "" : "s"}
                    {searchQuery.trim() ? " (search)" : ""}
                    {agency !== "All Agencies" || region !== "All Regions" || dateRange !== "Last 30 Days" || providerType !== "All Types" || language !== "All Languages"
                      ? " (filtered)"
                      : ""}
                  </p>
                </div>
              </div>
            </>
          )}

          {activeNav === "Regional Analytics" && (
            <>
              <StatsCards stats={stats} />
              <div className="grid grid-cols-2 gap-4">
                <TrendChart trend={trend} maxTrend={maxTrend} />
                <RegionalCompletionPanel regionalRates={regionalRates} />
              </div>
              <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-100">
                  <p className="text-sm font-semibold text-zinc-800">Completion by Region</p>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      {["Region", "Completion Rate", "Progress"].map((header) => (
                        <th key={header} className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {regionalRates.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-sm text-zinc-400">
                          No regional data available.
                        </td>
                      </tr>
                    ) : (
                      regionalRates.map((rate) => (
                        <tr key={rate.region} className="border-b border-zinc-50">
                          <td className="px-4 py-3 font-medium text-zinc-800">{rate.region}</td>
                          <td className="px-4 py-3 text-zinc-600">{rate.rate}%</td>
                          <td className="px-4 py-3">
                            <div className="h-2 bg-zinc-100 rounded-full max-w-xs">
                              <div className="h-full bg-[#1a2f5e] rounded-full" style={{ width: `${rate.rate}%` }} />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </>
          )}

          {activeNav === "Agency Compliance" && (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-zinc-700">
                Agency-level reporting for federal compliance. Completion rates reflect attended registrations across published sessions.
              </div>
              <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-100">
                  <p className="text-sm font-semibold text-zinc-800">CCR&amp;R Agency Summary</p>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      {["Agency", "Region", "Sessions", "Registrations", "Completions", "Rate"].map((header) => (
                        <th key={header} className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {agencyCompliance.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-400">
                          No agency compliance data available.
                        </td>
                      </tr>
                    ) : (
                      agencyCompliance.map((entry) => (
                        <tr key={entry.agency} className="border-b border-zinc-50 hover:bg-zinc-50">
                          <td className="px-4 py-3 font-medium text-zinc-800">{entry.agency}</td>
                          <td className="px-4 py-3 text-zinc-600">{entry.region}</td>
                          <td className="px-4 py-3 text-zinc-600">{entry.sessions}</td>
                          <td className="px-4 py-3 text-zinc-600">{entry.registrations}</td>
                          <td className="px-4 py-3 text-zinc-600">{entry.completions}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              entry.completionRate >= 75
                                ? "bg-green-50 text-green-700"
                                : entry.completionRate >= 50
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-600"
                            }`}>
                              {entry.completionRate}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </>
          )}

          {activeNav === "Audit Logs" && (
            <>
              <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-100">
                  <p className="text-sm font-semibold text-zinc-800">Recent Activity</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Registration and attendance changes across all agencies</p>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      {["Timestamp", "Action", "Detail", "Agency"].map((header) => (
                        <th key={header} className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-400">
                          No audit activity recorded yet.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={`${log.id}-${log.timestamp}`} className="border-b border-zinc-50 hover:bg-zinc-50">
                          <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                            {formatAuditTimestamp(log.timestamp)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-zinc-700">{log.detail}</td>
                          <td className="px-4 py-3 text-zinc-600">{log.agency}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
      <SiteFooter />
    </div>
    </PersonaGuardBoundary>
  );
}
