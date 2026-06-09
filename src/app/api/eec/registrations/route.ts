import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await requireRole(["EEC_ADMIN"]);

    const registrations = await prisma.registration.findMany({
      orderBy: [{ session: { startsAt: "asc" } }, { providerName: "asc" }],
      include: {
        session: {
          select: {
            id: true,
            title: true,
            region: true,
            format: true,
            startsAt: true,
            agency: { select: { id: true, name: true, region: true } },
          },
        },
      },
    });

    return jsonSuccess({
      registrations: registrations.map((r) => ({
        id: r.id,
        providerName: r.providerName,
        organizationName: r.organizationName,
        contactEmail: r.contactEmail,
        agency: r.session.agency.name,
        region: r.session.region,
        sessionTitle: r.session.title,
        sessionDate: r.session.startsAt.toISOString(),
        format: r.session.format,
        status: r.status,
        attendanceStatus: r.attendanceStatus,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}