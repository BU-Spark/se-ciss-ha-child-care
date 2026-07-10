import { SessionStatus } from "@prisma/client";

import { ApiError } from "@/lib/api/errors";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import {
  assertFutureSessionStart,
  createSessionSchema,
  parseSessionDateTime,
  serializeCcrrSession,
} from "@/lib/ccrr-sessions";
import { requireCcrrAgencyId, requireRole } from "@/lib/auth/current-profile";
import { prisma } from "@/lib/db";
import { activeRegistrationStatusFilter } from "@/lib/registration-status";

export async function GET() {
  try {
    const profile = await requireRole(["CCRR_STAFF", "EEC_ADMIN"]);

    const sessions = await prisma.orientationSession.findMany({
      where:
        profile.role === "EEC_ADMIN"
          ? { status: SessionStatus.PUBLISHED }
          : {
              status: SessionStatus.PUBLISHED,
              agencyId: requireCcrrAgencyId(profile),
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
              where: activeRegistrationStatusFilter,
            },
          },
        },
      },
    });

    return jsonSuccess({
      sessions: sessions.map((session) =>
        serializeCcrrSession(session, session._count.registrations),
      ),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const profile = await requireRole(["CCRR_STAFF"]);
    const agencyId = requireCcrrAgencyId(profile);

    const body = createSessionSchema.safeParse(await request.json());

    if (!body.success) {
      throw ApiError.badRequest(
        body.error.issues[0]?.message ?? "Invalid session request",
        "INVALID_BODY",
      );
    }

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { id: true, name: true, region: true, isActive: true },
    });

    if (!agency || !agency.isActive) {
      throw ApiError.notFound("Agency not found");
    }

    const startsAt = parseSessionDateTime(body.data.startsAt, "startsAt");
    const endsAt = parseSessionDateTime(body.data.endsAt, "endsAt");
    assertFutureSessionStart(startsAt);

    const session = await prisma.orientationSession.create({
      data: {
        agencyId: agency.id,
        title: body.data.title,
        description: body.data.description,
        region: agency.region,
        language: body.data.language,
        format: body.data.format,
        status: SessionStatus.PUBLISHED,
        startsAt,
        endsAt,
        capacity: body.data.capacity,
        meetingUrl:
          body.data.format === "VIRTUAL"
            ? body.data.meetingUrl?.trim() || null
            : null,
        locationName:
          body.data.format === "IN_PERSON"
            ? body.data.locationName?.trim() || null
            : null,
        address:
          body.data.format === "IN_PERSON"
            ? body.data.address?.trim() || null
            : null,
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            region: true,
          },
        },
      },
    });

    return jsonSuccess(
      {
        session: serializeCcrrSession(session, 0),
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
