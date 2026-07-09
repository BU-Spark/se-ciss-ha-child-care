// src/app/api/cron/sync-providers/route.ts
import { NextRequest } from "next/server";
import { jsonSuccess, handleApiError } from "@/lib/api/response";
import { syncProviderPrograms } from "@/lib/eec/syncProviders";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const expected = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET || authHeader !== expected) {
      return new Response("Unauthorized", { status: 401 });
    }

    const result = await syncProviderPrograms();

    return jsonSuccess({
      message: "Provider sync complete",
      ...result,
    });
  } catch (err) {
    return handleApiError(err);
  }
}