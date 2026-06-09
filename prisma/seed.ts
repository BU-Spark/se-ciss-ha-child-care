import {
  PrismaClient,
  ProviderType,
  SessionFormat,
  SessionStatus,
} from "@prisma/client";

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

const providerPrograms = [
  {
    id: "program-little-learners",
    stateProviderId: "PID-100112",
    programName: "Little Learners Child Care Center",
    providerType: ProviderType.CENTER_BASED,
    address: "18 Beacon St, Boston, MA 02108",
    city: "Boston",
    region: "Boston",
    licensingRegion: "Metro Boston",
    subsidyRegion: "Metro Boston",
  },
  {
    id: "program-bright-futures",
    stateProviderId: "PID-100214",
    programName: "Bright Futures Family Child Care",
    providerType: ProviderType.FAMILY_CHILD_CARE,
    address: "42 Main St, Worcester, MA 01608",
    city: "Worcester",
    region: "Central",
    licensingRegion: "Central",
    subsidyRegion: "Central",
  },
  {
    id: "program-rising-stars",
    stateProviderId: "PID-100318",
    programName: "Rising Stars Early Learning",
    providerType: ProviderType.CENTER_BASED,
    address: "240 River St, Springfield, MA 01103",
    city: "Springfield",
    region: "Western",
    licensingRegion: "Western",
    subsidyRegion: "Western",
  },
  {
    id: "program-harbor-view",
    stateProviderId: "PID-100427",
    programName: "Harbor View Kids Academy",
    providerType: ProviderType.CENTER_BASED,
    address: "88 Harbor St, New Bedford, MA 02740",
    city: "New Bedford",
    region: "Southeast",
    licensingRegion: "Southeast",
    subsidyRegion: "Southeast",
  },
  {
    id: "program-northeast-neighborhood",
    stateProviderId: "PID-100533",
    programName: "Northeast Neighborhood Child Care",
    providerType: ProviderType.CENTER_BASED,
    address: "12 Essex St, Lawrence, MA 01840",
    city: "Lawrence",
    region: "Northeast",
    licensingRegion: "Northeast",
    subsidyRegion: "Northeast",
  },
  {
    id: "program-tiny-explorers",
    stateProviderId: "PID-100641",
    programName: "Tiny Explorers Family Child Care",
    providerType: ProviderType.FAMILY_CHILD_CARE,
    address: "17 Maple Ave, Cambridge, MA 02139",
    city: "Cambridge",
    region: "Metro Boston",
    licensingRegion: "Metro Boston",
    subsidyRegion: "Metro Boston",
  },
  {
    id: "program-boston-school-age",
    stateProviderId: "PID-100755",
    programName: "Boston Community School-Age Program",
    providerType: ProviderType.SCHOOL_AGE,
    address: "145 Tremont St, Boston, MA 02111",
    city: "Boston",
    region: "Boston",
    licensingRegion: "Metro Boston",
    subsidyRegion: "Metro Boston",
  },
  {
    id: "program-pioneer-valley",
    stateProviderId: "PID-100862",
    programName: "Pioneer Valley Learning Hub",
    providerType: ProviderType.CENTER_BASED,
    address: "9 Market St, Northampton, MA 01060",
    city: "Northampton",
    region: "Western",
    licensingRegion: "Western",
    subsidyRegion: "Western",
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

  for (const program of providerPrograms) {
    await prisma.providerProgram.upsert({
      where: { stateProviderId: program.stateProviderId },
      update: program,
      create: program,
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
