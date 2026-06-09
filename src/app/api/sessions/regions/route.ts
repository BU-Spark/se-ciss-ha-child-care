import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const rows = await prisma.orientationSession.findMany({
      where: {
        status: "PUBLISHED",
        startsAt: { gte: new Date() },
      },
      select: { region: true },
      distinct: ["region"],
      orderBy: { region: "asc" },
    });

    return jsonSuccess({
      regions: rows.map((row) => row.region),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
