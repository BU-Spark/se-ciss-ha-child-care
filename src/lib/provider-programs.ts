import type { ProviderType } from "@prisma/client";

import { prisma } from "@/lib/db";

export type ProviderProgram = {
  stateProviderId: string;
  programName: string;
  providerType: ProviderType;
  address: string;
  city: string;
  region: string;
  licensingRegion: string;
  subsidyRegion: string;
};

export async function searchProviderPrograms(query: string, limit = 8) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  return prisma.providerProgram.findMany({
    where: {
      isActive: true,
      OR: [
        { programName: { contains: normalizedQuery, mode: "insensitive" } },
        { stateProviderId: { contains: normalizedQuery, mode: "insensitive" } },
        { address: { contains: normalizedQuery, mode: "insensitive" } },
        { city: { contains: normalizedQuery, mode: "insensitive" } },
        { region: { contains: normalizedQuery, mode: "insensitive" } },
        { licensingRegion: { contains: normalizedQuery, mode: "insensitive" } },
        { subsidyRegion: { contains: normalizedQuery, mode: "insensitive" } },
      ],
    },
    orderBy: { programName: "asc" },
    take: limit,
    select: {
      stateProviderId: true,
      programName: true,
      providerType: true,
      address: true,
      city: true,
      region: true,
      licensingRegion: true,
      subsidyRegion: true,
    },
  });
}
