"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";

// ─── Types ────────────────────────────────────────────────────────────────────

type Provider = {
  id: string;
  name: string;
  email: string;
  registrationDate: string;
  attended: boolean;
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
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
// TODO: replace with GET /api/ccrr/sessions/[id]/registrations

const MOCK_SESSIONS: Record<string, SessionDetail> = {
  "44219": { id: "44219", title: "EEC Orientation – CCR&R Staff", date: "June 14, 2024", time: "10:00 AM - 12:30 PM", format: "Virtual (Zoom)", facilitator: "Sarah Mitchell", totalRegistered: 3 },
  "44225": { id: "44225", title: "EEC Orientation – CCR&R Staff", date: "June 21, 2024", time: "1:00 PM - 3:30 PM", format: "In-person", facilitator: "Sarah Mitchell", totalRegistered: 2 },
  "44231": { id: "44231", title: "EEC Orientation – CCR&R Staff", date: "June 28, 2024", time: "9:00 AM - 11:30 AM", format: "Virtual (Zoom)", facilitator: "Sarah Mitchell", totalRegistered: 1 },
};

const MOCK_PROVIDERS_BY_SESSION: Record<string, Provider[]> = {
  "44219": [
    { id: "1", name: "Maria Rodriguez", email: "m.rodriguez@example.com", registrationDate: "Jun 2, 2024", attended: false, notes: "" },
    { id: "2", name: "James Chen", email: "j.chen@daycare.org", registrationDate: "Jun 4, 2024", attended: true, notes: "Arrived 5 mins late" },
    { id: "3", name: "Althea Jenkins", email: "ajenkins@provider.net", registrationDate: "Jun 5, 2024", attended: false, notes: "" },
  ],
  "44225": [
    { id: "4", name: "Devon Walsh", email: "d.walsh@brightstart.org", registrationDate: "Jun 9, 2024", attended: false, notes: "" },
    { id: "5", name: "Priya Nair", email: "priya.nair@example.com", registrationDate: "Jun 11, 2024", attended: false, notes: "" },
  ],
  "44231": [
    { id: "6", name: "Tomás Herrera", email: "t.herrera@littlesteps.org", registrationDate: "Jun 18, 2024", attended: false, notes: "" },
  ],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavBar() {
  const [active, setActive] = useState("Sessions");
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
          <span className="text-sm text-zinc-600">CCR&amp;R Staff</span>
          <UserButton />
        </div>
      </div>
    </header>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SessionDetailPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  // Derived, not state — recomputes when the route param changes.
  const session = MOCK_SESSIONS[sessionId] ?? null;

  // Stays as state because attendance toggles/notes mutate it.
  const [providers, setProviders] = useState<Provider[]>(
    MOCK_PROVIDERS_BY_SESSION[sessionId] ?? []
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (isLoaded && !userId) router.push("/sign-in");
  }, [isLoaded, userId, router]);

  // Redirect to dashboard if the session id doesn't exist (only once auth is settled)
  useEffect(() => {
    if (isLoaded && userId && !session) router.replace("/ccrr");
  }, [isLoaded, userId, session, router]);

  // Reset provider state when navigating between sessions (component may be reused)
  useEffect(() => {
    setProviders(MOCK_PROVIDERS_BY_SESSION[sessionId] ?? []);
    setSaved(false);
  }, [sessionId]);

  // TODO: fetch real session + registrations
  // useEffect(() => {
  //   fetch(`/api/ccrr/sessions/${sessionId}/registrations`)
  //     .then(r => r.json())
  //     .then(json => { setProviders(json.data.registrations); });
  // }, [sessionId]);

  function toggleAttended(id: string) {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, attended: !p.attended } : p))
    );
    setSaved(false);
  }

  function updateNotes(id: string, notes: string) {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, notes } : p))
    );
    setSaved(false);
  }

  async function handleMarkAttendance() {
    setSaving(true);
    // TODO: POST /api/ccrr/sessions/[id]/attendance with providers attendance data
    await new Promise((r) => setTimeout(r, 800)); // simulate API call
    setSaving(false);
    setSaved(true);
  }

  if (!isLoaded || !userId) return null;
  if (!session) return null; // redirect effect handles navigation

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <NavBar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 flex flex-col gap-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <button onClick={() => router.push("/ccrr")} className="hover:text-zinc-600 transition-colors">Dashboard</button>
          <span>›</span>
          <span className="text-zinc-600 font-medium">Session Details</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2f5e]">{session.title}</h1>
            <p className="text-sm text-zinc-500 mt-1">Manage attendance and session records for active childcare providers.</p>
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

        {/* Session Info Row */}
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

        {/* Attendance Table */}
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                {["Provider Name", "Email", "Registration Date", "Attended", "Notes"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {providers.map((provider) => (
                <tr key={provider.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-800">{provider.name}</td>
                  <td className="px-4 py-3 text-zinc-500">{provider.email}</td>
                  <td className="px-4 py-3 text-zinc-500">{provider.registrationDate}</td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={provider.attended}
                      onChange={() => toggleAttended(provider.id)}
                      className="w-4 h-4 rounded border-zinc-300 accent-[#1a2f5e] cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={provider.notes}
                      onChange={(e) => updateNotes(provider.id, e.target.value)}
                      placeholder="Add note..."
                      className="border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#1a2f5e] w-full"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div>
            {saved && (
              <span className="text-sm text-green-600 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Attendance saved
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 border border-zinc-300 bg-white text-zinc-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-zinc-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Send Follow-up Email
            </button>
            <button
              onClick={handleMarkAttendance}
              disabled={saving}
              className="flex items-center gap-2 bg-[#1a2f5e] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#152548] transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              {saving ? "Saving..." : "Mark Attendance"}
            </button>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-4 px-6">
        <div className="mx-auto max-w-5xl flex items-center justify-between text-xs text-zinc-400">
          <div>
            <p className="font-medium text-zinc-500">EEC Orientation</p>
            <p>© 2024 Massachusetts Department of Early Education and Care</p>
          </div>
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