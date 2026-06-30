"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import { PersonaNav } from "@/components/persona-nav";
import { PortalNotice } from "@/components/portal-notice";
import { PersonaGuardBoundary } from "@/components/persona-guard-boundary";
import { usePersonaGuard } from "@/hooks/use-persona-guard";

type Provider = {
  id: string;
  name: string;
  email: string;
  stateProviderId: string | null;
  registrationDate: string;
  attendanceStatus: "NOT_MARKED" | "ATTENDED" | "NO_SHOW";
  notes: string;
};

type SessionDetail = {
  id: string;
  title: string;
  date: string;
  time: string;
  format: string;
  facilitator: string;
  totalRegistered: number;
  status: string;
};

type ApiRegistration = {
  id: string;
  providerName: string;
  contactEmail: string;
  stateProviderId: string | null;
  attendanceStatus: "NOT_MARKED" | "ATTENDED" | "NO_SHOW";
  notes: string | null;
  registeredAt: string;
};

type ApiSession = {
  id: string;
  title: string;
  format: "VIRTUAL" | "IN_PERSON";
  status: string;
  startsAt: string;
  endsAt: string;
  locationName: string | null;
  meetingUrl: string | null;
  registeredCount: number;
  agency: { id: string; name: string; region: string };
};

function formatSessionDate(startsAt: string) {
  return new Date(startsAt).toLocaleDateString("en-US", {
    month: "long",
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
  return `${start} - ${end}`;
}

function formatRegistrationDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSessionFormat(
  format: "VIRTUAL" | "IN_PERSON",
  locationName: string | null,
  meetingUrl: string | null,
) {
  if (format === "VIRTUAL") {
    return meetingUrl ? "Virtual (Zoom)" : "Virtual";
  }

  return locationName ? `In-person (${locationName})` : "In-person";
}

function mapSession(session: ApiSession): SessionDetail {
  return {
    id: session.id,
    title: session.title,
    date: formatSessionDate(session.startsAt),
    time: formatSessionTime(session.startsAt, session.endsAt),
    format: formatSessionFormat(
      session.format,
      session.locationName,
      session.meetingUrl,
    ),
    facilitator: session.agency.name,
    totalRegistered: session.registeredCount,
    status: session.status,
  };
}

function mapRegistration(registration: ApiRegistration): Provider {
  return {
    id: registration.id,
    name: registration.providerName,
    email: registration.contactEmail,
    stateProviderId: registration.stateProviderId,
    registrationDate: formatRegistrationDate(registration.registeredAt),
    attendanceStatus: registration.attendanceStatus,
    notes: registration.notes ?? "",
  };
}

export default function SessionDetailPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const { isReady: portalReady, notice: portalNotice, setupMessage, portalLabel, canLoadData } = usePersonaGuard("ccrr");
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [initialProviders, setInitialProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [canManageAttendance, setCanManageAttendance] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent(`/ccrr/sessions/${sessionId}`)}`);
    }
  }, [isLoaded, userId, router, sessionId]);

  useEffect(() => {
    async function fetchSession() {
      setLoading(true);
      setError(null);
      setSaved(false);
      setSaveError(null);

      try {
        const res = await fetch(`/api/ccrr/sessions/${sessionId}/registrations`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          if (res.status === 404) {
            router.replace("/ccrr");
            return;
          }

          setError(json.error?.message ?? "Unable to load session.");
          setSession(null);
          setProviders([]);
          return;
        }

        const mappedProviders = (json.data.registrations as ApiRegistration[]).map(
          mapRegistration,
        );
        setCanManageAttendance(json.data.canManageAttendance !== false);
        setSession(mapSession(json.data.session as ApiSession));
        setProviders(mappedProviders);
        setInitialProviders(mappedProviders);
      } catch {
        setError("Network error. Please try again.");
        setSession(null);
        setProviders([]);
      } finally {
        setLoading(false);
      }
    }

    if (canLoadData && sessionId) {
      fetchSession();
    }
  }, [canLoadData, sessionId, router]);

  function setAttendanceStatus(
    id: string,
    attendanceStatus: Provider["attendanceStatus"],
  ) {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, attendanceStatus } : p)),
    );
    setSaved(false);
    setSaveError(null);
  }

  function updateNotes(id: string, notes: string) {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, notes } : p)),
    );
    setSaved(false);
    setSaveError(null);
  }

  function providerChanged(provider: Provider, initial: Provider) {
    return (
      provider.attendanceStatus !== initial.attendanceStatus ||
      provider.notes.trim() !== initial.notes.trim()
    );
  }

  async function handleMarkAttendance() {
    setSaving(true);
    setSaveError(null);

    const changedProviders = providers.filter((provider) => {
      const initial = initialProviders.find((entry) => entry.id === provider.id);
      return initial ? providerChanged(provider, initial) : false;
    });

    if (changedProviders.length === 0) {
      setSaving(false);
      setSaveError("No attendance changes to save.");
      return;
    }

    try {
      for (const provider of changedProviders) {
        const res = await fetch(`/api/registrations/${provider.id}/attendance`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attendanceStatus: provider.attendanceStatus,
            notes: provider.notes.trim() || null,
          }),
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error?.message ?? "Failed to save attendance.");
        }
      }

      setInitialProviders(providers);
      setSaved(true);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save attendance.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelSession() {
    const confirmed = window.confirm(
      "Cancel this session? Providers will no longer be able to register.",
    );

    if (!confirmed) {
      return;
    }

    setCancelling(true);
    setCancelError(null);

    try {
      const res = await fetch(`/api/ccrr/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setCancelError(json.error?.message ?? "Unable to cancel session.");
        return;
      }

      router.push("/ccrr#sessions");
    } catch {
      setCancelError("Network error. Please try again.");
    } finally {
      setCancelling(false);
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
  {loading ? (
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <PersonaNav basePath="/ccrr" subtitle="CCR&R Staff" />
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
          <p className="text-sm text-zinc-400 py-12 text-center">Loading session...</p>
        </main>
      </div>
  ) : !session ? (
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <PersonaNav basePath="/ccrr" subtitle="CCR&R Staff" />
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
          <p className="text-sm text-red-600 py-12 text-center">{error ?? "Session not found."}</p>
        </main>
      </div>
  ) : (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <PersonaNav basePath="/ccrr" subtitle="CCR&R Staff" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 flex flex-col gap-6">
        <PortalNotice message={portalNotice} />

        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <button onClick={() => router.push("/ccrr")} className="hover:text-zinc-600 transition-colors">Dashboard</button>
          <span>›</span>
          <span className="text-zinc-600 font-medium">Session Details</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2f5e]">{session.title}</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {canManageAttendance
                ? "Manage attendance and session records for active childcare providers."
                : "View-only: this session is hosted by another CCR&R agency."}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-600 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              FORMAT: <span className="font-semibold text-zinc-800">{session.format}</span>
            </div>
            <div className="border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-600 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              TOTAL: <span className="font-semibold text-zinc-800">{session.totalRegistered} Registered</span>
            </div>
          </div>
        </div>

        {!canManageAttendance && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Attendance is read-only for this session. You can only mark attendance for
            sessions hosted by your agency.
          </div>
        )}

        {session.status === "CANCELLED" && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            This session has been cancelled.
          </div>
        )}

        {cancelError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {cancelError}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "DATE", value: session.date },
            { label: "TIME", value: session.time },
            { label: "FACILITATOR", value: session.facilitator },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-zinc-200 rounded-lg px-5 py-4">
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide mb-1">{label}</p>
              <p className="text-base font-semibold text-zinc-800">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                {["Provider Name", "Email", "PID", "Registration Date", "Attendance", "Notes"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {providers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-400">
                    No registrations for this session yet.
                  </td>
                </tr>
              ) : (
                providers.map((provider) => (
                  <tr key={provider.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-800">{provider.name}</td>
                    <td className="px-4 py-3 text-zinc-500">{provider.email}</td>
                    <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{provider.stateProviderId ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-500">{provider.registrationDate}</td>
                    <td className="px-4 py-3">
                      {canManageAttendance ? (
                        <select
                          value={provider.attendanceStatus}
                          onChange={(e) =>
                            setAttendanceStatus(
                              provider.id,
                              e.target.value as Provider["attendanceStatus"],
                            )
                          }
                          className="border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#1a2f5e]"
                        >
                          <option value="NOT_MARKED">Not marked</option>
                          <option value="ATTENDED">Attended</option>
                          <option value="NO_SHOW">No-show</option>
                        </select>
                      ) : (
                        <span className="text-xs text-zinc-600">
                          {provider.attendanceStatus === "ATTENDED"
                            ? "Attended"
                            : provider.attendanceStatus === "NO_SHOW"
                              ? "No-show"
                              : "Not marked"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {canManageAttendance ? (
                        <input
                          type="text"
                          value={provider.notes}
                          onChange={(e) => updateNotes(provider.id, e.target.value)}
                          placeholder="Add note..."
                          className="border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#1a2f5e] w-full"
                        />
                      ) : (
                        <span className="text-xs text-zinc-500">
                          {provider.notes || "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <div>
            {saved && (
              <span className="text-sm text-green-600 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Attendance saved
              </span>
            )}
            {saveError && (
              <span className="text-sm text-red-600">{saveError}</span>
            )}
          </div>
          {canManageAttendance && session.status !== "CANCELLED" && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancelSession}
                disabled={cancelling}
                className="border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Cancel session"}
              </button>
              <button
                type="button"
                onClick={handleMarkAttendance}
                disabled={saving || providers.length === 0}
                className="flex items-center gap-2 bg-[#1a2f5e] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#152548] transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                {saving ? "Saving..." : "Mark Attendance"}
              </button>
            </div>
          )}
        </div>

      </main>

      <footer className="border-t border-zinc-200 bg-white py-4 px-6">
        <div className="mx-auto max-w-5xl flex items-center justify-between text-xs text-zinc-400">
          <div>
            <p className="font-medium text-zinc-500">EEC Orientation</p>
            <p>© 2026 Massachusetts Department of Early Education and Care</p>
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-zinc-600">Accessibility</a>
            <a href="#" className="hover:text-zinc-600">Contact Support</a>
            <a href="#" className="hover:text-zinc-600">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  )}
    </PersonaGuardBoundary>
  );
}
