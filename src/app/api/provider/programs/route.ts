import { NextRequest } from "next/server";

import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { searchProviderPrograms } from "@/lib/provider-programs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") ?? "";
    const limitValue = Number.parseInt(searchParams.get("limit") ?? "8", 10);
    const limit = Number.isFinite(limitValue)
      ? Math.min(Math.max(limitValue, 1), 20)
      : 8;

    const programs = (await searchProviderPrograms(query, limit)).map((program) => ({
      stateProviderId: program.stateProviderId,
      programName: program.programName,
      providerType: program.providerType,
      address: program.address,
      city: program.city,
      region: program.region,
      licensingRegion: program.licensingRegion,
      subsidyRegion: program.subsidyRegion,
    }));

    return jsonSuccess({ programs });
  } catch (error) {
    return handleApiError(error);
  }
}