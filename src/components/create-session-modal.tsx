"use client";

import { useId, useState } from "react";

import { ModalShell } from "@/components/modal-shell";
import { DEFAULT_SESSION_TITLE } from "@/lib/ccrr-sessions";
import {
  addDaysToDateString,
  appTodayDateString,
  etWallTimeToIso,
} from "@/lib/datetime";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";

type CreateSessionModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

function defaultStartDate() {
  return addDaysToDateString(appTodayDateString(), 7);
}

export function CreateSessionModal({
  onClose,
  onSuccess,
}: CreateSessionModalProps) {
  const formId = useId();
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

    if (!form.title.trim()) {
      setError("Session title is required.");
      setSubmitting(false);
      return;
    }

    const startsAtIso = etWallTimeToIso(form.date, form.startTime);
    const endsAtIso = etWallTimeToIso(form.date, form.endTime);

    if (!startsAtIso || !endsAtIso) {
      setError("Enter a valid date and time.");
      setSubmitting(false);
      return;
    }

    if (new Date(endsAtIso).getTime() <= new Date(startsAtIso).getTime()) {
      setError("End time must be after start time.");
      setSubmitting(false);
      return;
    }

    const capacity = Number.parseInt(form.capacity, 10);
    if (!Number.isFinite(capacity) || capacity < 1) {
      setError("Capacity must be at least 1.");
      setSubmitting(false);
      return;
    }

    if (form.format === "VIRTUAL" && !form.meetingUrl.trim()) {
      setError("Zoom link is required for virtual sessions.");
      setSubmitting(false);
      return;
    }

    if (
      form.format === "IN_PERSON" &&
      (!form.locationName.trim() || !form.address.trim())
    ) {
      setError("Location name and address are required for in-person sessions.");
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
          startsAt: startsAtIso,
          endsAt: endsAtIso,
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

  const fieldClass =
    "border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#1a2f5e]";

  return (
    <ModalShell
      title="Add orientation session"
      description="Times are in Eastern Time. Published sessions appear on the provider portal immediately."
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-800"
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
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`${formId}-title`}
            className="text-xs font-medium text-zinc-600"
          >
            Session title
          </label>
          <input
            id={`${formId}-title`}
            name="title"
            value={form.title}
            onChange={handleChange}
            className={fieldClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${formId}-date`}
              className="text-xs font-medium text-zinc-600"
            >
              Date (ET)
            </label>
            <input
              id={`${formId}-date`}
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${formId}-start`}
              className="text-xs font-medium text-zinc-600"
            >
              Start time (ET)
            </label>
            <input
              id={`${formId}-start`}
              type="time"
              name="startTime"
              value={form.startTime}
              onChange={handleChange}
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${formId}-end`}
              className="text-xs font-medium text-zinc-600"
            >
              End time (ET)
            </label>
            <input
              id={`${formId}-end`}
              type="time"
              name="endTime"
              value={form.endTime}
              onChange={handleChange}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${formId}-language`}
              className="text-xs font-medium text-zinc-600"
            >
              Language
            </label>
            <select
              id={`${formId}-language`}
              name="language"
              value={form.language}
              onChange={handleChange}
              className={fieldClass}
            >
              {SUPPORTED_LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${formId}-format`}
              className="text-xs font-medium text-zinc-600"
            >
              Format
            </label>
            <select
              id={`${formId}-format`}
              name="format"
              value={form.format}
              onChange={handleChange}
              className={fieldClass}
            >
              <option value="VIRTUAL">Virtual</option>
              <option value="IN_PERSON">In-person</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${formId}-capacity`}
              className="text-xs font-medium text-zinc-600"
            >
              Capacity
            </label>
            <input
              id={`${formId}-capacity`}
              name="capacity"
              type="number"
              min={1}
              max={500}
              value={form.capacity}
              onChange={handleChange}
              className={fieldClass}
            />
          </div>
        </div>

        {form.format === "VIRTUAL" ? (
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${formId}-meeting`}
              className="text-xs font-medium text-zinc-600"
            >
              Zoom link
            </label>
            <input
              id={`${formId}-meeting`}
              name="meetingUrl"
              value={form.meetingUrl}
              onChange={handleChange}
              placeholder="https://zoom.us/j/..."
              className={fieldClass}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`${formId}-location`}
                className="text-xs font-medium text-zinc-600"
              >
                Location name
              </label>
              <input
                id={`${formId}-location`}
                name="locationName"
                value={form.locationName}
                onChange={handleChange}
                placeholder="Community center"
                className={fieldClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`${formId}-address`}
                className="text-xs font-medium text-zinc-600"
              >
                Address
              </label>
              <input
                id={`${formId}-address`}
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="City, MA"
                className={fieldClass}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label
            htmlFor={`${formId}-description`}
            className="text-xs font-medium text-zinc-600"
          >
            Description (optional)
          </label>
          <textarea
            id={`${formId}-description`}
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={2}
            className={fieldClass}
          />
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    </ModalShell>
  );
}
