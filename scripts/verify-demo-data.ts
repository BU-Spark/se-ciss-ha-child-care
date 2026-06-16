import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_ACCOUNTS = [
  { email: "deep.patel.0603@gmail.com", role: "PROVIDER", portal: "/provider" },
  { email: "deeppatel0306@gmail.com", role: "CCRR_STAFF", portal: "/ccrr" },
  { email: "deepp03@bu.edu", role: "EEC_ADMIN", portal: "/eec" },
];

async function main() {
  console.log("=== Demo data verification ===\n");

  await prisma.$queryRaw`SELECT 1`;
  console.log("Database: connected\n");

  for (const account of DEMO_ACCOUNTS) {
    const [staff, app] = await Promise.all([
      prisma.staffUser.findUnique({ where: { email: account.email } }),
      prisma.appUser.findUnique({ where: { email: account.email } }),
    ]);

    const profile = staff ?? app;
    const ok = profile && profile.role === account.role;

    console.log(
      `${ok ? "OK" : "MISSING"} ${account.role.padEnd(12)} ${account.email} -> ${account.portal}`,
    );
    if (staff?.agencyId) {
      const agency = await prisma.agency.findUnique({
        where: { id: staff.agencyId },
        select: { name: true },
      });
      console.log(`       Agency: ${agency?.name ?? staff.agencyId}`);
    }
  }

  const bostonAgencyId = "seed-agency-boston";
  const now = new Date();

  const bostonSessions = await prisma.orientationSession.findMany({
    where: { agencyId: bostonAgencyId, status: "PUBLISHED" },
    orderBy: { startsAt: "asc" },
    include: {
      _count: {
        select: {
          registrations: {
            where: { status: { not: "CANCELLED" } },
          },
        },
      },
    },
  });

  const upcoming = bostonSessions.filter((session) => session.startsAt >= now);

  console.log("\n=== Boston CCR&R sessions (for staff demo) ===\n");
  if (upcoming.length === 0) {
    console.log("WARN: No upcoming Boston sessions — staff dashboard will be empty.");
  }

  for (const session of upcoming) {
    console.log(
      `- ${session.title} (${session.format}) | ${session._count.registrations} registrants | ${session.startsAt.toISOString().slice(0, 10)}`,
    );
  }

  const totalRegistrations = await prisma.registration.count({
    where: { status: { not: "CANCELLED" } },
  });
  const totalSessions = await prisma.orientationSession.count({
    where: { status: "PUBLISHED" },
  });

  console.log("\n=== Statewide totals (for EEC demo) ===\n");
  console.log(`Sessions: ${totalSessions}`);
  console.log(`Registrations: ${totalRegistrations}`);

  const withPid = await prisma.registration.count({
    where: { stateProviderId: { not: null } },
  });
  console.log(`Registrations with PID: ${withPid}`);

  console.log("\nDone.");
}

main()
  .catch((error) => {
    console.error("Verification failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
