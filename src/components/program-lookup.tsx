"use client";

import { useEffect, useRef, useState } from "react";

export type ProviderProgram = {
  stateProviderId: string;
  programName: string;
  providerType: string;
  address: string;
  city: string;
  region: string;
};

export function ProgramLookup({
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
    if (trimmed.length < 2) return;

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
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
      <label className="text-xs font-medium text-zinc-600">Program Lookup</label>
      <input
        value={query}
        onChange={(event) => handleQueryChange(event.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search by program name, provider ID, or city"
        className="border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1a2f5e]"
      />
      {loading && <p className="text-xs text-zinc-400">Searching programs...</p>}
      {open && results.length > 0 && (
        <ul className="absolute top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-zinc-200 bg-white shadow-lg">
          {results.map((program) => (
            <li key={program.stateProviderId}>
              <button
                type="button"
                onClick={() => handleSelect(program)}
                className="w-full px-3 py-2 text-left hover:bg-zinc-50"
              >
                <p className="text-sm font-medium text-zinc-800">{program.programName}</p>
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
