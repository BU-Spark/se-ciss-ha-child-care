import { ProviderType } from "@prisma/client";

import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db";
import { activeRegistrationStatusFilter } from "@/lib/registration-status";

function parseProviderType(value: string | null) {
  if (!value || value === "All Types") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "center-based") {
    return ProviderType.CENTER_BASED;
  }

  if (normalized === "family-based" || normalized === "family child care") {
    return ProviderType.FAMILY_CHILD_CARE;
  }

  if (normalized === "school-age") {
    return ProviderType.SCHOOL_AGE;
  }

  return undefined;
}

function getRegistrationDateBounds(dateRange: string | null, now: Date) {
  if (!dateRange || dateRange === "All Time") {
    return undefined;
  }

  const days =
    dateRange === "Last 7 Days" ? 7 : dateRange === "Last 90 Days" ? 90 : 30;
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - days);

  return { gte: start, lte: now };
}

function formatStatus(
  status: string,
  attendanceStatus: string,
): "Attended" | "Registered" | "No-show" | "Waitlisted" | "Cancelled" {
  if (status === "ATTENDED" || attendanceStatus === "ATTENDED") {
    return "Attended";
  }

  if (status === "NO_SHOW" || attendanceStatus === "NO_SHOW") {
    return "No-show";
  }

  if (status === "WAITLISTED") {
    return "Waitlisted";
  }

  if (status === "CANCELLED") {
    return "Cancelled";
  }

  return "Registered";
}

function formatProviderType(providerType: string | null) {
  switch (providerType) {
    case "CENTER_BASED":
      return "Center-based";
    case "FAMILY_CHILD_CARE":
      return "Family Child Care";
    case "SCHOOL_AGE":
      return "School-age";
    case "OTHER":
      return "Other";
    default:
      return "";
  }
}

function formatYesNo(value: Date | null | undefined) {
  return value ? "Y" : "N";
}

export async function GET(request: Request) {
  try {
    await requireRole(["EEC_ADMIN"]);

    const { searchParams } = new URL(request.url);
    const agency = searchParams.get("agency");
    const region = searchParams.get("region");
    const language = searchParams.get("language");
    const dateRange = searchParams.get("dateRange");
    const providerType = parseProviderType(searchParams.get("providerType"));
    const now = new Date();
    const registrationDate = getRegistrationDateBounds(dateRange, now);

    const registrations = await prisma.registration.findMany({
      where: {
        ...activeRegistrationStatusFilter,
        ...(registrationDate ? { createdAt: registrationDate } : {}),
        ...(providerType
          ? { providerType: providerType as string }
          : {}),
        ...(language && language !== "All Languages"
          ? { preferredLanguage: { equals: language, mode: "insensitive" } }
          : {}),
        session: {
          ...(region && region !== "All Regions"
            ? { region: { equals: region, mode: "insensitive" } }
            : {}),
          ...(agency && agency !== "All Agencies"
            ? {
                agency: {
                  name: { equals: agency, mode: "insensitive" },
                },
              }
            : {}),
        },
      },
      orderBy: [{ session: { startsAt: "desc" } }, { providerName: "asc" }],
      include: {
        session: {
          select: {
            id: true,
            title: true,
            region: true,
            format: true,
            startsAt: true,
            endsAt: true,
            agency: { select: { id: true, name: true, region: true } },
          },
        },
      },
    });

    const providerIds = [
      ...new Set(
        registrations
          .map((registration) => registration.stateProviderId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const providerPrograms =
      providerIds.length > 0
        ? await prisma.providerProgram.findMany({
            where: { stateProviderId: { in: providerIds } },
            select: {
              stateProviderId: true,
              licensingRegion: true,
              subsidyRegion: true,
            },
          })
        : [];

    const programByProviderId = new Map(
      providerPrograms.map((program) => [program.stateProviderId, program]),
    );

    return jsonSuccess({
      registrations: registrations.map((registration) => {
        const program = registration.stateProviderId
          ? programByProviderId.get(registration.stateProviderId)
          : undefined;

        return {
          id: registration.id,
          providerName: registration.providerName,
          organizationName: registration.organizationName,
          stateProviderId: registration.stateProviderId,
          contactEmail: registration.contactEmail,
          phone: registration.phone,
          providerType: registration.providerType,
          providerTypeLabel: formatProviderType(registration.providerType),
          agency: registration.session.agency.name,
          agencyRegion: registration.session.agency.region,
          region: registration.session.region,
          licensingRegion: program?.licensingRegion ?? "",
          subsidyRegion: program?.subsidyRegion ?? "",
          preferredLanguage: registration.preferredLanguage,
          sessionTitle: registration.session.title,
          sessionDate: registration.session.startsAt.toISOString(),
          sessionEndsAt: registration.session.endsAt.toISOString(),
          registeredAt: registration.createdAt.toISOString(),
          format:
            registration.session.format === "VIRTUAL" ? "Virtual" : "In-person",
          status: formatStatus(
            registration.status,
            registration.attendanceStatus,
          ),
          followUpSent: formatYesNo(registration.followUpSentAt),
          reminderSent: formatYesNo(registration.reminderSentAt),
          feedbackSurveySent: "N",
          notes: registration.notes ?? "",
        };
      }),
      total: registrations.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
