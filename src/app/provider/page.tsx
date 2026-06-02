"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";

type Session = {
  id: string; region: string; title: string; date: string; time: string;
  agency: string; format: "Virtual" | "In-person"; formatDetail: string;
  spotsLeft: number; urgent?: boolean;
};
type Registration = {
  id: string; title: string; dateLabel: string; time: string;
  format: string; agency: string; status: "Confirmed" | "Pending";
};

const SESSIONS: Session[] = [
  { id: "1", region: "Northeast", title: "EEC Mandatory Orientation", date: "Nov 14, 2024", time: "6:00 PM–8:00 PM", agency: "Child Care Circuit", format: "Virtual", formatDetail: "Virtual – via Zoom", spotsLeft: 12 },
  { id: "2", region: "Metro", title: "Licensing Regulation Review", date: "Nov 16, 2024", time: "9:00 AM–11:30 AM", agency: "Seven Hills Family Services", format: "In-person", formatDetail: "In-person (Worcester, MA)", spotsLeft: 5 },
  { id: "3", region: "Boston", title: "Health & Safety Essentials", date: "Nov 18, 2024", time: "1:00 PM–3:00 PM", agency: "EEC Boston Office", format: "Virtual", formatDetail: "Virtual – via Microsoft Teams", spotsLeft: 2, urgent: true },
];
const REGISTRATIONS: Registration[] = [
  { id: "1", title: "EEC Mandatory Orientation – Nov 20", dateLabel: "NOV 20", time: "6:30 PM", format: "Virtual", agency: "Child Care Circuit", status: "Confirmed" },
  { id: "2", title: "Business Practice Workshop", dateLabel: "DEC 05", time: "10:00 AM", format: "In-person (Springfield)", agency: "Seven Hills", status: "Pending" },
];
const REGIONS = ["All Regions", "Northeast", "Metro", "Boston", "Central", "Western", "Southeast"];
const DATE_RANGES = ["Next 30 days", "Next 7 days", "Next 90 days", "All upcoming"];
const FORMATS = ["All Formats", "Virtual", "In-person"];

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
          <span className="text-sm text-zinc-600">Welcome, Sarah Miller</span>
          <UserButton  />
        </div>
      </div>
    </header>
  );
}

function SessionCard({ session }: { session: Session }) {
  return (
    <div className="border border-zinc-200 rounded-lg bg-white p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">{session.region}</span>
        {session.urgent ? (
          <span className="text-xs font-semibold text-orange-600">⚠ ONLY {session.spotsLeft} SPOTS LEFT</span>
        ) : (
          <span className="text-xs text-zinc-500">{session.spotsLeft} spots left</span>
        )}
      </div>
      <h3 className="font-semibold text-[#1a2f5e]">{session.title}</h3>
      <div className="flex flex-col gap-1 text-sm text-zinc-600">
        <span>📅 {session.date}</span>
        <span>🕐 {session.time}</span>
        <span>🏢 {session.agency}</span>
        <span>💻 {session.formatDetail}</span>
      </div>
      <button className="w-full bg-[#1a2f5e] text-white py-2 rounded-md text-sm font-medium hover:bg-[#152548] transition-colors mt-1">Register</button>
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

export default function ProviderPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [region, setRegion] = useState("All Regions");
  const [dateRange, setDateRange] = useState("Next 30 days");
  const [format, setFormat] = useState("All Formats");

  useEffect(() => {
    if (isLoaded && !userId) router.push("/sign-in");
  }, [isLoaded, userId, router]);

  if (!isLoaded || !userId) return null;

  const filtered = SESSIONS.filter((s) => {
    if (region !== "All Regions" && s.region !== region) return false;
    if (format !== "All Formats" && s.format !== format) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <NavBar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2f5e]">Orientation Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">Register for upcoming orientation sessions required for Massachusetts child care providers. Browse available slots by region and format.</p>
        </div>
        <div className="border border-zinc-200 rounded-lg bg-white p-4 flex flex-wrap gap-4 items-end">
          {[{ label: "Region", value: region, setter: setRegion, opts: REGIONS }, { label: "Date Range", value: dateRange, setter: setDateRange, opts: DATE_RANGES }, { label: "Format", value: format, setter: setFormat, opts: FORMATS }].map(({ label, value, setter, opts }) => (
            <div key={label} className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-xs text-zinc-500 font-medium">{label}</label>
              <select value={value} onChange={(e) => setter(e.target.value)} className="border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a2f5e]">
                {opts.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <button className="bg-[#1a2f5e] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#152548] transition-colors">Apply Filters</button>
        </div>
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-800">Available Orientations</h2>
            <span className="text-sm text-zinc-500">Showing {filtered.length} results</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => <SessionCard key={s.id} session={s} />)}
          </div>
        </section>
        <section className="border border-zinc-200 rounded-lg bg-white p-6">
          <h2 className="font-semibold text-zinc-800 mb-4">My Registrations</h2>
          {REGISTRATIONS.map((r) => <RegistrationRow key={r.id} reg={r} />)}
        </section>
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
