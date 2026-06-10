"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import { PersonaNav } from "@/components/persona-nav";
import { getLanguageLabel, SUPPORTED_LANGUAGES } from "@/lib/languages";

// ─── Types ────────────────────────────────────────────────────────────────────

type Session = {
  id: string;
  region: string;
  language: string;
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

type AgencyOption = {
  id: string;
  name: string;
  region: string;
};

type ProviderProgram = {
  stateProviderId: string;
  programName: string;
  providerType: string;
  address: string;
  city: string;
  region: string;
};

type ProviderRegistration = {
  id: string;
  status: string;
  session: {
    id: string;
    title: string;
    format: "VIRTUAL" | "IN_PERSON";
    startsAt: string;
    endsAt: string;
    locationName: string | null;
    agency: { id: string; name: string; region: string };
  };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DATE_RANGES = ["Next 30 days", "Next 7 days", "Next 90 days", "All upcoming"];
const FORMATS = ["All Formats", "Virtual", "In-person"];
const PROVIDER_TYPES = [
  { value: "UNKNOWN", label: "Select type..." },
  { value: "CENTER_BASED", label: "Center-based" },
  { value: "FAMILY_CHILD_CARE", label: "Family Child Care" },
  { value: "SCHOOL_AGE", label: "School-age" },
  { value: "OTHER", label: "Other" },
];

function formatDateLabel(iso: string) {
  const date = new Date(iso);
  return {
    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: date.getDate().toString(),
  };
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

function formatSessionFormat(
  format: "VIRTUAL" | "IN_PERSON",
  locationName: string | null,
) {
  if (format === "VIRTUAL") {
    return "Virtual";
  }

  return locationName ? `In-person (${locationName})` : "In-person";
}

function registrationStatusLabel(status: string): "Confirmed" | "Pending" {
  if (status === "WAITLISTED") {
    return "Pending";
  }

  return "Confirmed";
}

function getDateRangeParams(dateRange: string) {
  if (dateRange === "All upcoming") {
    return {};
  }

  const today = new Date();
  const format = (date: Date) => date.toISOString().slice(0, 10);
  const days =
    dateRange === "Next 7 days" ? 7 : dateRange === "Next 30 days" ? 30 : 90;
  const end = new Date(today);
  end.setUTCDate(end.getUTCDate() + days + 1);

  return {
    from: format(today),
    to: format(end),
  };
}

// ─── Program Lookup ───────────────────────────────────────────────────────────

function ProgramLookup({
  onSelect,
}: {
  onSelect: (program: ProviderProgram) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProviderProgram[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
    }
  }

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/provider/programs?query=${encodeURIComponent(trimmed)}`,
        );
        const json = await res.json();

        if (json.success) {
          setResults(json.data.programs);
          setOpen(json.data.programs.length > 0);
        }
      } catch {
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(program: ProviderProgram) {
    onSelect(program);
    setQuery(program.programName);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-600">
        Program Lookup
      </label>
      <input
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        onFocus={() => {
          if (results.length > 0) {
            setOpen(true);
          }
        }}
        placeholder="Search by program name, provider ID, or city"
        className="border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1a2f5e]"
      />
      {loading && (
        <p className="text-xs text-zinc-400">Searching programs...</p>
      )}
      {open && results.length > 0 && (
        <ul className="absolute top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-zinc-200 bg-white shadow-lg">
          {results.map((program) => (
            <li key={program.stateProviderId}>
              <button
                type="button"
                onClick={() => handleSelect(program)}
                className="w-full px-3 py-2 text-left hover:bg-zinc-50"
              >
                <p className="text-sm font-medium text-zinc-800">
                  {program.programName}
                </p>
                <p className="text-xs text-zinc-500">
                  {program.stateProviderId} · {program.city}, {program.region}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
    stateProviderId: "",
    preferredLanguage: "en",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/me");
        const json = await res.json();

        if (json.success && json.data.profile.source === "APP_USER") {
          const profile = json.data.profile;
          setForm((prev) => ({
            ...prev,
            providerName: profile.providerName ?? profile.name ?? prev.providerName,
            organizationName: profile.organizationName ?? prev.organizationName,
            contactEmail: profile.email ?? prev.contactEmail,
            phone: profile.phone ?? prev.phone,
            providerType: profile.providerType ?? prev.providerType,
            preferredLanguage: profile.preferredLanguage ?? prev.preferredLanguage,
          }));
        }
      } catch {
        // Profile prefill is best-effort.
      }
    }

    loadProfile();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleProgramSelect(program: ProviderProgram) {
    setForm((prev) => ({
      ...prev,
      organizationName: program.programName,
      providerType: program.providerType,
      stateProviderId: program.stateProviderId,
    }));
  }

  async function handleSubmit() {
    if (!form.providerName.trim() || !form.organizationName.trim() || !form.contactEmail.trim()) {
      setError("Provider name, organization name, and contact email are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        sessionId: session.id,
        providerName: form.providerName.trim(),
        organizationName: form.organizationName.trim(),
        contactEmail: form.contactEmail.trim(),
        phone: form.phone.trim() || undefined,
        providerType: form.providerType,
        preferredLanguage: form.preferredLanguage,
        ...(form.stateProviderId.trim()
          ? { stateProviderId: form.stateProviderId.trim() }
          : {}),
      };

      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
              <ProgramLookup onSelect={handleProgramSelect} />
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
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-600">Provider Type</label>
                  <select name="providerType" value={form.providerType} onChange={handleChange} className="border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1a2f5e]">
                    {PROVIDER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-600">Preferred Language</label>
                  <select name="preferredLanguage" value={form.preferredLanguage} onChange={handleChange} className="border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#1a2f5e]">
                    {SUPPORTED_LANGUAGES.map((language) => (
                      <option key={language.code} value={language.code}>{language.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Auto confirmation notice */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex gap-2">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
              <p className="text-xs text-blue-700">Upon clicking Complete Registration, a confirmation email will be sent to the provided contact address containing the full session agenda and secure Zoom meeting link.</p>
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
        <span> {new Date(session.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        <span> {new Date(session.startsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} – {new Date(session.endsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
        <span>{session.agency.name}</span>
        <span>{getLanguageLabel(session.language)}</span>
        <span>{formatDetail}</span>
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

function RegistrationRow({ registration }: { registration: ProviderRegistration }) {
  const { month, day } = formatDateLabel(registration.session.startsAt);
  const status = registrationStatusLabel(registration.status);
  const formatLabel = formatSessionFormat(
    registration.session.format,
    registration.session.locationName,
  );

  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0">
      <div className="flex items-center gap-4">
        <div className="bg-[#1a2f5e] text-white rounded text-center px-2 py-1 min-w-[44px]">
          <div className="text-[10px] font-medium uppercase">{month}</div>
          <div className="text-base font-bold leading-tight">{day}</div>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-800">{registration.session.title}</p>
          <p className="text-xs text-zinc-500">
            {formatSessionTime(registration.session.startsAt, registration.session.endsAt)} · {formatLabel} · {registration.session.agency.name}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status === "Confirmed" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>{status}</span>
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
  const [regions, setRegions] = useState<string[]>([]);
  const [agency, setAgency] = useState("All Agencies");
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);
  const [language, setLanguage] = useState("All Languages");
  const [sessionLanguages, setSessionLanguages] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState("Next 30 days");
  const [format, setFormat] = useState("All Formats");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [registrations, setRegistrations] = useState<ProviderRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrationsLoading, setRegistrationsLoading] = useState(true);
  const [registrationsError, setRegistrationsError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [registeredSession, setRegisteredSession] = useState<Session | null>(null);
  const [registrationsKey, setRegistrationsKey] = useState(0);
  const [profileSource, setProfileSource] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (isLoaded && !userId) router.push("/sign-in");
  }, [isLoaded, userId, router]);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/me");
        const json = await res.json();
        if (json.success) {
          setProfileSource(json.data.profile.source);
        }
      } catch {
        // Profile lookup is best-effort.
      }
    }

    if (isLoaded && userId) {
      fetchProfile();
    }
  }, [isLoaded, userId]);

  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        const res = await fetch("/api/sessions/filter-options");
        const json = await res.json();

        if (json.success) {
          setRegions(json.data.regions);
          setAgencies(json.data.agencies);
          setSessionLanguages(
            json.data.languages.map((entry: { code: string }) => entry.code),
          );
        }
      } catch (e) {
        console.error(e);
      }
    }

    fetchFilterOptions();
  }, []);

  useEffect(() => {
    async function fetchRegistrations() {
      setRegistrationsLoading(true);
      setRegistrationsError(null);
      try {
        const res = await fetch("/api/provider/registrations");
        const json = await res.json();

        if (json.success) {
          setRegistrations(json.data.registrations);
        } else {
          setRegistrations([]);
          setRegistrationsError(
            res.status === 403
              ? "Staff accounts cannot view provider registrations. Use a provider account, or open the CCR&R dashboard."
              : json.error?.message ?? "Unable to load your registrations.",
          );
        }
      } catch (e) {
        console.error(e);
        setRegistrationsError("Network error. Please try again.");
      } finally {
        setRegistrationsLoading(false);
      }
    }

    if (isLoaded && userId) {
      fetchRegistrations();
    }
  }, [isLoaded, userId, registrationsKey]);

  // Fetch real sessions from API whenever filters change
  useEffect(() => {
    async function fetchSessions() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (region !== "All Regions") params.set("region", region);
        if (agency !== "All Agencies") params.set("agency", agency);
        if (language !== "All Languages") params.set("language", language);
        if (format === "Virtual") params.set("format", "VIRTUAL");
        if (format === "In-person") params.set("format", "IN_PERSON");

        const range = getDateRangeParams(dateRange);
        if (range.from) params.set("from", range.from);
        if (range.to) params.set("to", range.to);

        const res = await fetch(`/api/sessions?${params.toString()}`);
        const json = await res.json();

        if (json.success) {
          setSessions(json.data.sessions);
        } else {
          setSessions([]);
        }
      } catch (e) {
        console.error(e);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, [region, agency, language, format, dateRange]);

  if (!isLoaded || !userId) return null;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <PersonaNav basePath="/provider" />

      {/* Registration modal */}
      {selectedSession && !registeredSession && (
        <RegistrationModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onSuccess={() => {
            setRegisteredSession(selectedSession);
            setSelectedSession(null);
            setRegistrationsKey((current) => current + 1);
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
          <p className="mt-1 text-sm text-zinc-500">Register for upcoming orientation sessions required for Massachusetts child care providers. Browse available slots by agency, region, language, and format.</p>
          {profileSource === "STAFF_USER" && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              You are signed in as staff. Provider registration is not available on this account.{" "}
              <button
                type="button"
                onClick={() => router.push("/ccrr")}
                className="font-medium underline hover:text-amber-950"
              >
                Go to the CCR&R staff dashboard
              </button>
              .
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="border border-zinc-200 rounded-lg bg-white p-4 flex flex-wrap gap-4 items-end">
          {[
            { label: "CCR&R Agency", value: agency, setter: setAgency, opts: ["All Agencies", ...agencies.map((entry) => entry.name)] },
            { label: "Region", value: region, setter: setRegion, opts: ["All Regions", ...regions] },
            { label: "Session Language", value: language, setter: setLanguage, opts: ["All Languages", ...sessionLanguages], formatOption: (option: string) => option === "All Languages" ? option : getLanguageLabel(option) },
            { label: "Date Range", value: dateRange, setter: setDateRange, opts: DATE_RANGES },
            { label: "Format", value: format, setter: setFormat, opts: FORMATS },
          ].map(({ label, value, setter, opts, formatOption }) => (
            <div key={label} className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-xs text-zinc-500 font-medium">{label}</label>
              <select value={value} onChange={(e) => setter(e.target.value)} className="border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a2f5e]">
                {opts.map((o) => (
                  <option key={o} value={o}>{formatOption ? formatOption(o) : o}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Sessions Grid */}
        <section id="sessions">
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
          {registrationsLoading ? (
            <p className="text-sm text-zinc-400 py-4 text-center">Loading registrations...</p>
          ) : registrationsError ? (
            <p className="text-sm text-red-600 py-4 text-center">{registrationsError}</p>
          ) : registrations.length === 0 ? (
            <p className="text-sm text-zinc-400 py-4 text-center">You have not registered for any sessions yet.</p>
          ) : (
            registrations.map((registration) => (
              <RegistrationRow key={registration.id} registration={registration} />
            ))
          )}
        </section>

        {/* Attendance Note */}
        <div id="resources" className="border border-amber-200 bg-amber-50 rounded-lg px-5 py-4">
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