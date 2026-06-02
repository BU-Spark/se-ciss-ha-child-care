import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return jsonSuccess({
      status: "ok",
      app: "orientation-management",
      database: "connected",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
