import { ApiError } from "@/lib/api/errors";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import {
  requireCcrrAgencyId,
  requireRole,
} from "@/lib/auth/require-user";
import { prisma } from "@/lib/db";
import { rosterRegistrationStatusFilter } from "@/lib/registration-status";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const profile = await requireRole(["CCRR_STAFF", "EEC_ADMIN"]);
    const { id } = await context.params;

    const session = await prisma.orientationSession.findUnique({
      where: { id },
      include: {
        agency: { select: { id: true, name: true, region: true } },
        registrations: {
          where: rosterRegistrationStatusFilter,
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            providerName: true,
            organizationName: true,
            stateProviderId: true,
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

    if (
      profile.role === "CCRR_STAFF" &&
      session.agencyId !== requireCcrrAgencyId(profile)
    ) {
      throw ApiError.forbidden(
        "You can only view registrations for sessions hosted by your agency",
      );
    }

    return jsonSuccess({
      canManageAttendance: true,
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
        stateProviderId: r.stateProviderId,
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