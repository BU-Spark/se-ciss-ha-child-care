import { SessionFormat, SessionStatus } from "@prisma/client";
import { z } from "zod";

import { ApiError } from "@/lib/api/errors";
import { isSupportedLanguage } from "@/lib/languages";

export const DEFAULT_SESSION_TITLE = "CCFA Orientation";

export const createSessionSchema = z
  .object({
    title: z.string().trim().min(1).max(200).default(DEFAULT_SESSION_TITLE),
    description: z.string().trim().max(2000).optional(),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
    language: z.string().min(2).max(10),
    format: z.enum([SessionFormat.VIRTUAL, SessionFormat.IN_PERSON]),
    capacity: z.number().int().min(1).max(500).default(25),
    meetingUrl: z.string().trim().optional(),
    locationName: z.string().trim().max(200).optional(),
    address: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);

    if (Number.isNaN(startsAt.getTime())) {
      ctx.addIssue({
        code: "custom",
        message: "startsAt must be a valid date/time",
        path: ["startsAt"],
      });
    }

    if (Number.isNaN(endsAt.getTime())) {
      ctx.addIssue({
        code: "custom",
        message: "endsAt must be a valid date/time",
        path: ["endsAt"],
      });
    }

    if (!Number.isNaN(startsAt.getTime()) && !Number.isNaN(endsAt.getTime())) {
      if (endsAt <= startsAt) {
        ctx.addIssue({
          code: "custom",
          message: "End time must be after start time",
          path: ["endsAt"],
        });
      }
    }

    if (!isSupportedLanguage(data.language)) {
      ctx.addIssue({
        code: "custom",
        message: "Unsupported session language",
        path: ["language"],
      });
    }

    if (data.format === SessionFormat.VIRTUAL && !data.meetingUrl?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Zoom link is required for virtual sessions",
        path: ["meetingUrl"],
      });
    } else if (
      data.format === SessionFormat.VIRTUAL &&
      data.meetingUrl &&
      !/^https?:\/\//i.test(data.meetingUrl.trim())
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Zoom link must start with http:// or https://",
        path: ["meetingUrl"],
      });
    }

    if (data.format === SessionFormat.IN_PERSON && !data.locationName?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Location name is required for in-person sessions",
        path: ["locationName"],
      });
    }
  });

export const cancelSessionSchema = z.object({
  status: z.literal(SessionStatus.CANCELLED),
});

export function parseSessionDateTime(value: string, fieldName: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw ApiError.badRequest(
      `${fieldName} must be a valid date/time`,
      "INVALID_DATETIME",
    );
  }

  return parsed;
}

export function assertFutureSessionStart(startsAt: Date) {
  if (startsAt <= new Date()) {
    throw ApiError.badRequest(
      "Session start must be in the future",
      "SESSION_START_IN_PAST",
    );
  }
}

export function serializeCcrrSession(
  session: {
    id: string;
    title: string;
    description: string | null;
    region: string;
    language: string;
    format: SessionFormat;
    status: SessionStatus;
    startsAt: Date;
    endsAt: Date;
    capacity: number | null;
    locationName: string | null;
    address: string | null;
    meetingUrl: string | null;
    agency: { id: string; name: string; region: string };
  },
  registeredCount: number,
) {
  const capacity = session.capacity ?? 0;

  return {
    id: session.id,
    title: session.title,
    description: session.description,
    region: session.region,
    language: session.language,
    format: session.format,
    status: session.status,
    startsAt: session.startsAt.toISOString(),
    endsAt: session.endsAt.toISOString(),
    capacity,
    registeredCount,
    spotsLeft: capacity > 0 ? Math.max(capacity - registeredCount, 0) : null,
    locationName: session.locationName,
    address: session.address,
    meetingUrl: session.meetingUrl,
    agency: session.agency,
  };
}
