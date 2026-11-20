import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-user";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";
import { activeRegistrationStatusFilter } from "@/lib/registration-status";
import { prisma } from "@/lib/db";

type TrendRegistration = { createdAt: Date };

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function buildRegistrationsOverTime(
  registrations: TrendRegistration[],
  dateRange: string | null,
  now: Date,
) {
  const range = dateRange ?? "Last 30 Days";
  const today = startOfUtcDay(now);
  const buckets: { start: Date; end: Date; label: string }[] = [];
  let periodLabel = "Day";

  if (range === "All Time") {
    periodLabel = "Month";
    const firstRegistration = registrations.reduce<Date | null>(
      (earliest, registration) =>
        !earliest || registration.createdAt < earliest
          ? registration.createdAt
          : earliest,
      null,
    );
    const firstMonth = firstRegistration
      ? new Date(Date.UTC(firstRegistration.getUTCFullYear(), firstRegistration.getUTCMonth(), 1))
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const finalMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    for (let start = firstMonth; start <= finalMonth; start = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1))) {
      const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
      buckets.push({
        start,
        end,
        label: start.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }),
      });
    }
  } else if (range === "Last 90 Days") {
    periodLabel = "Week starting";
    for (let index = 12; index >= 0; index -= 1) {
      const start = new Date(today);
      start.setUTCDate(start.getUTCDate() - index * 7);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 7);
      buckets.push({
        start,
        end,
        label: start.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      });
    }
  } else {
    const days = range === "Last 7 Days" ? 7 : 30;
    for (let index = days - 1; index >= 0; index -= 1) {
      const start = new Date(today);
      start.setUTCDate(start.getUTCDate() - index);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      buckets.push({
        start,
        end,
        label: start.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      });
    }
  }

  return {
    periodLabel,
    points: buckets.map((bucket) => ({
      label: bucket.label,
      count: registrations.filter(
        (registration) =>
          registration.createdAt >= bucket.start && registration.createdAt < bucket.end,
      ).length,
    })),
  };
}

export async function GET(request: Request) {
  try {
    await requireRole(["EEC_ADMIN"]);

    const now = new Date();
    const { searchParams } = new URL(request.url);
    const trendDateRange = searchParams.get("trendDateRange");

    const [
      totalRegistrations,
      totalCompletions,
      conductedSessions,
      agencies,
      registrations,
    ] = await Promise.all([
      prisma.registration.count({ where: activeRegistrationStatusFilter }),
      prisma.registration.count({ where: { status: "ATTENDED" } }),
      prisma.orientationSession.findMany({
        where: {
          status: { not: "CANCELLED" },
          endsAt: { lt: now },
        },
        select: {
          registrations: {
            where: activeRegistrationStatusFilter,
            select: { status: true },
          },
        },
      }),
      prisma.agency.findMany({
        where: { isActive: true },
        select: { name: true, region: true, additionalRegions: true },
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

    const sessionsConducted = conductedSessions.length;
    const averageAttendeesPerSession =
      sessionsConducted > 0
        ? Math.round((totalCompletions / sessionsConducted) * 10) / 10
        : 0;
    const averageAttendanceRatePerSession =
      sessionsConducted > 0
        ? Math.round(
            (conductedSessions.reduce((total, session) => {
              const registered = session.registrations.length;
              const attendees = session.registrations.filter(
                (registration) => registration.status === "ATTENDED",
              ).length;

              return total + (registered > 0 ? attendees / registered : 0);
            }, 0) *
              1000) /
              sessionsConducted,
          ) / 10
        : 0;

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

    const sessionRegions = Array.from(
      new Set(agencies.flatMap((agency) => [agency.region, ...agency.additionalRegions])),
    ).sort();
    const regionalCompletion = sessionRegions.map((region) => {
      const counts = regionMap.get(region) ?? { total: 0, attended: 0 };

      return {
        region,
        rate:
          counts.total > 0
            ? Math.round((counts.attended / counts.total) * 100)
            : 0,
      };
    });

    const regionCount = sessionRegions.length;
    const completionRate =
      totalRegistrations > 0
        ? Math.round((totalCompletions / totalRegistrations) * 1000) / 10
        : 0;

    const registrationsOverTime = buildRegistrationsOverTime(
      registrations,
      trendDateRange,
      now,
    );

    const agenciesWithStats = await prisma.agency.findMany({
      where: { isActive: true },
      include: {
        sessions: {
          where: { status: "PUBLISHED" },
          include: {
            registrations: {
              where: activeRegistrationStatusFilter,
              select: { status: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const agencyCompliance = agenciesWithStats.map((entry) => {
      const sessionRegistrations = entry.sessions.flatMap(
        (session) => session.registrations,
      );
      const completions = sessionRegistrations.filter(
        (registration) => registration.status === "ATTENDED",
      ).length;
      const averageAttendeesPerSession =
        entry.sessions.length > 0
          ? Math.round((completions / entry.sessions.length) * 10) / 10
          : 0;
      const averageAttendanceRatePerSession =
        entry.sessions.length > 0
          ? Math.round(
              entry.sessions.reduce((total, session) => {
                const registrants = session.registrations.length;
                const attendees = session.registrations.filter(
                  (registration) => registration.status === "ATTENDED",
                ).length;

                return total + (registrants > 0 ? attendees / registrants : 0);
              }, 0) /
                entry.sessions.length *
                100,
            )
          : 0;

      return {
        agency: entry.name,
        region: entry.region,
        sessions: entry.sessions.length,
        registrations: sessionRegistrations.length,
        completions,
        averageAttendeesPerSession,
        averageAttendanceRatePerSession,
        completionRate:
          sessionRegistrations.length > 0
            ? Math.round((completions / sessionRegistrations.length) * 100)
            : 0,
      };
    });

    const recentActivity = await prisma.registration.findMany({
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: {
        id: true,
        providerName: true,
        status: true,
        attendanceStatus: true,
        createdAt: true,
        updatedAt: true,
        session: {
          select: {
            title: true,
            agency: { select: { name: true } },
          },
        },
      },
    });

    const auditLogs = recentActivity.map((entry) => {
      const isNew = entry.createdAt.getTime() === entry.updatedAt.getTime();
      let action = "Registration updated";

      if (isNew) {
        action = "Registration created";
      } else if (entry.status === "ATTENDED" || entry.attendanceStatus === "ATTENDED") {
        action = "Attendance marked";
      } else if (entry.status === "CANCELLED") {
        action = "Registration cancelled";
      }

      return {
        id: entry.id,
        timestamp: entry.updatedAt.toISOString(),
        action,
        detail: `${entry.providerName} — ${entry.session.title}`,
        agency: entry.session.agency.name,
      };
    });

    return jsonSuccess({
      stats: {
        totalRegistrations,
        totalCompletions,
        completionRate,
        sessionsConducted,
        averageAttendeesPerSession,
        averageAttendanceRatePerSession,
        regionCount,
      },
      regionalCompletion,
      registrationsOverTime: registrationsOverTime.points,
      registrationsOverTimePeriod: registrationsOverTime.periodLabel,
      agencyCompliance,
      auditLogs,
      filterOptions: {
        agencies: ["All Agencies", ...agencies.map((agency) => agency.name)],
        regions: [
          "All Regions",
          ...Array.from(
            new Set(agencies.flatMap((agency) => [agency.region, ...agency.additionalRegions])),
          ).sort(),
        ],
        languages: [
          "All Languages",
          ...SUPPORTED_LANGUAGES.map((language) => language.code),
        ],
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
