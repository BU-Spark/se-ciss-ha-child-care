"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";

type StaffSession = { id: string; format: "Virtual" | "In-person"; date: string; time: string; registered: number; capacity: number; };

const SESSIONS: StaffSession[] = [
  { id: "44219", format: "Virtual", date: "June 14, 2024", time: "10:00 AM – 12:30 PM", registered: 18, capacity: 25 },
  { id: "44225", format: "In-person", date: "June 21, 2024", time: "1:00 PM – 3:30 PM", registered: 24, capacity: 25 },
  { id: "44231", format: "Virtual", date: "June 28, 2024", time: "9:00 AM – 11:30 AM", registered: 5, capacity: 25 },
];

function NavBar() {
  const [active, setActive] = useState("Dashboard");
  return (
    <header className="border-b border-[#e2e6ed] bg-white sticky top-0 z-10">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#1a2f5e] flex items-center justify-center text-white text-xs font-bold">M</div>
            <span className="font-semibold text-[#1a2f5e] text-sm">EEC Orientation</span>
          </div>
          <nav className="flex gap-1">
            {["Dashboard", "Sessions", "Resources"].map((tab) => (
              <button key={tab} onClick={() => setActive(tab)} className={`px-3 py-1.5 text-sm font-medium transition-colors ${active === tab ? "text-[#1a2f5e] border-b-2 border-[#1a2f5e]" : "text-zinc-500 hover:text-zinc-800"}`}>{tab}</button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-600">Welcome, CCR&amp;R Staff</span>
          <UserButton  />
        </div>
      </div>
    </header>
  );
}

function SessionCard({ session }: { session: StaffSession }) {
  const router = useRouter();
  const pct = (session.registered / session.capacity) * 100;
  const isNearFull = pct >= 90;
  return (
    <div className="border border-zinc-200 rounded-lg bg-white p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${session.format === "Virtual" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>{session.format}</span>
        <span className="text-xs text-zinc-400">ID: {session.id}</span>
      </div>
      <div>
        <p className="text-lg font-bold text-[#1a2f5e]">{session.date}</p>
        <p className="text-sm text-zinc-500 mt-0.5">{session.time}</p>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Registered Capacity</span>
          <span className={`font-semibold ${isNearFull ? "text-red-600" : "text-zinc-700"}`}>{session.registered} / {session.capacity}</span>
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

  useEffect(() => {
    if (isLoaded && !userId) router.push("/sign-in");
  }, [isLoaded, userId, router]);

  if (!isLoaded || !userId) return null;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <NavBar />
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
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-800">Upcoming Sessions</h2>
            <button className="text-sm text-zinc-500 hover:text-zinc-700">All Formats</button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SESSIONS.map((s) => <SessionCard key={s.id} session={s} />)}
          </div>
        </section>
        <div className="border-l-4 border-[#1a2f5e] bg-blue-50 rounded-r-lg px-5 py-4 flex items-start justify-between gap-4">
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
