import "dotenv/config";

import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const AGENCIES = [
  { id: "agency-child-care-circuit", name: "Child Care Circuit", region: "Northeast" },
  { id: "agency-seven-hills", name: "Seven Hills Family Services", region: "Central" },
  { id: "agency-eec-boston", name: "EEC Boston Office", region: "Boston" },
  { id: "seed-agency-boston", name: "Boston Child Care Resource Center", region: "Boston" },
  { id: "seed-agency-northeast", name: "Northeast Family Support Agency", region: "Northeast" },
  { id: "seed-agency-western", name: "Western MA Early Learning Network", region: "Western Massachusetts" },
] as const;

function printUsage() {
  console.log(`
Link a Clerk user to a test persona in the database.

Usage:
  npm run account:link -- <role> <clerkUserId> [agencyIdOrName] [email]

Roles:
  provider   Child care provider -> /provider
  ccrr       CCR&R staff         -> /ccrr  (requires agency)
  eec        EEC administrator   -> /eec

Examples:
  npm run account:link -- provider user_2abc123 provider@example.com
  npm run account:link -- ccrr user_2abc123 seed-agency-boston staff@example.com
  npm run account:link -- eec user_2abc123 eec.admin@example.com

Agency options:
${AGENCIES.map((agency) => `  ${agency.id} (${agency.name})`).join("\n")}
`);
}

async function resolveAgencyId(agencyArg: string | undefined) {
  if (!agencyArg) {
    throw new Error("CCR&R staff accounts require an agency id or name.");
  }

  const normalized = agencyArg.trim().toLowerCase();
  const match = AGENCIES.find(
    (agency) =>
      agency.id.toLowerCase() === normalized ||
      agency.name.toLowerCase() === normalized,
  );

  if (!match) {
    const known = await prisma.agency.findFirst({
      where: {
        OR: [
          { id: agencyArg },
          { name: { equals: agencyArg, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true },
    });

    if (!known) {
      throw new Error(`Unknown agency "${agencyArg}".`);
    }

    return known;
  }

  return { id: match.id, name: match.name };
}

async function linkProvider(clerkUserId: string, email: string) {
  const user = await prisma.appUser.upsert({
    where: { clerkUserId },
    update: {
      email,
      role: UserRole.PROVIDER,
    },
    create: {
      clerkUserId,
      email,
      role: UserRole.PROVIDER,
    },
  });

  await prisma.staffUser.deleteMany({ where: { clerkUserId } });

  return {
    role: "provider",
    dashboard: "/provider",
    email: user.email,
  };
}

async function linkCcrrStaff(
  clerkUserId: string,
  email: string,
  agencyId: string,
  agencyName: string,
  displayName?: string,
) {
  await prisma.appUser.deleteMany({ where: { clerkUserId } });
  await prisma.staffUser.updateMany({
    where: { clerkUserId, email: { not: email } },
    data: { clerkUserId: null },
  });

  const name = displayName ?? email.split("@")[0] ?? "CCR&R Staff";
  const existing = await prisma.staffUser.findFirst({
    where: {
      OR: [{ clerkUserId }, { email }],
    },
  });

  const staff = existing
    ? await prisma.staffUser.update({
        where: { id: existing.id },
        data: {
          clerkUserId,
          email,
          name,
          role: UserRole.CCRR_STAFF,
          agencyId,
        },
      })
    : await prisma.staffUser.create({
        data: {
          clerkUserId,
          email,
          name,
          role: UserRole.CCRR_STAFF,
          agencyId,
        },
      });

  return {
    role: "ccrr",
    dashboard: "/ccrr",
    email: staff.email,
    agency: agencyName,
  };
}

async function linkEecAdmin(
  clerkUserId: string,
  email: string,
  displayName?: string,
) {
  await prisma.appUser.deleteMany({ where: { clerkUserId } });
  await prisma.staffUser.updateMany({
    where: { clerkUserId, email: { not: email } },
    data: { clerkUserId: null },
  });

  const name = displayName ?? "EEC State Admin";
  const existing = await prisma.staffUser.findFirst({
    where: {
      OR: [{ clerkUserId }, { email }],
    },
  });

  const staff = existing
    ? await prisma.staffUser.update({
        where: { id: existing.id },
        data: {
          clerkUserId,
          email,
          name,
          role: UserRole.EEC_ADMIN,
          agencyId: null,
        },
      })
    : await prisma.staffUser.create({
        data: {
          clerkUserId,
          email,
          name,
          role: UserRole.EEC_ADMIN,
          agencyId: null,
        },
      });

  return {
    role: "eec",
    dashboard: "/eec",
    email: staff.email,
  };
}

async function main() {
  const [, , roleArg, clerkUserId, thirdArg, fourthArg, fifthArg] =
    process.argv;

  if (!roleArg || !clerkUserId || roleArg === "--help" || roleArg === "-h") {
    printUsage();
    process.exit(roleArg ? 0 : 1);
  }

  const role = roleArg.toLowerCase();

  if (role === "provider") {
    const email = thirdArg ?? `${clerkUserId}@example.com`;
    const result = await linkProvider(clerkUserId, email);
    console.log("Linked provider account:");
    console.log(result);
    return;
  }

  if (role === "ccrr") {
    const agency = await resolveAgencyId(thirdArg);
    const email = fourthArg ?? `ccrr.${agency.id}@example.com`;
    const result = await linkCcrrStaff(
      clerkUserId,
      email,
      agency.id,
      agency.name,
      fifthArg,
    );
    console.log("Linked CCR&R staff account:");
    console.log(result);
    return;
  }

  if (role === "eec") {
    const email = thirdArg ?? "eec.admin@example.com";
    const result = await linkEecAdmin(clerkUserId, email, fourthArg);
    console.log("Linked EEC admin account:");
    console.log(result);
    return;
  }

  throw new Error(`Unknown role "${roleArg}". Use provider, ccrr, or eec.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    printUsage();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
