import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { requireAppUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireAppUser();

    const registrations = await prisma.registration.findMany({
      where: {
        userId: user.id,
        status: { not: "CANCELLED" },
      },
      orderBy: { session: { startsAt: "asc" } },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            format: true,
            status: true,
            startsAt: true,
            endsAt: true,
            locationName: true,
            address: true,
            meetingUrl: true,
            agency: { select: { id: true, name: true, region: true } },
          },
        },
      },
    });

    return jsonSuccess({
      registrations: registrations.map((r) => ({
        id: r.id,
        status: r.status,
        attendanceStatus: r.attendanceStatus,
        registeredAt: r.createdAt.toISOString(),
        session: {
          id: r.session.id,
          title: r.session.title,
          format: r.session.format,
          status: r.session.status,
          startsAt: r.session.startsAt.toISOString(),
          endsAt: r.session.endsAt.toISOString(),
          locationName: r.session.locationName,
          address: r.session.address,
          meetingUrl: r.session.meetingUrl,
          agency: r.session.agency,
        },
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}