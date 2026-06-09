"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import { PersonaNav } from "@/components/persona-nav";

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

function SessionCard({ session }: { session: StaffSession }) {
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
      <button onClick={() => router.push(`/ccrr/sessions/${session.id}`)}
      className="w-full bg-[#1a2f5e] text-white py-2 rounded-md text-sm font-medium hover:bg-[#152548] transition-colors flex items-center justify-center gap-2">
      Manage Attendance →
      </button>
    </div>
  );
}

export default function CcrrPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<StaffSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !userId) router.push("/sign-in");
  }, [isLoaded, userId, router]);

  useEffect(() => {
    async function fetchSessions() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/ccrr/sessions");
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error?.message ?? "Unable to load sessions.");
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

    if (isLoaded && userId) {
      fetchSessions();
    }
  }, [isLoaded, userId]);

  if (!isLoaded || !userId) return null;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <PersonaNav basePath="/ccrr" subtitle="Welcome, CCR&R Staff" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 flex flex-col gap-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2f5e]">Staff Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-500 max-w-lg">Manage upcoming orientation sessions, track registration progress, and export agency attendance data for federal compliance.</p>
          </div>
          <button className="flex items-center gap-2 border border-zinc-300 bg-white text-zinc-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-zinc-50 transition-colors">
            ↓ Export All Data
          </button>
        </div>
        <section id="sessions">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-800">Upcoming Sessions</h2>
            <span className="text-sm text-zinc-500">
              {loading ? "Loading..." : `${sessions.length} session${sessions.length === 1 ? "" : "s"}`}
            </span>
          </div>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {loading ? (
            <div className="text-sm text-zinc-400 py-12 text-center">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-sm text-zinc-400 py-12 text-center">No upcoming sessions found for your agency.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((s) => <SessionCard key={s.id} session={s} />)}
            </div>
          )}
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
