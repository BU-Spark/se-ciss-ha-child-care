import { PrismaClient, SessionFormat, SessionStatus } from "@prisma/client";

const prisma = new PrismaClient();

const agencies = [
  { id: "agency-child-care-circuit", name: "Child Care Circuit", region: "Northeast" },
  { id: "agency-seven-hills", name: "Seven Hills Family Services", region: "Central" },
  { id: "agency-eec-boston", name: "EEC Boston Office", region: "Boston" },
  { id: "agency-pace-cc", name: "Pace CC", region: "Southeast" },
  { id: "agency-valley-opp", name: "Valley Opportunity Council", region: "Western" },
  { id: "agency-child-care-choices", name: "Child Care Choices", region: "Metro Boston" },
];

const sessions = [
  {
    id: "session-eec-orientation-2026-06-14",
    agencyId: "agency-child-care-circuit",
    title: "EEC Mandatory Orientation",
    region: "Northeast",
    format: SessionFormat.VIRTUAL,
    startsAt: new Date("2026-06-14T14:00:00.000Z"),
    endsAt: new Date("2026-06-14T16:30:00.000Z"),
    capacity: 25,
    meetingUrl: "https://example.com/zoom-link",
  },
  {
    id: "session-licensing-review-2026-06-21",
    agencyId: "agency-seven-hills",
    title: "Licensing Regulation Review",
    region: "Central",
    format: SessionFormat.IN_PERSON,
    startsAt: new Date("2026-06-21T17:00:00.000Z"),
    endsAt: new Date("2026-06-21T19:30:00.000Z"),
    capacity: 25,
    locationName: "Seven Hills Family Services",
    address: "Worcester, MA",
  },
  {
    id: "session-health-safety-2026-06-28",
    agencyId: "agency-eec-boston",
    title: "Health and Safety Essentials",
    region: "Boston",
    format: SessionFormat.VIRTUAL,
    startsAt: new Date("2026-06-28T13:00:00.000Z"),
    endsAt: new Date("2026-06-28T15:30:00.000Z"),
    capacity: 25,
    meetingUrl: "https://example.com/teams-link",
  },
];

async function main() {
  for (const agency of agencies) {
    await prisma.agency.upsert({
      where: { id: agency.id },
      update: agency,
      create: agency,
    });
  }

  for (const session of sessions) {
    await prisma.orientationSession.upsert({
      where: { id: session.id },
      update: {
        ...session,
        status: SessionStatus.PUBLISHED,
      },
      create: {
        ...session,
        status: SessionStatus.PUBLISHED,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
