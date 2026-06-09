import { RegistrationStatus } from "@prisma/client";
import { z } from "zod";

import { ApiError } from "@/lib/api/errors";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { requireAgencyAccess, requireRole } from "@/lib/auth/current-profile";
import { prisma } from "@/lib/db";

const attendanceSchema = z.object({
  attendanceStatus: z.enum(["ATTENDED", "NO_SHOW"]),
});

const ATTENDANCE_ELIGIBLE_STATUSES: RegistrationStatus[] = [
  RegistrationStatus.REGISTERED,
  RegistrationStatus.ATTENDED,
  RegistrationStatus.NO_SHOW,
];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(["CCRR_STAFF", "EEC_ADMIN"]);
    const { id } = await context.params;
    const body = attendanceSchema.safeParse(await request.json());

    if (!body.success) {
      throw ApiError.badRequest("Invalid attendance request", "INVALID_BODY");
    }

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        session: {
          include: {
            agency: {
              select: {
                id: true,
                name: true,
                region: true,
              },
            },
          },
        },
      },
    });

    if (!registration) {
      throw ApiError.notFound("Registration not found");
    }

    if (!ATTENDANCE_ELIGIBLE_STATUSES.includes(registration.status)) {
      throw ApiError.badRequest(
        "Attendance can only be updated for active registrations",
        "INVALID_REGISTRATION_STATUS",
      );
    }

    await requireAgencyAccess(registration.session.agencyId);

    const now = new Date();
    const updatedRegistration = await prisma.registration.update({
      where: { id },
      data:
        body.data.attendanceStatus === "ATTENDED"
          ? {
              status: RegistrationStatus.ATTENDED,
              attendanceStatus: "ATTENDED",
              checkedInAt: now,
              completedAt: now,
            }
          : {
              status: RegistrationStatus.NO_SHOW,
              attendanceStatus: "NO_SHOW",
              checkedInAt: null,
              completedAt: null,
            },
    });

    return jsonSuccess({
      registration: {
        id: updatedRegistration.id,
        sessionId: updatedRegistration.sessionId,
        status: updatedRegistration.status,
        attendanceStatus: updatedRegistration.attendanceStatus,
        checkedInAt: updatedRegistration.checkedInAt?.toISOString() ?? null,
        completedAt: updatedRegistration.completedAt?.toISOString() ?? null,
      },
      session: {
        id: registration.session.id,
        title: registration.session.title,
        agency: registration.session.agency,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
