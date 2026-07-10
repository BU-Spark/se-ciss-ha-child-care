import { SessionStatus } from "@prisma/client";

import { ApiError } from "@/lib/api/errors";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { requireAgencyAccess, requireRole } from "@/lib/auth/require-user";
import {
  cancelSessionSchema,
  serializeCcrrSession,
} from "@/lib/ccrr-sessions";
import { prisma } from "@/lib/db";
import { activeRegistrationStatusFilter } from "@/lib/registration-status";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(["CCRR_STAFF"]);
    const { id } = await context.params;
    const body = cancelSessionSchema.safeParse(await request.json());

    if (!body.success) {
      throw ApiError.badRequest("Invalid session update", "INVALID_BODY");
    }

    const session = await prisma.orientationSession.findUnique({
      where: { id },
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

    if (!session) {
      throw ApiError.notFound("Session not found");
    }

    await requireAgencyAccess(session.agencyId);

    if (session.status === SessionStatus.CANCELLED) {
      throw ApiError.badRequest("Session is already cancelled", "ALREADY_CANCELLED");
    }

    if (session.status !== SessionStatus.PUBLISHED) {
      throw ApiError.badRequest(
        "Only published sessions can be cancelled",
        "INVALID_SESSION_STATUS",
      );
    }

    const updatedSession = await prisma.orientationSession.update({
      where: { id },
      data: { status: SessionStatus.CANCELLED },
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

    return jsonSuccess({
      session: serializeCcrrSession(
        updatedSession,
        session._count.registrations,
      ),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
