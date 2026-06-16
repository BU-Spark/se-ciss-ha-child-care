import { ApiError } from "@/lib/api/errors";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { requireAppUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db";
import { activeRegistrationStatusFilter } from "@/lib/registration-status";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAppUser();
    const { id } = await context.params;

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        session: {
          select: {
            id: true,
            startsAt: true,
            capacity: true,
          },
        },
      },
    });

    if (!registration || registration.userId !== user.id) {
      throw ApiError.notFound("Registration not found");
    }

    if (registration.status === "CANCELLED") {
      throw ApiError.badRequest(
        "This registration is already cancelled",
        "ALREADY_CANCELLED",
      );
    }

    if (registration.status === "ATTENDED") {
      throw ApiError.badRequest(
        "Completed sessions cannot be cancelled",
        "REGISTRATION_COMPLETED",
      );
    }

    if (registration.session.startsAt <= new Date()) {
      throw ApiError.badRequest(
        "Past sessions cannot be cancelled",
        "REGISTRATION_CLOSED",
      );
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    const registeredCount = await prisma.registration.count({
      where: {
        sessionId: registration.sessionId,
        ...activeRegistrationStatusFilter,
      },
    });

    const capacity = registration.session.capacity ?? 0;

    return jsonSuccess({
      registration: {
        id: updated.id,
        status: updated.status,
      },
      session: {
        id: registration.session.id,
        registeredCount,
        spotsLeft:
          capacity > 0 ? Math.max(capacity - registeredCount, 0) : null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
