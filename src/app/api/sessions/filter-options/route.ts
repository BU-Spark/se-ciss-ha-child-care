import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const agencies = await prisma.agency.findMany({
      where: { isActive: true },
      select: { id: true, name: true, region: true },
      orderBy: [{ region: "asc" }, { name: "asc" }],
    });

    return jsonSuccess({
      agencies,
      regions: Array.from(new Set(agencies.map((agency) => agency.region))).sort(),
      languages: SUPPORTED_LANGUAGES,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
