"use client";

import { useState } from "react";

import { DEFAULT_SESSION_TITLE } from "@/lib/ccrr-sessions";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";

type CreateSessionModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

function defaultStartDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

export function CreateSessionModal({
  onClose,
  onSuccess,
}: CreateSessionModalProps) {
  const [form, setForm] = useState({
    title: DEFAULT_SESSION_TITLE,
    description: "",
    date: defaultStartDate(),
    startTime: "10:00",
    endTime: "12:00",
    language: "en",
    format: "VIRTUAL" as "VIRTUAL" | "IN_PERSON",
    capacity: "25",
    meetingUrl: "",
    locationName: "",
    address: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const startsAt = new Date(`${form.date}T${form.startTime}`);
    const endsAt = new Date(`${form.date}T${form.endTime}`);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      setError("Enter a valid date and time.");
      setSubmitting(false);
      return;
    }

    const capacity = Number.parseInt(form.capacity, 10);
    if (!Number.isFinite(capacity) || capacity < 1) {
      setError("Capacity must be at least 1.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/ccrr/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          language: form.language,
          format: form.format,
          capacity,
          meetingUrl:
            form.format === "VIRTUAL" ? form.meetingUrl.trim() : undefined,
          locationName:
            form.format === "IN_PERSON" ? form.locationName.trim() : undefined,
          address:
            form.format === "IN_PERSON" ? form.address.trim() : undefined,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message ?? "Unable to create session.");
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between p-6 border-b border-zinc-100">
          <div>
            <p className="text-xs text-zinc-400 mb-1">Sessions</p>
            <h2 className="text-xl font-bold text-[#1a2f5e]">Add orientation session</h2>
            <p className="text-sm text-zinc-500 mt-1">
              Published sessions appear on the provider portal immediately.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 ml-4"
          >
            ✕
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-600">Session title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="border border-zinc-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-600">Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="border border-zinc-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-600">Start time</label>
              <input
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                className="border border-zinc-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-600">End time</label>
              <input
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                className="border border-zinc-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-600">Language</label>
              <select
                name="language"
                value={form.language}
                onChange={handleChange}
                className="border border-zinc-300 rounded-md px-3 py-2 text-sm"
              >
                {SUPPORTED_LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-600">Format</label>
              <select
                name="format"
                value={form.format}
                onChange={handleChange}
                className="border border-zinc-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="VIRTUAL">Virtual</option>
                <option value="IN_PERSON">In-person</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-600">Capacity</label>
              <input
                name="capacity"
                type="number"
                min={1}
                max={500}
                value={form.capacity}
                onChange={handleChange}
                className="border border-zinc-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          {form.format === "VIRTUAL" ? (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-600">Zoom link</label>
              <input
                name="meetingUrl"
                value={form.meetingUrl}
                onChange={handleChange}
                placeholder="https://zoom.us/j/..."
                className="border border-zinc-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-600">Location name</label>
                <input
                  name="locationName"
                  value={form.locationName}
                  onChange={handleChange}
                  placeholder="Community center"
                  className="border border-zinc-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-600">Address</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="City, MA"
                  className="border border-zinc-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-600">
              Description (optional)
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              className="border border-zinc-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[#1a2f5e] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#152548] disabled:opacity-50"
          >
            {submitting ? "Publishing..." : "Publish session"}
          </button>
        </div>
      </div>
    </div>
  );
}
