import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { requireCcrrAgencyId, requireRole } from "@/lib/auth/current-profile";
import { prisma } from "@/lib/db";
import { activeRegistrationStatusFilter } from "@/lib/registration-status";

export async function GET() {
  try {
    const profile = await requireRole(["CCRR_STAFF", "EEC_ADMIN"]);

    const sessions = await prisma.orientationSession.findMany({
      where:
        profile.role === "EEC_ADMIN"
          ? { status: "PUBLISHED" }
          : {
              status: "PUBLISHED",
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
      sessions: sessions.map((session) => {
        const registeredCount = session._count.registrations;
        const capacity = session.capacity ?? 0;

        return {
          id: session.id,
          title: session.title,
          description: session.description,
          region: session.region,
          format: session.format,
          status: session.status,
          startsAt: session.startsAt.toISOString(),
          endsAt: session.endsAt.toISOString(),
          capacity,
          registeredCount,
          spotsLeft:
            capacity > 0 ? Math.max(capacity - registeredCount, 0) : null,
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
