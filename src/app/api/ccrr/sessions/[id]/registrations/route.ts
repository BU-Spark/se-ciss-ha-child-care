import { RegistrationStatus } from "@prisma/client";

import { ApiError } from "@/lib/api/errors";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { requireAgencyAccess, requireRole } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db";

// Only registrations that can actually have attendance marked appear on the roster.
const ROSTER_STATUSES: RegistrationStatus[] = [
  RegistrationStatus.REGISTERED,
  RegistrationStatus.ATTENDED,
  RegistrationStatus.NO_SHOW,
];

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(["CCRR_STAFF", "EEC_ADMIN"]);
    const { id } = await context.params;

    const session = await prisma.orientationSession.findUnique({
      where: { id },
      include: {
        agency: { select: { id: true, name: true, region: true } },
        registrations: {
          where: { status: { in: ROSTER_STATUSES } },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            providerName: true,
            organizationName: true,
            contactEmail: true,
            phone: true,
            status: true,
            attendanceStatus: true,
            notes: true,
            createdAt: true,
            checkedInAt: true,
          },
        },
      },
    });

    if (!session) {
      throw ApiError.notFound("Session not found");
    }

    // CCR&R staff can only read their own agency's roster; EEC admins read any.
    await requireAgencyAccess(session.agencyId);

    return jsonSuccess({
      session: {
        id: session.id,
        title: session.title,
        description: session.description,
        region: session.region,
        format: session.format,
        status: session.status,
        startsAt: session.startsAt.toISOString(),
        endsAt: session.endsAt.toISOString(),
        capacity: session.capacity ?? 0,
        locationName: session.locationName,
        address: session.address,
        meetingUrl: session.meetingUrl,
        agency: session.agency,
        registeredCount: session.registrations.length,
      },
      registrations: session.registrations.map((r) => ({
        id: r.id,
        providerName: r.providerName,
        organizationName: r.organizationName,
        contactEmail: r.contactEmail,
        phone: r.phone,
        status: r.status,
        attendanceStatus: r.attendanceStatus,
        notes: r.notes,
        registeredAt: r.createdAt.toISOString(),
        checkedInAt: r.checkedInAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}