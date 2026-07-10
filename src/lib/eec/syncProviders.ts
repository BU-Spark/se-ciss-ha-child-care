// src/lib/eec/syncProviders.ts
// Syncs ProviderProgram table from the MA EEC state licensing dataset (Socrata SODA API)

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SODA_BASE_URL = "https://educationtocareer.data.mass.gov/resource/iyks-y3g6.json";
const PAGE_SIZE = 1000; // Socrata default max without paging is 1000; use $limit/$offset to page through all ~2,300 rows

interface SodaProviderRow {
  provider_number?: string;
  program_name?: string;
  program_umbrella?: string;
  program_street_address1?: string;
  program_street_address2?: string;
  program_city?: string;
  program_zipcode?: string;
  program_phone?: string;
  licensing_region?: string;
  subsidy_region?: string;
  program_type?: string;
  licensed_funded?: string;
  licensed_provider_status?: string;
  funded_provider_status?: string;
  regulatory_status?: string;
  first_issued_date?: string;
  licensed_capacity?: string;
  data_pulled_date?: string;
  [key: string]: string | undefined;
}

interface SyncResult {
  totalFetched: number;
  inserted: number;
  updated: number;
  deactivated: number;
  errors: { providerNumber: string | undefined; message: string }[];
}

function mapProviderType(
  rawType: string | undefined
): "CENTER_BASED" | "FAMILY_CHILD_CARE" | "SCHOOL_AGE" | "OTHER" | "UNKNOWN" {
  if (!rawType) return "UNKNOWN";
  const t = rawType.toLowerCase();
  if (t.includes("center")) return "CENTER_BASED";
  if (t.includes("family")) return "FAMILY_CHILD_CARE";
  if (t.includes("school")) return "SCHOOL_AGE";
  return "OTHER";
}

async function fetchAllRows(): Promise<SodaProviderRow[]> {
  const appToken = process.env.SODA_APP_TOKEN;
  const rows: SodaProviderRow[] = [];
  let offset = 0;

  while (true) {
    const url = new URL(SODA_BASE_URL);
    url.searchParams.set("$limit", String(PAGE_SIZE));
    url.searchParams.set("$offset", String(offset));

    const headers: Record<string, string> = {};
    if (appToken) headers["X-App-Token"] = appToken;

    const res = await fetch(url.toString(), { headers });

    if (!res.ok) {
      throw new Error(`Socrata fetch failed: ${res.status} ${res.statusText}`);
    }

    const page: SodaProviderRow[] = await res.json();
    rows.push(...page);

    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return rows;
}

function mapRowToProviderProgram(row: SodaProviderRow) {
  const addressParts = [row.program_street_address1, row.program_street_address2]
    .filter((part) => part && part.trim().length > 0)
    .join(", ");

  return {
    stateProviderId: row.provider_number ?? "",
    programName: row.program_name ?? "",
    providerType: mapProviderType(row.program_type),
    address: addressParts,
    city: row.program_city ?? "",
    region: row.licensing_region ?? "",
    licensingRegion: row.licensing_region ?? "",
    subsidyRegion: row.subsidy_region ?? "",
    isActive: true,
  };
}

export async function syncProviderPrograms(): Promise<SyncResult> {
  const result: SyncResult = {
    totalFetched: 0,
    inserted: 0,
    updated: 0,
    deactivated: 0,
    errors: [],
  };

  const rows = await fetchAllRows();
  result.totalFetched = rows.length;

  const seenIds = new Set<string>();

  for (const row of rows) {
    const providerNumber = row.provider_number;
    if (!providerNumber) continue;

    seenIds.add(providerNumber);
    const data = mapRowToProviderProgram(row);

    try {
      const existing = await prisma.providerProgram.findUnique({
        where: { stateProviderId: providerNumber },
      });

      if (existing) {
        await prisma.providerProgram.update({
          where: { stateProviderId: providerNumber },
          data,
        });
        result.updated += 1;
      } else {
        await prisma.providerProgram.create({ data });
        result.inserted += 1;
      }
    } catch (err) {
      result.errors.push({
        providerNumber,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const deactivated = await prisma.providerProgram.updateMany({
    where: {
      stateProviderId: { notIn: Array.from(seenIds) },
      isActive: true,
    },
    data: { isActive: false },
  });
  result.deactivated = deactivated.count;

  return result;
}