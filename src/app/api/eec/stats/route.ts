import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-user";
import { activeRegistrationStatusFilter } from "@/lib/registration-status";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await requireRole(["EEC_ADMIN"]);

    const now = new Date();

    const [
      totalRegistrations,
      totalCompletions,
      activeSessions,
      agenciesCount,
      agencies,
      registrations,
    ] = await Promise.all([
      prisma.registration.count({ where: activeRegistrationStatusFilter }),
      prisma.registration.count({ where: { status: "ATTENDED" } }),
      prisma.orientationSession.count({
        where: { status: "PUBLISHED", startsAt: { gte: now } },
      }),
      prisma.agency.count({ where: { isActive: true } }),
      prisma.agency.findMany({
        where: { isActive: true },
        select: { name: true, region: true },
        orderBy: { name: "asc" },
      }),
      prisma.registration.findMany({
        where: activeRegistrationStatusFilter,
        select: {
          status: true,
          createdAt: true,
          session: { select: { region: true } },
        },
      }),
    ]);

    const regionMap = new Map<string, { total: number; attended: number }>();

    for (const registration of registrations) {
      const region = registration.session.region;
      const entry = regionMap.get(region) ?? { total: 0, attended: 0 };
      entry.total += 1;
      if (registration.status === "ATTENDED") {
        entry.attended += 1;
      }
      regionMap.set(region, entry);
    }

    const regionalCompletion = Array.from(regionMap.entries())
      .map(([region, counts]) => ({
        region,
        rate:
          counts.total > 0
            ? Math.round((counts.attended / counts.total) * 100)
            : 0,
      }))
      .sort((a, b) => a.region.localeCompare(b.region));

    const regionCount = regionMap.size;
    const completionRate =
      totalRegistrations > 0
        ? Math.round((totalCompletions / totalRegistrations) * 1000) / 10
        : 0;

    const bucketStarts: Date[] = [];
    for (let index = 7; index >= 0; index -= 1) {
      const start = new Date(now);
      start.setUTCDate(start.getUTCDate() - index * 7);
      start.setUTCHours(0, 0, 0, 0);
      bucketStarts.push(start);
    }

    const registrationsOverTime = bucketStarts.map((start, index) => {
      const end = bucketStarts[index + 1] ?? new Date(now.getTime() + 86_400_000);
      const count = registrations.filter(
        (registration) =>
          registration.createdAt >= start && registration.createdAt < end,
      ).length;

      return {
        label: start.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        count,
      };
    });

    return jsonSuccess({
      stats: {
        totalRegistrations,
        totalCompletions,
        completionRate,
        activeSessions,
        agenciesCount,
        regionCount,
      },
      regionalCompletion,
      registrationsOverTime,
      filterOptions: {
        agencies: ["All Agencies", ...agencies.map((agency) => agency.name)],
        regions: [
          "All Regions",
          ...Array.from(new Set(agencies.map((agency) => agency.region))).sort(),
        ],
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
