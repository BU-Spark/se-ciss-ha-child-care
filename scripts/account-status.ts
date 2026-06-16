import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const clerkUserId = process.argv[2];

  if (!clerkUserId || clerkUserId === "--help" || clerkUserId === "-h") {
    console.log(`
Check which app role is linked to a Clerk user.

Usage:
  npm run account:status -- <clerkUserId>

Example:
  npm run account:status -- user_2abc123
`);
    process.exit(clerkUserId ? 0 : 1);
  }

  const [staffUser, appUser] = await Promise.all([
    prisma.staffUser.findUnique({
      where: { clerkUserId },
      include: {
        agency: { select: { id: true, name: true, region: true } },
      },
    }),
    prisma.appUser.findUnique({
      where: { clerkUserId },
      include: {
        agency: { select: { id: true, name: true, region: true } },
      },
    }),
  ]);

  if (!staffUser && !appUser) {
    console.log("No profile linked for this Clerk user.");
    console.log(
      "Run one of:\n  npm run account:link -- provider <clerkUserId> <email>\n  npm run account:link -- ccrr <clerkUserId> <agencyId> <email>\n  npm run account:link -- eec <clerkUserId> <email>",
    );
    return;
  }

  if (staffUser) {
    console.log("Linked as STAFF:");
    console.log({
      name: staffUser.name,
      email: staffUser.email,
      role: staffUser.role,
      agency: staffUser.agency,
      dashboard:
        staffUser.role === "EEC_ADMIN"
          ? "/eec"
          : staffUser.role === "CCRR_STAFF"
            ? "/ccrr"
            : "unknown",
    });
  }

  if (appUser) {
    console.log("Linked as PROVIDER:");
    console.log({
      email: appUser.email,
      role: appUser.role,
      providerName: appUser.providerName,
      dashboard: "/provider",
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
