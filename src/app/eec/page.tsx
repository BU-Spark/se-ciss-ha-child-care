"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";

type Registration = { id: string; providerName: string; agency: string; region: string; sessionDate: string; format: string; status: "Attended" | "Registered" | "No-show"; };

const REGISTRATIONS: Registration[] = [
  { id: "1", providerName: "Sarah Jenkins", agency: "Child Care Choices", region: "Metro Boston", sessionDate: "Oct 24, 2024", format: "Virtual", status: "Attended" },
  { id: "2", providerName: "Bright Horizons #42", agency: "Seven Hills", region: "Central", sessionDate: "Oct 26, 2024", format: "In-person", status: "Registered" },
  { id: "3", providerName: "Maria Rodriguez", agency: "Child Care Circuit", region: "Northeast", sessionDate: "Oct 22, 2024", format: "Virtual", status: "No-show" },
  { id: "4", providerName: "Little Explorers Daycare", agency: "Pace CC", region: "Southeast", sessionDate: "Oct 28, 2024", format: "In-person", status: "Registered" },
  { id: "5", providerName: "David Thompson", agency: "Valley Opp Inc", region: "Western", sessionDate: "Oct 21, 2024", format: "Virtual", status: "Attended" },
];
const REGIONAL_RATES = [{ region: "Metro Boston", rate: 94 }, { region: "Central", rate: 89 }, { region: "Northeast", rate: 91 }, { region: "Western", rate: 85 }, { region: "Southeast", rate: 88 }];
const NAV_ITEMS = ["Overview", "Registration Data", "Regional Analytics", "Agency Compliance", "Audit Logs"];
const AGENCIES = ["All Agencies", "Child Care Choices", "Seven Hills", "Child Care Circuit", "Pace CC", "Valley Opp Inc"];
const REGIONS = ["All Regions", "Metro Boston", "Central", "Northeast", "Western", "Southeast"];
const DATE_RANGES = ["Last 30 Days", "Last 7 Days", "Last 90 Days", "All Time"];
const PROVIDER_TYPES = ["All Types", "Center-based", "Family-based", "School-age"];

function StatusBadge({ status }: { status: Registration["status"] }) {
  const styles = { Attended: "bg-green-50 text-green-700", Registered: "bg-blue-50 text-blue-700", "No-show": "bg-red-50 text-red-600" };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}>{status}</span>;
}

export default function EecPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("Overview");
  const [agency, setAgency] = useState("All Agencies");
  const [region, setRegion] = useState("All Regions");
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [providerType, setProviderType] = useState("All Types");

  useEffect(() => {
    if (isLoaded && !userId) router.push("/sign-in");
  }, [isLoaded, userId, router]);

  if (!isLoaded || !userId) return null;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="border-b border-[#e2e6ed] bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-[#1a2f5e] flex items-center justify-center text-white text-xs font-bold">M</div>
            <div>
              <p className="text-sm font-semibold text-[#1a2f5e] leading-tight">EEC Admin</p>
              <p className="text-xs text-zinc-400 leading-tight">Statewide Access</p>
            </div>
          </div>
          <div className="flex-1 max-w-xs mx-8">
            <input type="text" placeholder="Search providers or agencies..." className="w-full pl-3 pr-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a2f5e]" />
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-zinc-800">Admin Name</p>
              <p className="text-xs text-zinc-400">State Administrator</p>
            </div>
            <UserButton/>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="w-52 bg-white border-r border-zinc-200 flex flex-col py-4 flex-shrink-0">
          <nav className="flex flex-col gap-0.5 px-2 flex-1">
            {NAV_ITEMS.map((item) => (
              <button key={item} onClick={() => setActiveNav(item)} className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${activeNav === item ? "bg-[#1a2f5e] text-white" : "text-zinc-600 hover:bg-zinc-50"}`}>{item}</button>
            ))}
          </nav>
          <div className="px-2 flex flex-col gap-1 mt-4 border-t border-zinc-100 pt-4">
            <button className="w-full bg-[#1a2f5e] text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-[#152548] transition-colors">Generate Report</button>
          </div>
        </aside>
        <main className="flex-1 px-6 py-6 flex flex-col gap-6 overflow-auto">
          <h1 className="text-xl font-bold text-[#1a2f5e]">EEC Orientation – Administrator</h1>
          <div className="grid grid-cols-4 gap-4">
            {[{ label: "TOTAL REGISTRATIONS", value: "4,280", sub: "↗12%" }, { label: "TOTAL COMPLETIONS", value: "3,912", sub: "91.4% Rate" }, { label: "ACTIVE SESSIONS", value: "18", sub: "Across 6 Regions" }, { label: "CCR&R AGENCIES", value: "6", sub: "Active Network" }].map((stat) => (
              <div key={stat.label} className="bg-white border border-zinc-200 rounded-lg p-4">
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">{stat.label}</p>
                <p className="text-2xl font-bold text-zinc-800 mt-1">{stat.value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 flex flex-col gap-4">
              <div className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-wrap gap-3">
                {[{ label: "Agency", value: agency, setter: setAgency, options: AGENCIES }, { label: "Region", value: region, setter: setRegion, options: REGIONS }, { label: "Date Range", value: dateRange, setter: setDateRange, options: DATE_RANGES }, { label: "Provider Type", value: providerType, setter: setProviderType, options: PROVIDER_TYPES }].map(({ label, value, setter, options }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <label className="text-xs text-zinc-400">{label}</label>
                    <select value={value} onChange={(e) => setter(e.target.value)} className="border border-zinc-200 rounded-md px-2 py-1.5 text-xs text-zinc-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#1a2f5e] min-w-[130px]">
                      {options.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                  <p className="text-sm font-semibold text-zinc-800">Recent Provider Registrations</p>
                  <button className="text-xs font-medium text-zinc-600 border border-zinc-200 px-3 py-1.5 rounded-md hover:bg-zinc-50">↓ Export CSV</button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      {["Provider Name", "Agency", "Region", "Session Date", "Format", "Status"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {REGISTRATIONS.map((r) => (
                      <tr key={r.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-zinc-800">{r.providerName}</td>
                        <td className="px-4 py-3 text-zinc-600">{r.agency}</td>
                        <td className="px-4 py-3 text-zinc-600">{r.region}</td>
                        <td className="px-4 py-3 text-zinc-600">{r.sessionDate}</td>
                        <td className="px-4 py-3 text-zinc-600">{r.format}</td>
                        <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100">
                  <p className="text-xs text-zinc-400">Showing 5 of 4,280 providers</p>
                  <div className="flex gap-1">
                    <button className="w-6 h-6 border border-zinc-200 rounded text-zinc-400 hover:bg-zinc-50">‹</button>
                    <button className="w-6 h-6 border border-zinc-200 rounded text-zinc-400 hover:bg-zinc-50">›</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-white border border-zinc-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-zinc-800 mb-3">Registrations Over Time</p>
                <div className="flex items-end gap-1 h-16">
                  {[60, 75, 55, 80, 70, 85, 90, 95].map((h, i, arr) => (
                    <div key={i} className={`flex-1 rounded-sm ${i === arr.length - 1 ? "bg-[#1a2f5e]" : "bg-blue-100"}`} style={{ height: `${(h / 95) * 100}%` }} />
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-zinc-400">
                  <span>SEP 01</span><span>SEP 15</span><span>OCT 01</span><span>OCT 15</span>
                </div>
              </div>
              <div className="bg-white border border-zinc-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-zinc-800 mb-3">Regional Completion Rate</p>
                <div className="flex flex-col gap-2.5">
                  {REGIONAL_RATES.map((r) => (
                    <div key={r.region} className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-600">{r.region}</span>
                        <span className="font-medium text-zinc-700">{r.rate}%</span>
                      </div>
                      <div className="h-1.5 bg-zinc-100 rounded-full">
                        <div className="h-full bg-[#1a2f5e] rounded-full" style={{ width: `${r.rate}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <button className="text-xs text-[#1a2f5e] font-medium mt-3 hover:underline">View Detailed Breakdown →</button>
              </div>
              <div className="bg-[#1a2f5e] rounded-lg p-4 text-white">
                <p className="text-sm font-semibold mb-1">Upcoming System Maintenance</p>
                <p className="text-xs text-blue-100 leading-relaxed">The EEC Monitoring Portal will be undergoing scheduled maintenance on Sunday, Oct 31, between 2:00 AM and 6:00 AM EST.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
      <footer className="border-t border-zinc-200 bg-white py-3 px-6">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>© 2024 Massachusetts Department of Early Education and Care</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-zinc-600">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-600">Terms of Service</a>
            <a href="#" className="hover:text-zinc-600">Accessibility Statement</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
