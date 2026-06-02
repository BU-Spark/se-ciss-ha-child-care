import { SessionFormat } from "@prisma/client";

import { ApiError } from "@/lib/api/errors";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/db";

function parseFormat(format: string | null) {
  if (!format) {
    return undefined;
  }

  const normalized = format.trim().toUpperCase().replace("-", "_");

  if (normalized === SessionFormat.VIRTUAL) {
    return SessionFormat.VIRTUAL;
  }

  if (normalized === SessionFormat.IN_PERSON) {
    return SessionFormat.IN_PERSON;
  }

  throw ApiError.badRequest(
    "format must be either VIRTUAL or IN_PERSON",
    "INVALID_FORMAT",
  );
}

function getDateBounds(date: string | null) {
  if (!date) {
    return undefined;
  }

  const start = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(start.getTime())) {
    throw ApiError.badRequest(
      "date must be formatted as YYYY-MM-DD",
      "INVALID_DATE",
    );
  }

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region")?.trim();
    const format = parseFormat(searchParams.get("format"));
    const dateBounds = getDateBounds(searchParams.get("date"));
    const now = new Date();

    const sessions = await prisma.orientationSession.findMany({
      where: {
        status: "PUBLISHED",
        startsAt: dateBounds
          ? {
              gte: dateBounds.start > now ? dateBounds.start : now,
              lt: dateBounds.end,
            }
          : { gte: now },
        ...(region ? { region: { equals: region, mode: "insensitive" } } : {}),
        ...(format ? { format } : {}),
      },
      orderBy: { startsAt: "asc" },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            region: true,
          },
        },
        _count: {
          select: {
            registrations: {
              where: {
                status: "REGISTERED",
              },
            },
          },
        },
      },
    });

    return jsonSuccess({
      sessions: sessions.map((session) => {
        const registeredCount = session._count.registrations;
        const capacity = session.capacity ?? 0;

        return {
          id: session.id,
          title: session.title,
          description: session.description,
          region: session.region,
          format: session.format,
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
      }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
