"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";

// ─── Types ────────────────────────────────────────────────────────────────────

type Session = {
  id: string;
  region: string;
  title: string;
  startsAt: string;
  endsAt: string;
  agency: { id: string; name: string; region: string };
  format: "VIRTUAL" | "IN_PERSON";
  spotsLeft: number | null;
  capacity: number;
  registeredCount: number;
  locationName: string | null;
  meetingUrl: string | null;
};

type Registration = {
  id: string;
  title: string;
  dateLabel: string;
  time: string;
  format: string;
  agency: string;
  status: "Confirmed" | "Pending";
};

// ─── Constants ────────────────────────────────────────────────────────────────

const REGIONS = ["All Regions", "Northeast", "Metro", "Boston", "Central", "Western", "Southeast"];
const DATE_RANGES = ["Next 30 days", "Next 7 days", "Next 90 days", "All upcoming"];
const FORMATS = ["All Formats", "Virtual", "In-person"];
const PROVIDER_TYPES = [
  { value: "UNKNOWN", label: "Select type..." },
  { value: "CENTER_BASED", label: "Center-based" },
  { value: "FAMILY_CHILD_CARE", label: "Family Child Care" },
  { value: "SCHOOL_AGE", label: "School-age" },
  { value: "OTHER", label: "Other" },
];

// Mock registrations — will be replaced with real data later
const REGISTRATIONS: Registration[] = [
  { id: "1", title: "EEC Mandatory Orientation – Nov 20", dateLabel: "NOV 20", time: "6:30 PM", format: "Virtual", agency: "Child Care Circuit", status: "Confirmed" },
  { id: "2", title: "Business Practice Workshop", dateLabel: "DEC 05", time: "10:00 AM", format: "In-person (Springfield)", agency: "Seven Hills", status: "Pending" },
];

// ─── Registration Modal ───────────────────────────────────────────────────────

function RegistrationModal({
  session,
  onClose,
  onSuccess,
}: {
  session: Session;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    providerName: "",
    organizationName: "",
    contactEmail: "",
    phone: "",
    providerType: "UNKNOWN",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sessionId: session.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Something went wrong. Please try again.");
        return;
      }
      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const sessionDate = new Date(session.startsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const sessionTime = `${new Date(session.startsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} – ${new Date(session.endsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-zinc-100">
          <div>
            <p className="text-xs text-zinc-400 mb-1">Sessions › Registration</p>
            <h2 className="text-xl font-bold text-[#1a2f5e]">Session Registration: {session.title}</h2>
            <p className="text-sm text-zinc-500 mt-1">Please complete the form below to secure your attendance.</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 ml-4 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex gap-6 p-6">
          {/* Form */}
          <div className="flex-1 flex flex-col gap-5">
            {/* Registration Details */}
            <div className="border border-zinc-200 rounded-lg p-4 flex flex-col gap-4">
              <h3 className="font-semibold text-zinc-800">Registration Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-600">Provider Name</label>
                  <input name="providerName" value={form.providerName} onChange={handleChange} placeholder="Your full name" className="border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1a2f5e]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-600">Organization Name</label>
                  <input name="organizationName" value={form.organizationName} onChange={handleChange} placeholder="Your organization" className="border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1a2f5e]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-600">Contact Email</label>
                  <input name="contactEmail" value={form.contactEmail} onChange={handleChange} type="email" placeholder="email@example.com" className="border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1a2f5e]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-600">Phone Number</label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="(555) 000-0000" className="border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1a2f5e]" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-600">Provider Type</label>
                <select name="providerType" value={form.providerType} onChange={handleChange} className="border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1a2f5e]">
                  {PROVIDER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            {/* Auto confirmation notice */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex gap-2">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
              <p className="text-xs text-blue-700">Upon clicking "Complete Registration", a confirmation email will be sent to the provided contact address containing the full session agenda and secure Zoom meeting link.</p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-[#1a2f5e] text-white py-2.5 rounded-md text-sm font-medium hover:bg-[#152548] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Complete Registration"}
            </button>
          </div>

          {/* Session Summary Sidebar */}
          <div className="w-44 flex-shrink-0 flex flex-col gap-3">
            <div className="border border-zinc-200 rounded-lg p-4 flex flex-col gap-3">
              <h3 className="font-semibold text-zinc-800 text-sm">Session Summary</h3>
              <div className="flex flex-col gap-2 text-xs text-zinc-600">
                <div>
                  <p className="text-zinc-400 mb-0.5">Date</p>
                  <p className="font-medium">{sessionDate}</p>
                </div>
                <div>
                  <p className="text-zinc-400 mb-0.5">Time</p>
                  <p className="font-medium">{sessionTime}</p>
                </div>
                <div>
                  <p className="text-zinc-400 mb-0.5">Location</p>
                  <p className="font-medium">{session.format === "VIRTUAL" ? "Virtual (Link provided after registration)" : session.locationName ?? "In-person"}</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">Registration closes 24 hours prior to the session start time. For assistance, contact our support team.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Success Modal ────────────────────────────────────────────────────────────

function SuccessModal({ session, onClose }: { session: Session; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8 flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-xl font-bold text-zinc-800">You&apos;re registered!</h2>
        <p className="text-sm text-zinc-500">You&apos;ve successfully registered for <span className="font-medium text-zinc-700">{session.title}</span>. A confirmation email has been sent to you.</p>
        <button onClick={onClose} className="mt-2 bg-[#1a2f5e] text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-[#152548] transition-colors">Done</button>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
          <UserButton />
        </div>
      </div>
    </header>
  );
}

function SessionCard({ session, onRegister }: { session: Session; onRegister: (s: Session) => void }) {
  const urgent = session.spotsLeft !== null && session.spotsLeft <= 3;
  const formatDetail = session.format === "VIRTUAL" ? "Virtual – via Zoom" : session.locationName ?? "In-person";

  return (
    <div className="border border-zinc-200 rounded-lg bg-white p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">{session.region}</span>
        {urgent ? (
          <span className="text-xs font-semibold text-orange-600">⚠ ONLY {session.spotsLeft} SPOTS LEFT</span>
        ) : (
          <span className="text-xs text-zinc-500">{session.spotsLeft ?? "Unlimited"} spots left</span>
        )}
      </div>
      <h3 className="font-semibold text-[#1a2f5e]">{session.title}</h3>
      <div className="flex flex-col gap-1 text-sm text-zinc-600">
        <span>📅 {new Date(session.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        <span>🕐 {new Date(session.startsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} – {new Date(session.endsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
        <span>🏢 {session.agency.name}</span>
        <span>💻 {formatDetail}</span>
      </div>
      <button
        onClick={() => onRegister(session)}
        className="w-full bg-[#1a2f5e] text-white py-2 rounded-md text-sm font-medium hover:bg-[#152548] transition-colors mt-1"
      >
        Register
      </button>
    </div>
  );
}

function RegistrationRow({ reg }: { reg: Registration }) {
  const [month, day] = reg.dateLabel.split(" ");
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0">
      <div className="flex items-center gap-4">
        <div className="bg-[#1a2f5e] text-white rounded text-center px-2 py-1 min-w-[44px]">
          <div className="text-[10px] font-medium uppercase">{month}</div>
          <div className="text-base font-bold leading-tight">{day}</div>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-800">{reg.title}</p>
          <p className="text-xs text-zinc-500">{reg.time} · {reg.format} · {reg.agency}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${reg.status === "Confirmed" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>{reg.status}</span>
        <button className="text-xs text-red-500 hover:text-red-700 font-medium">Cancel Registration</button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProviderPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [region, setRegion] = useState("All Regions");
  const [dateRange, setDateRange] = useState("Next 30 days");
  const [format, setFormat] = useState("All Formats");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [registeredSession, setRegisteredSession] = useState<Session | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (isLoaded && !userId) router.push("/sign-in");
  }, [isLoaded, userId, router]);

  // Fetch real sessions from API whenever filters change
  useEffect(() => {
    async function fetchSessions() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (region !== "All Regions") params.set("region", region);
        if (format === "Virtual") params.set("format", "VIRTUAL");
        if (format === "In-person") params.set("format", "IN_PERSON");
        const res = await fetch(`/api/sessions?${params.toString()}`);
        const json = await res.json();
        setSessions(json.data.sessions);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, [region, format]);

  if (!isLoaded || !userId) return null;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <NavBar />

      {/* Registration modal */}
      {selectedSession && !registeredSession && (
        <RegistrationModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onSuccess={() => {
            setRegisteredSession(selectedSession);
            setSelectedSession(null);
          }}
        />
      )}

      {/* Success modal */}
      {registeredSession && (
        <SuccessModal
          session={registeredSession}
          onClose={() => setRegisteredSession(null)}
        />
      )}

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2f5e]">Orientation Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">Register for upcoming orientation sessions required for Massachusetts child care providers. Browse available slots by region and format.</p>
        </div>

        {/* Filters */}
        <div className="border border-zinc-200 rounded-lg bg-white p-4 flex flex-wrap gap-4 items-end">
          {[
            { label: "Region", value: region, setter: setRegion, opts: REGIONS },
            { label: "Date Range", value: dateRange, setter: setDateRange, opts: DATE_RANGES },
            { label: "Format", value: format, setter: setFormat, opts: FORMATS },
          ].map(({ label, value, setter, opts }) => (
            <div key={label} className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-xs text-zinc-500 font-medium">{label}</label>
              <select value={value} onChange={(e) => setter(e.target.value)} className="border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a2f5e]">
                {opts.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <button className="bg-[#1a2f5e] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#152548] transition-colors">Apply Filters</button>
        </div>

        {/* Sessions Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-800">Available Orientations</h2>
            <span className="text-sm text-zinc-500">{loading ? "Loading..." : `Showing ${sessions.length} results`}</span>
          </div>
          {loading ? (
            <div className="text-sm text-zinc-400 py-12 text-center">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-sm text-zinc-400 py-12 text-center">No sessions found for the selected filters.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((s) => <SessionCard key={s.id} session={s} onRegister={setSelectedSession} />)}
            </div>
          )}
        </section>

        {/* My Registrations */}
        <section className="border border-zinc-200 rounded-lg bg-white p-6">
          <h2 className="font-semibold text-zinc-800 mb-4">My Registrations</h2>
          {REGISTRATIONS.map((r) => <RegistrationRow key={r.id} reg={r} />)}
        </section>

        {/* Attendance Note */}
        <div className="border border-amber-200 bg-amber-50 rounded-lg px-5 py-4">
          <p className="text-sm font-semibold text-amber-900">Important Attendance Note</p>
          <p className="text-sm text-amber-800 mt-0.5">Attendance is tracked for all virtual sessions. Please ensure you sign in with the same email used for registration to receive your certificate of completion.</p>
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