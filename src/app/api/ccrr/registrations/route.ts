import { AttendanceStatus, RegistrationStatus } from "@prisma/client";

import { handleApiError, jsonSuccess } from "@/lib/api/response";
import {
  requireCcrrAgencyId,
  requireRole,
} from "@/lib/auth/require-user";
import { prisma } from "@/lib/db";
import { rosterRegistrationStatusFilter } from "@/lib/registration-status";

function formatAttendanceLabel(
  status: RegistrationStatus,
  attendanceStatus: AttendanceStatus,
) {
  if (status === "ATTENDED" || attendanceStatus === "ATTENDED") {
    return "Attended";
  }

  if (status === "NO_SHOW" || attendanceStatus === "NO_SHOW") {
    return "No-show";
  }

  if (status === "WAITLISTED") {
    return "Waitlisted";
  }

  if (attendanceStatus === "NOT_MARKED") {
    return "Not marked";
  }

  return "Registered";
}

export async function GET(request: Request) {
  try {
    const profile = await requireRole(["CCRR_STAFF"]);
    const staffAgencyId = requireCcrrAgencyId(profile);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();

    const registrations = await prisma.registration.findMany({
      where: {
        ...rosterRegistrationStatusFilter,
        session: { agencyId: staffAgencyId },
        ...(search
          ? {
              OR: [
                {
                  providerName: { contains: search, mode: "insensitive" },
                },
                {
                  organizationName: { contains: search, mode: "insensitive" },
                },
                {
                  contactEmail: { contains: search, mode: "insensitive" },
                },
                {
                  stateProviderId: { contains: search, mode: "insensitive" },
                },
                {
                  session: {
                    title: { contains: search, mode: "insensitive" },
                  },
                },
                {
                  session: {
                    agency: {
                      name: { contains: search, mode: "insensitive" },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [
        { session: { startsAt: "desc" } },
        { providerName: "asc" },
      ],
      include: {
        session: {
          select: {
            id: true,
            title: true,
            region: true,
            format: true,
            startsAt: true,
            endsAt: true,
            agencyId: true,
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

    const agencies = await prisma.agency.findMany({
      where: { id: staffAgencyId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, region: true },
    });

    return jsonSuccess({
      staffAgencyId,
      agencies,
      registrations: registrations.map((registration) => ({
        id: registration.id,
        providerName: registration.providerName,
        organizationName: registration.organizationName,
        contactEmail: registration.contactEmail,
        stateProviderId: registration.stateProviderId,
        registrationStatus: registration.status,
        attendanceStatus: registration.attendanceStatus,
        attendanceLabel: formatAttendanceLabel(
          registration.status,
          registration.attendanceStatus,
        ),
        registeredAt: registration.createdAt.toISOString(),
        session: {
          id: registration.session.id,
          title: registration.session.title,
          region: registration.session.region,
          format:
            registration.session.format === "VIRTUAL" ? "Virtual" : "In-person",
          startsAt: registration.session.startsAt.toISOString(),
          endsAt: registration.session.endsAt.toISOString(),
          agency: registration.session.agency,
        },
        canManageAttendance:
          registration.session.agencyId === staffAgencyId,
      })),
      total: registrations.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
