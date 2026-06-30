"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

import { PersonaNav } from "@/components/persona-nav";
import { CreateSessionModal } from "@/components/create-session-modal";
import { PortalNotice } from "@/components/portal-notice";
import { PersonaGuardBoundary } from "@/components/persona-guard-boundary";
import { usePersonaGuard } from "@/hooks/use-persona-guard";

type StaffSession = {
  id: string;
  title: string;
  format: "Virtual" | "In-person";
  date: string;
  time: string;
  registered: number;
  capacity: number;
  spotsLeft: number | null;
};

type ApiSession = {
  id: string;
  title: string;
  format: "VIRTUAL" | "IN_PERSON";
  startsAt: string;
  endsAt: string;
  registeredCount: number;
  capacity: number;
  spotsLeft: number | null;
};

type StatewideRegistration = {
  id: string;
  providerName: string;
  organizationName: string;
  contactEmail: string;
  stateProviderId: string | null;
  attendanceLabel: string;
  registeredAt: string;
  canManageAttendance: boolean;
  session: {
    id: string;
    title: string;
    region: string;
    format: string;
    startsAt: string;
    agency: { id: string; name: string; region: string };
  };
};

type AgencyOption = {
  id: string;
  name: string;
  region: string;
};

function formatSessionDate(startsAt: string) {
  return new Date(startsAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSessionTime(startsAt: string, endsAt: string) {
  const start = new Date(startsAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const end = new Date(endsAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${start} – ${end}`;
}

function mapSession(session: ApiSession): StaffSession {
  return {
    id: session.id,
    title: session.title,
    format: session.format === "VIRTUAL" ? "Virtual" : "In-person",
    date: formatSessionDate(session.startsAt),
    time: formatSessionTime(session.startsAt, session.endsAt),
    registered: session.registeredCount,
    capacity: session.capacity,
    spotsLeft: session.spotsLeft,
  };
}

function SessionCard({
  session,
  onCancel,
  cancelling,
}: {
  session: StaffSession;
  onCancel: (sessionId: string) => void;
  cancelling: boolean;
}) {
  const router = useRouter();
  const pct = session.capacity > 0 ? (session.registered / session.capacity) * 100 : 0;
  const isNearFull = pct >= 90;
  return (
    <div className="border border-zinc-200 rounded-lg bg-white p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${session.format === "Virtual" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>{session.format}</span>
        <span className="text-xs text-zinc-400 truncate max-w-[140px]" title={session.id}>ID: {session.id}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-600">{session.title}</p>
        <p className="text-lg font-bold text-[#1a2f5e] mt-1">{session.date}</p>
        <p className="text-sm text-zinc-500 mt-0.5">{session.time}</p>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Registered Capacity</span>
          <span className={`font-semibold ${isNearFull ? "text-red-600" : "text-zinc-700"}`}>
            {session.registered} / {session.capacity}
            {session.spotsLeft !== null ? ` · ${session.spotsLeft} open` : ""}
          </span>
        </div>
        <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${isNearFull ? "bg-red-500" : "bg-[#1a2f5e]"}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => router.push(`/ccrr/sessions/${session.id}`)}
          className="w-full bg-[#1a2f5e] text-white py-2 rounded-md text-sm font-medium hover:bg-[#152548] transition-colors"
        >
          Manage Attendance →
        </button>
        <button
          type="button"
          onClick={() => onCancel(session.id)}
          disabled={cancelling}
          className="w-full border border-red-200 text-red-700 py-2 rounded-md text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {cancelling ? "Cancelling..." : "Cancel session"}
        </button>
      </div>
    </div>
  );
}

export default function CcrrPage() {
  const { isLoaded, userId } = useAuth();
  const { isReady: portalReady, notice: portalNotice, setupMessage, portalLabel, canLoadData } = usePersonaGuard("ccrr");
  const [sessions, setSessions] = useState<StaffSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<StatewideRegistration[]>([]);
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(true);
  const [registrationsError, setRegistrationsError] = useState<string | null>(null);
  const [agencyFilter, setAgencyFilter] = useState("All Agencies");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sessionsKey, setSessionsKey] = useState(0);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [sessionActionError, setSessionActionError] = useState<string | null>(null);

  const ccrrNavItems = [
    {
      label: "Registrations",
      segment: "registrations",
      href: (base: string) => `${base}#registrations`,
    },
  ];

  useEffect(() => {
    async function fetchSessions() {
      setLoading(true);
      setError(null);
      setErrorCode(null);

      try {
        const res = await fetch("/api/ccrr/sessions");
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error?.message ?? "Unable to load sessions.");
          setErrorCode(json.error?.code ?? null);
          setSessions([]);
          return;
        }

        const now = new Date();
        const upcoming = (json.data.sessions as ApiSession[])
          .filter((session) => new Date(session.startsAt) >= now)
          .map(mapSession);

        setSessions(upcoming);
      } catch {
        setError("Network error. Please try again.");
        setSessions([]);
      } finally {
        setLoading(false);
      }
    }

    if (canLoadData) {
      fetchSessions();
    }
  }, [canLoadData, sessionsKey]);

  async function handleCancelSession(sessionId: string) {
    const confirmed = window.confirm(
      "Cancel this session? Providers will no longer be able to register, but existing registrations remain on record.",
    );

    if (!confirmed) {
      return;
    }

    setCancellingId(sessionId);
    setSessionActionError(null);

    try {
      const res = await fetch(`/api/ccrr/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setSessionActionError(json.error?.message ?? "Unable to cancel session.");
        return;
      }

      setSessionsKey((value) => value + 1);
    } catch {
      setSessionActionError("Network error. Please try again.");
    } finally {
      setCancellingId(null);
    }
  }

  useEffect(() => {
    async function fetchRegistrations() {
      setRegistrationsLoading(true);
      setRegistrationsError(null);

      try {
        const params = new URLSearchParams();
        if (agencyFilter !== "All Agencies") {
          params.set("agency", agencyFilter);
        }
        if (searchQuery.trim()) {
          params.set("search", searchQuery.trim());
        }

        const query = params.toString();
        const res = await fetch(
          `/api/ccrr/registrations${query ? `?${query}` : ""}`,
        );
        const json = await res.json();

        if (!res.ok || !json.success) {
          setRegistrations([]);
          setRegistrationsError(
            json.error?.message ?? "Unable to load statewide registrations.",
          );
          return;
        }

        setRegistrations(json.data.registrations);
        setAgencies(json.data.agencies);
      } catch {
        setRegistrations([]);
        setRegistrationsError("Network error. Please try again.");
      } finally {
        setRegistrationsLoading(false);
      }
    }

    if (canLoadData) {
      fetchRegistrations();
    }
  }, [canLoadData, agencyFilter, searchQuery]);

  async function handleExport() {
    setExporting(true);
    setExportError(null);

    try {
      const res = await fetch("/api/ccrr/export");
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setExportError(json?.error?.message ?? "Unable to export data.");
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const filename =
        disposition?.match(/filename="(.+)"/)?.[1] ?? "ccrr-export.csv";
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Network error. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  if (!isLoaded || !userId) return null;

  return (
    <PersonaGuardBoundary
      portal="ccrr"
      isReady={portalReady}
      setupMessage={setupMessage}
      portalLabel={portalLabel}
    >
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <PersonaNav
        basePath="/ccrr"
        subtitle="Welcome, CCR&R Staff"
        extraNavItems={ccrrNavItems}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 flex flex-col gap-8">
        <PortalNotice message={portalNotice} />
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2f5e]">Staff Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-500 max-w-lg">Manage upcoming orientation sessions, track registration progress, and export agency attendance data for federal compliance.</p>
            {exportError && (
              <p className="mt-2 text-sm text-red-600">{exportError}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 border border-zinc-300 bg-white text-zinc-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            {exporting ? "Exporting..." : "↓ Export All Data"}
          </button>
        </div>
        <section id="sessions">
          <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-zinc-700">
            <p className="font-medium text-[#1a2f5e]">How sessions work</p>
            <p className="mt-1">
              <strong>Providers</strong> register themselves on the Provider portal.
              <strong> CCR&amp;R staff</strong> publish sessions here, manage attendance, and export data.
            </p>
          </div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-800">Upcoming Sessions</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-500">
                {loading ? "Loading..." : `${sessions.length} session${sessions.length === 1 ? "" : "s"}`}
              </span>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="bg-[#1a2f5e] text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-[#152548] transition-colors"
              >
                + Add session
              </button>
            </div>
          </div>
          {sessionActionError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {sessionActionError}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="font-medium text-red-800">{error}</p>
              {errorCode === "PROFILE_NOT_LINKED" && (
                <>
                  <p className="mt-2 text-red-700">
                    Sign in with your CCR&amp;R staff email, or run:
                  </p>
                  <code className="mt-1 block rounded bg-red-100 px-2 py-1 text-xs text-red-900">
                    npm run account:link -- ccrr YOUR_CLERK_USER_ID seed-agency-boston staff@example.com
                  </code>
                </>
              )}
            </div>
          )}
          {loading ? (
            <div className="text-sm text-zinc-400 py-12 text-center">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-sm text-zinc-400 py-12 text-center">No upcoming sessions found for your agency.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onCancel={handleCancelSession}
                  cancelling={cancellingId === session.id}
                />
              ))}
            </div>
          )}
        </section>

        {showCreateModal && (
          <CreateSessionModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => setSessionsKey((value) => value + 1)}
          />
        )}

        <section id="registrations" className="flex flex-col gap-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-zinc-700">
            <p className="font-medium text-[#1a2f5e]">Statewide registrations (read-only)</p>
            <p className="mt-1">
              View registrations across all CCR&amp;R agencies. You can only mark attendance
              for sessions hosted by your agency — use <strong>Manage attendance</strong> on
              your own sessions above.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-zinc-800">All Registrations</h2>
              <p className="text-sm text-zinc-500 mt-0.5">
                {registrationsLoading
                  ? "Loading..."
                  : `${registrations.length} registration${registrations.length === 1 ? "" : "s"}`}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search provider, program, or agency..."
                className="border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1a2f5e] sm:w-64"
              />
              <select
                value={agencyFilter}
                onChange={(event) => setAgencyFilter(event.target.value)}
                className="border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#1a2f5e]"
              >
                <option value="All Agencies">All Agencies</option>
                {agencies.map((agency) => (
                  <option key={agency.id} value={agency.name}>
                    {agency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {registrationsError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {registrationsError}
            </div>
          )}

          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    {[
                      "Provider",
                      "Program",
                      "Session",
                      "Session Date",
                      "Hosting Agency",
                      "Attendance",
                      "Registered",
                      "",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {registrationsLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-sm text-zinc-400">
                        Loading registrations...
                      </td>
                    </tr>
                  ) : registrations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-sm text-zinc-400">
                        No registrations found.
                      </td>
                    </tr>
                  ) : (
                    registrations.map((registration) => (
                      <tr
                        key={registration.id}
                        className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-zinc-800">{registration.providerName}</p>
                          <p className="text-xs text-zinc-500">{registration.contactEmail}</p>
                        </td>
                        <td className="px-4 py-3 text-zinc-600">
                          <p>{registration.organizationName}</p>
                          {registration.stateProviderId ? (
                            <p className="text-xs font-mono text-zinc-400">
                              PID {registration.stateProviderId}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-zinc-600">
                          <p>{registration.session.title}</p>
                          <p className="text-xs text-zinc-400">
                            {registration.session.format} · {registration.session.region}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                          {formatShortDate(registration.session.startsAt)}
                        </td>
                        <td className="px-4 py-3 text-zinc-600">
                          {registration.session.agency.name}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                            {registration.attendanceLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                          {formatShortDate(registration.registeredAt)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {registration.canManageAttendance ? (
                            <Link
                              href={`/ccrr/sessions/${registration.session.id}`}
                              className="text-sm font-medium text-[#1a2f5e] hover:underline"
                            >
                              Manage attendance
                            </Link>
                          ) : (
                            <Link
                              href={`/ccrr/sessions/${registration.session.id}`}
                              className="text-sm font-medium text-zinc-500 hover:underline"
                            >
                              View only
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div id="resources" className="border-l-4 border-[#1a2f5e] bg-blue-50 rounded-r-lg px-5 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#1a2f5e]">Quarterly Reporting Notice</p>
            <p className="text-sm text-zinc-600 mt-0.5">All attendance data for Q2 must be verified and finalized by July 5th. Please ensure all virtual session logs are uploaded.</p>
          </div>
          <a href="#" className="text-sm text-[#1a2f5e] font-medium whitespace-nowrap hover:underline flex-shrink-0">View reporting guidelines ↗</a>
        </div>
      </main>
      <footer className="border-t border-zinc-200 bg-white py-4 px-6">
        <div className="mx-auto max-w-5xl flex items-center justify-between text-xs text-zinc-400">
          <span>© 2026 Massachusetts Department of Early Education and Care</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-zinc-600">Accessibility</a>
            <a href="#" className="hover:text-zinc-600">Contact Support</a>
            <a href="#" className="hover:text-zinc-600">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
    </PersonaGuardBoundary>
  );
}
