import { ApiError } from "@/lib/api/errors";
import { handleApiError } from "@/lib/api/response";
import { requireCcrrAgencyId, requireRole } from "@/lib/auth/require-user";
import { buildCsv, escapeCSV } from "@/lib/csv";
import { prisma } from "@/lib/db";
import { rosterRegistrationStatusFilter } from "@/lib/registration-status";

function formatAttendance(status: string) {
  if (status === "ATTENDED") return "Attended";
  if (status === "NO_SHOW") return "No-show";
  return "Not marked";
}

export async function GET() {
  try {
    const profile = await requireRole(["CCRR_STAFF"]);
    const agencyId = requireCcrrAgencyId(profile);

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { name: true },
    });

    if (!agency) {
      throw ApiError.notFound("Agency not found");
    }

    const sessions = await prisma.orientationSession.findMany({
      where: { agencyId },
      orderBy: { startsAt: "desc" },
      include: {
        registrations: {
          where: rosterRegistrationStatusFilter,
          orderBy: { providerName: "asc" },
        },
      },
    });

    const headers = [
      "Session Title",
      "Session Date",
      "Format",
      "Provider Name",
      "Email",
      "PID",
      "Organization",
      "Attendance",
      "Notes",
      "Registration Date",
    ];

    const rows: string[][] = [];

    for (const session of sessions) {
      const sessionDate = session.startsAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const format =
        session.format === "VIRTUAL" ? "Virtual" : "In-person";

      if (session.registrations.length === 0) {
        rows.push([
          escapeCSV(session.title),
          escapeCSV(sessionDate),
          escapeCSV(format),
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]);
        continue;
      }

      for (const registration of session.registrations) {
        rows.push([
          escapeCSV(session.title),
          escapeCSV(sessionDate),
          escapeCSV(format),
          escapeCSV(registration.providerName),
          escapeCSV(registration.contactEmail),
          escapeCSV(registration.stateProviderId ?? ""),
          escapeCSV(registration.organizationName),
          escapeCSV(formatAttendance(registration.attendanceStatus)),
          escapeCSV(registration.notes ?? ""),
          escapeCSV(
            registration.createdAt.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
          ),
        ]);
      }
    }

    const csv = buildCsv(headers, rows);
    const filename = `ccrr-export-${agency.name.toLowerCase().replace(/\s+/g, "-")}.csv`;

    return new Response("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
