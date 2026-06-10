import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();

    const [regionRows, agencyRows, languageRows] = await Promise.all([
      prisma.orientationSession.findMany({
        where: {
          status: "PUBLISHED",
          startsAt: { gte: now },
        },
        select: { region: true },
        distinct: ["region"],
        orderBy: { region: "asc" },
      }),
      prisma.agency.findMany({
        where: {
          isActive: true,
          sessions: {
            some: {
              status: "PUBLISHED",
              startsAt: { gte: now },
            },
          },
        },
        select: { id: true, name: true, region: true },
        orderBy: { name: "asc" },
      }),
      prisma.orientationSession.findMany({
        where: {
          status: "PUBLISHED",
          startsAt: { gte: now },
        },
        select: { language: true },
        distinct: ["language"],
        orderBy: { language: "asc" },
      }),
    ]);

    const languages = languageRows.map((row) => row.language);
    const languageOptions = SUPPORTED_LANGUAGES.filter((language) =>
      languages.includes(language.code),
    );

    return jsonSuccess({
      regions: regionRows.map((row) => row.region),
      agencies: agencyRows,
      languages:
        languageOptions.length > 0
          ? languageOptions
          : SUPPORTED_LANGUAGES.slice(0, 1),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
