import {
  AttendanceStatus,
  PrismaClient,
  ProviderType,
  RegistrationStatus,
  SessionFormat,
  SessionStatus,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

/** Official EEC CCR&R agencies (Kate Giapponi Schneider, June 2026). */
const agencies = [
  {
    id: "agency-child-care-choices",
    name: "Child Care Choices of Boston",
    region: "Metro Boston",
  },
  {
    id: "agency-child-care-network",
    name: "Child Care Network",
    region: "Cape and Islands",
  },
  {
    id: "agency-child-care-circuit",
    name: "Child Care Circuit",
    region: "Northeast",
  },
  {
    id: "agency-community-care-for-kids",
    name: "Community Care for Kids",
    region: "Metro South",
  },
  {
    id: "agency-child-care-works",
    name: "Child Care Works",
    region: "Southeast",
  },
  {
    id: "agency-seven-hills",
    name: "Seven Hills Child Care Resources",
    region: "Central",
  },
];

const sessions = [
  {
    id: "session-eec-orientation-2026-06-14",
    agencyId: "agency-child-care-circuit",
    title: "Voucher Orientation Session",
    region: "Northeast",
    format: SessionFormat.VIRTUAL,
    startsAt: new Date("2026-06-14T14:00:00.000Z"),
    endsAt: new Date("2026-06-14T16:30:00.000Z"),
    capacity: 25,
    meetingUrl: "https://example.com/zoom-link",
    language: "en",
  },
  {
    id: "session-licensing-review-2026-06-21",
    agencyId: "agency-seven-hills",
    title: "Voucher Orientation Session",
    region: "Central",
    format: SessionFormat.IN_PERSON,
    startsAt: new Date("2026-06-21T17:00:00.000Z"),
    endsAt: new Date("2026-06-21T19:30:00.000Z"),
    capacity: 25,
    locationName: "Seven Hills Child Care Resources",
    address: "799 West Boylston St., Worcester, MA 01606",
    language: "es",
  },
  {
    id: "session-health-safety-2026-06-28",
    agencyId: "agency-child-care-choices",
    title: "Voucher Orientation Session",
    region: "Metro Boston",
    format: SessionFormat.VIRTUAL,
    startsAt: new Date("2026-06-28T13:00:00.000Z"),
    endsAt: new Date("2026-06-28T15:30:00.000Z"),
    capacity: 25,
    meetingUrl: "https://example.com/teams-link",
    language: "pt",
  },
  {
    id: "seed-session-boston-virtual",
    agencyId: "agency-child-care-choices",
    title: "Voucher Orientation Session",
    description: "Introductory orientation for new family child care providers.",
    region: "Metro Boston",
    format: SessionFormat.VIRTUAL,
    startsAt: new Date("2026-06-20T14:00:00.000Z"),
    endsAt: new Date("2026-06-20T16:00:00.000Z"),
    capacity: 30,
    meetingUrl: "https://example.com/zoom/boston-orientation",
    language: "es",
  },
  {
    id: "seed-session-boston-person",
    agencyId: "agency-child-care-choices",
    title: "Voucher Orientation Session",
    description: "In-person session at Child Care Choices of Boston.",
    region: "Metro Boston",
    format: SessionFormat.IN_PERSON,
    startsAt: new Date("2026-06-27T13:00:00.000Z"),
    endsAt: new Date("2026-06-27T16:00:00.000Z"),
    capacity: 25,
    locationName: "Child Care Choices of Boston",
    address: "105 Chauncy St., Boston, MA 02111",
    language: "en",
  },
  {
    id: "seed-session-boston-summer",
    agencyId: "agency-child-care-choices",
    title: "Voucher Orientation Session",
    description: "Virtual voucher orientation hosted by Child Care Choices of Boston.",
    region: "Metro Boston",
    format: SessionFormat.VIRTUAL,
    startsAt: new Date("2026-07-10T15:00:00.000Z"),
    endsAt: new Date("2026-07-10T17:00:00.000Z"),
    capacity: 40,
    meetingUrl: "https://example.com/zoom/boston-summer",
    language: "en",
  },
  {
    id: "seed-session-northeast-virtual",
    agencyId: "agency-child-care-circuit",
    title: "Voucher Orientation Session",
    description: "Virtual orientation for providers in the Northeast region.",
    region: "Northeast",
    format: SessionFormat.VIRTUAL,
    startsAt: new Date("2026-06-23T17:00:00.000Z"),
    endsAt: new Date("2026-06-23T19:00:00.000Z"),
    capacity: 40,
    meetingUrl: "https://example.com/zoom/northeast-orientation",
    language: "zh",
  },
  {
    id: "seed-session-western-past",
    agencyId: "agency-child-care-works",
    title: "Voucher Orientation Session",
    description: "Completed test session with attendance data.",
    region: "Southeast",
    format: SessionFormat.IN_PERSON,
    startsAt: new Date("2026-05-23T14:00:00.000Z"),
    endsAt: new Date("2026-05-23T16:00:00.000Z"),
    capacity: 20,
    locationName: "Child Care Works",
    address: "134 S 2nd St., New Bedford, MA 02740",
    language: "ht",
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

const staffUsers = [
  {
    id: "staff-child-care-circuit",
    email: "ccrr.circuit@example.com",
    name: "Sarah Mitchell",
    role: UserRole.CCRR_STAFF,
    agencyId: "agency-child-care-circuit",
    clerkUserId: process.env.SEED_CCRR_CLERK_USER_ID ?? null,
  },
  {
    id: "staff-seven-hills",
    email: "ccrr.sevenhills@example.com",
    name: "David Okonkwo",
    role: UserRole.CCRR_STAFF,
    agencyId: "agency-seven-hills",
    clerkUserId: process.env.SEED_CCRR_SEVEN_HILLS_CLERK_USER_ID ?? null,
  },
  {
    id: "staff-eec-boston",
    email: "ccrr.boston@example.com",
    name: "Lisa Park",
    role: UserRole.CCRR_STAFF,
    agencyId: "agency-child-care-choices",
    clerkUserId: process.env.SEED_CCRR_BOSTON_CLERK_USER_ID ?? null,
  },
  {
    id: "staff-eec-admin",
    email: "eec.admin@example.com",
    name: "EEC State Admin",
    role: UserRole.EEC_ADMIN,
    agencyId: null,
    clerkUserId: process.env.SEED_EEC_CLERK_USER_ID ?? null,
  },
  {
    id: "seed-staff-boston",
    email: "deeppatel0306@gmail.com",
    name: "Deep Patel",
    role: UserRole.CCRR_STAFF,
    agencyId: "agency-child-care-choices",
    clerkUserId: process.env.SEED_BOSTON_RESOURCE_CLERK_USER_ID ?? null,
  },
  {
    id: "seed-staff-northeast",
    email: "staff.northeast@example.com",
    name: "Northeast CCR&R Staff",
    role: UserRole.CCRR_STAFF,
    agencyId: "agency-child-care-circuit",
    clerkUserId: process.env.SEED_NORTHEAST_RESOURCE_CLERK_USER_ID ?? null,
  },
  {
    id: "seed-staff-omar",
    email: "deepp03@bu.edu",
    name: "Deep Patel",
    role: UserRole.EEC_ADMIN,
    agencyId: null,
    clerkUserId: process.env.SEED_OMAR_EEC_CLERK_USER_ID ?? null,
  },
];

const providerUsers = [
  {
    id: "appuser-maria-rodriguez",
    clerkUserId: "seed-provider-maria-rodriguez",
    email: "deep.patel.0603@gmail.com",
    firstName: "Deep",
    lastName: "Patel",
    providerName: "Deep Patel",
    organizationName: "Little Learners Child Care Center",
    providerType: ProviderType.CENTER_BASED,
    stateProviderId: "PID-100112",
    phone: "(555) 010-0001",
    preferredLanguage: "en",
  },
  {
    id: "appuser-james-chen",
    clerkUserId: "seed-provider-james-chen",
    email: "j.chen@daycare.org",
    firstName: "James",
    lastName: "Chen",
    providerName: "James Chen",
    organizationName: "Bright Futures Family Child Care",
    providerType: ProviderType.FAMILY_CHILD_CARE,
    stateProviderId: "PID-100214",
    phone: "(555) 010-0002",
    preferredLanguage: "zh",
  },
  {
    id: "appuser-althea-jenkins",
    clerkUserId: "seed-provider-althea-jenkins",
    email: "ajenkins@provider.net",
    firstName: "Althea",
    lastName: "Jenkins",
    providerName: "Althea Jenkins",
    organizationName: "Northeast Neighborhood Child Care",
    providerType: ProviderType.CENTER_BASED,
    stateProviderId: "PID-100533",
    phone: "(555) 010-0003",
    preferredLanguage: "en",
  },
  {
    id: "appuser-devon-walsh",
    clerkUserId: "seed-provider-devon-walsh",
    email: "d.walsh@brightstart.org",
    firstName: "Devon",
    lastName: "Walsh",
    providerName: "Devon Walsh",
    organizationName: "Rising Stars Early Learning",
    providerType: ProviderType.CENTER_BASED,
    stateProviderId: "PID-100318",
    phone: "(555) 010-0004",
  },
  {
    id: "appuser-priya-nair",
    clerkUserId: "seed-provider-priya-nair",
    email: "priya.nair@example.com",
    firstName: "Priya",
    lastName: "Nair",
    providerName: "Priya Nair",
    organizationName: "Harbor View Kids Academy",
    providerType: ProviderType.CENTER_BASED,
    stateProviderId: "PID-100427",
    phone: "(555) 010-0005",
  },
  {
    id: "appuser-tomas-herrera",
    clerkUserId: "seed-provider-tomas-herrera",
    email: "t.herrera@littlesteps.org",
    firstName: "Tomás",
    lastName: "Herrera",
    providerName: "Tomás Herrera",
    organizationName: "Tiny Explorers Family Child Care",
    providerType: ProviderType.FAMILY_CHILD_CARE,
    stateProviderId: "PID-100641",
    phone: "(555) 010-0006",
  },
  {
    id: "appuser-elena-vasquez",
    clerkUserId: "seed-provider-elena-vasquez",
    email: "e.vasquez@cambridgekids.org",
    firstName: "Elena",
    lastName: "Vasquez",
    providerName: "Elena Vasquez",
    organizationName: "Cambridge Kids Academy",
    providerType: ProviderType.CENTER_BASED,
    stateProviderId: "PID-100901",
    phone: "(555) 010-0007",
  },
  {
    id: "appuser-robert-kim",
    clerkUserId: "seed-provider-robert-kim",
    email: "r.kim@brightbeginnings.org",
    firstName: "Robert",
    lastName: "Kim",
    providerName: "Robert Kim",
    organizationName: "Bright Beginnings Child Care",
    providerType: ProviderType.CENTER_BASED,
    stateProviderId: "PID-100902",
    phone: "(555) 010-0008",
  },
  {
    id: "appuser-sophia-martinez",
    clerkUserId: "seed-provider-sophia-martinez",
    email: "s.martinez@littlestars.org",
    firstName: "Sophia",
    lastName: "Martinez",
    providerName: "Sophia Martinez",
    organizationName: "Little Stars Learning Center",
    providerType: ProviderType.FAMILY_CHILD_CARE,
    stateProviderId: "PID-100903",
    phone: "(555) 010-0009",
  },
];

const registrations = [
  {
    id: "registration-maria-eec-june-14",
    sessionId: "session-eec-orientation-2026-06-14",
    userId: "appuser-maria-rodriguez",
    providerName: "Deep Patel",
    organizationName: "Little Learners Child Care Center",
    contactEmail: "deep.patel.0603@gmail.com",
    phone: "(555) 010-0001",
    providerType: ProviderType.CENTER_BASED,
    status: RegistrationStatus.REGISTERED,
    attendanceStatus: AttendanceStatus.NOT_MARKED,
    preferredLanguage: "es",
    notes: null,
    createdAt: new Date("2026-06-02T15:00:00.000Z"),
  },
  {
    id: "registration-james-eec-june-14",
    sessionId: "session-eec-orientation-2026-06-14",
    userId: "appuser-james-chen",
    providerName: "James Chen",
    organizationName: "Bright Futures Family Child Care",
    contactEmail: "j.chen@daycare.org",
    phone: "(555) 010-0002",
    providerType: ProviderType.FAMILY_CHILD_CARE,
    status: RegistrationStatus.ATTENDED,
    attendanceStatus: AttendanceStatus.ATTENDED,
    preferredLanguage: "zh",
    notes: "Arrived 5 mins late",
    checkedInAt: new Date("2026-06-14T14:05:00.000Z"),
    completedAt: new Date("2026-06-14T16:30:00.000Z"),
    createdAt: new Date("2026-06-04T12:00:00.000Z"),
  },
  {
    id: "registration-althea-eec-june-14",
    sessionId: "session-eec-orientation-2026-06-14",
    userId: "appuser-althea-jenkins",
    providerName: "Althea Jenkins",
    organizationName: "Northeast Neighborhood Child Care",
    contactEmail: "ajenkins@provider.net",
    phone: "(555) 010-0003",
    providerType: ProviderType.CENTER_BASED,
    status: RegistrationStatus.REGISTERED,
    attendanceStatus: AttendanceStatus.NOT_MARKED,
    preferredLanguage: "en",
    notes: null,
    createdAt: new Date("2026-06-05T18:00:00.000Z"),
  },
  {
    id: "registration-devon-licensing-june-21",
    sessionId: "session-licensing-review-2026-06-21",
    userId: "appuser-devon-walsh",
    providerName: "Devon Walsh",
    organizationName: "Rising Stars Early Learning",
    contactEmail: "d.walsh@brightstart.org",
    phone: "(555) 010-0004",
    providerType: ProviderType.CENTER_BASED,
    status: RegistrationStatus.REGISTERED,
    attendanceStatus: AttendanceStatus.NOT_MARKED,
    notes: null,
    createdAt: new Date("2026-06-09T14:00:00.000Z"),
  },
  {
    id: "registration-priya-licensing-june-21",
    sessionId: "session-licensing-review-2026-06-21",
    userId: "appuser-priya-nair",
    providerName: "Priya Nair",
    organizationName: "Harbor View Kids Academy",
    contactEmail: "priya.nair@example.com",
    phone: "(555) 010-0005",
    providerType: ProviderType.CENTER_BASED,
    status: RegistrationStatus.REGISTERED,
    attendanceStatus: AttendanceStatus.NOT_MARKED,
    notes: null,
    createdAt: new Date("2026-06-11T16:30:00.000Z"),
  },
  {
    id: "registration-tomas-health-june-28",
    sessionId: "session-health-safety-2026-06-28",
    userId: "appuser-tomas-herrera",
    providerName: "Tomás Herrera",
    organizationName: "Tiny Explorers Family Child Care",
    contactEmail: "t.herrera@littlesteps.org",
    phone: "(555) 010-0006",
    providerType: ProviderType.FAMILY_CHILD_CARE,
    status: RegistrationStatus.REGISTERED,
    attendanceStatus: AttendanceStatus.NOT_MARKED,
    notes: null,
    createdAt: new Date("2026-06-18T13:00:00.000Z"),
  },
  {
    id: "registration-elena-boston-licensing-june-16",
    sessionId: "seed-session-boston-person",
    userId: "appuser-elena-vasquez",
    providerName: "Elena Vasquez",
    organizationName: "Cambridge Kids Academy",
    contactEmail: "e.vasquez@cambridgekids.org",
    phone: "(555) 010-0007",
    providerType: ProviderType.CENTER_BASED,
    status: RegistrationStatus.REGISTERED,
    attendanceStatus: AttendanceStatus.NOT_MARKED,
    preferredLanguage: "en",
    notes: "First-time applicant",
    createdAt: new Date("2026-06-03T10:00:00.000Z"),
  },
  {
    id: "registration-robert-boston-licensing-june-16",
    sessionId: "seed-session-boston-person",
    userId: "appuser-robert-kim",
    providerName: "Robert Kim",
    organizationName: "Bright Beginnings Child Care",
    contactEmail: "r.kim@brightbeginnings.org",
    phone: "(555) 010-0008",
    providerType: ProviderType.CENTER_BASED,
    status: RegistrationStatus.REGISTERED,
    attendanceStatus: AttendanceStatus.NOT_MARKED,
    preferredLanguage: "en",
    notes: "Brought all required licensing documents",
    createdAt: new Date("2026-06-06T14:30:00.000Z"),
  },
  {
    id: "registration-sophia-boston-licensing-june-16",
    sessionId: "seed-session-boston-person",
    userId: "appuser-sophia-martinez",
    providerName: "Sophia Martinez",
    organizationName: "Little Stars Learning Center",
    contactEmail: "s.martinez@littlestars.org",
    phone: "(555) 010-0009",
    providerType: ProviderType.FAMILY_CHILD_CARE,
    status: RegistrationStatus.REGISTERED,
    attendanceStatus: AttendanceStatus.NOT_MARKED,
    preferredLanguage: "es",
    notes: null,
    createdAt: new Date("2026-06-10T09:15:00.000Z"),
  },
  {
    id: "registration-james-boston-virtual-june-20",
    sessionId: "seed-session-boston-virtual",
    userId: "appuser-james-chen",
    providerName: "James Chen",
    organizationName: "Bright Futures Family Child Care",
    contactEmail: "j.chen@daycare.org",
    phone: "(555) 010-0002",
    providerType: ProviderType.FAMILY_CHILD_CARE,
    status: RegistrationStatus.REGISTERED,
    attendanceStatus: AttendanceStatus.NOT_MARKED,
    preferredLanguage: "zh",
    notes: null,
    createdAt: new Date("2026-06-08T11:00:00.000Z"),
  },
  {
    id: "registration-althea-boston-virtual-june-20",
    sessionId: "seed-session-boston-virtual",
    userId: "appuser-althea-jenkins",
    providerName: "Althea Jenkins",
    organizationName: "Northeast Neighborhood Child Care",
    contactEmail: "ajenkins@provider.net",
    phone: "(555) 010-0003",
    providerType: ProviderType.CENTER_BASED,
    status: RegistrationStatus.REGISTERED,
    attendanceStatus: AttendanceStatus.NOT_MARKED,
    preferredLanguage: "en",
    notes: "Needs Spanish materials",
    createdAt: new Date("2026-06-09T16:00:00.000Z"),
  },
  {
    id: "registration-tomas-boston-virtual-june-20",
    sessionId: "seed-session-boston-virtual",
    userId: "appuser-tomas-herrera",
    providerName: "Tomás Herrera",
    organizationName: "Tiny Explorers Family Child Care",
    contactEmail: "t.herrera@littlesteps.org",
    phone: "(555) 010-0006",
    providerType: ProviderType.FAMILY_CHILD_CARE,
    status: RegistrationStatus.REGISTERED,
    attendanceStatus: AttendanceStatus.NOT_MARKED,
    preferredLanguage: "es",
    notes: null,
    createdAt: new Date("2026-06-10T08:30:00.000Z"),
  },
  {
    id: "registration-priya-boston-summer-july-10",
    sessionId: "seed-session-boston-summer",
    userId: "appuser-priya-nair",
    providerName: "Priya Nair",
    organizationName: "Harbor View Kids Academy",
    contactEmail: "priya.nair@example.com",
    phone: "(555) 010-0005",
    providerType: ProviderType.CENTER_BASED,
    status: RegistrationStatus.REGISTERED,
    attendanceStatus: AttendanceStatus.NOT_MARKED,
    preferredLanguage: "en",
    notes: null,
    createdAt: new Date("2026-06-11T12:00:00.000Z"),
  },
  {
    id: "registration-devon-boston-summer-july-10",
    sessionId: "seed-session-boston-summer",
    userId: "appuser-devon-walsh",
    providerName: "Devon Walsh",
    organizationName: "Rising Stars Early Learning",
    contactEmail: "d.walsh@brightstart.org",
    phone: "(555) 010-0004",
    providerType: ProviderType.CENTER_BASED,
    status: RegistrationStatus.REGISTERED,
    attendanceStatus: AttendanceStatus.NOT_MARKED,
    preferredLanguage: "en",
    notes: "Renewal training",
    createdAt: new Date("2026-06-12T09:00:00.000Z"),
  },
];

async function main() {
  const ownerEmails = [
    "deep.patel.0603@gmail.com",
    "deepp03@bu.edu",
    "deeppatel0306@gmail.com",
  ];

  await prisma.appUser.deleteMany({
    where: {
      email: { in: ownerEmails },
      id: { not: "appuser-maria-rodriguez" },
    },
  });

  await prisma.appUser.deleteMany({
    where: {
      email: {
        in: [
          "m.rodriguez@example.com",
          "staff.boston@example.com",
          "omar.admin@example.com",
        ],
      },
    },
  });

  await prisma.staffUser.deleteMany({
    where: {
      email: {
        in: ["staff.boston@example.com", "omar.admin@example.com"],
      },
      id: { not: "seed-staff-boston" },
    },
  });

  for (const agency of agencies) {
    await prisma.agency.upsert({
      where: { id: agency.id },
      update: agency,
      create: agency,
    });
  }

  // Retire demo / non-EEC agencies so filters and admin counts match client list.
  const officialAgencyIds = agencies.map((agency) => agency.id);
  await prisma.agency.updateMany({
    where: { id: { notIn: officialAgencyIds } },
    data: { isActive: false },
  });

  // Move any leftover sessions still tied to retired agencies onto the official Boston CCR&R.
  await prisma.orientationSession.updateMany({
    where: { agencyId: { notIn: officialAgencyIds } },
    data: { agencyId: "agency-child-care-choices", region: "Metro Boston" },
  });

  await prisma.staffUser.updateMany({
    where: {
      role: UserRole.CCRR_STAFF,
      agencyId: { notIn: officialAgencyIds },
    },
    data: { agencyId: "agency-child-care-choices" },
  });

  await prisma.orientationSession.updateMany({
    where: { title: "CCFA Orientation" },
    data: { title: "Voucher Orientation Session" },
  });

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

  for (const staffUser of staffUsers) {
    const clerkUserId =
      staffUser.clerkUserId && staffUser.clerkUserId.trim().length > 0
        ? staffUser.clerkUserId
        : null;

    await prisma.staffUser.upsert({
      where: { id: staffUser.id },
      update: {
        email: staffUser.email,
        name: staffUser.name,
        role: staffUser.role,
        agencyId: staffUser.agencyId,
        clerkUserId,
      },
      create: {
        ...staffUser,
        clerkUserId,
      },
    });
  }

  for (const providerUser of providerUsers) {
    await prisma.appUser.upsert({
      where: { id: providerUser.id },
      update: providerUser,
      create: {
        ...providerUser,
        role: UserRole.PROVIDER,
      },
    });
  }

  const providerStateIds = Object.fromEntries(
    providerUsers.map((provider) => [provider.id, provider.stateProviderId]),
  );

  for (const registration of registrations) {
    const stateProviderId = registration.userId
      ? providerStateIds[registration.userId]
      : undefined;

    await prisma.registration.upsert({
      where: { id: registration.id },
      update: {
        ...registration,
        stateProviderId,
      },
      create: {
        ...registration,
        stateProviderId,
      },
    });
  }

  console.log(
    "\nDemo accounts (sign up in Clerk first, then open the portal):",
    "\n  Provider:  deep.patel.0603@gmail.com  -> /provider",
    "\n  CCR&R:     deeppatel0306@gmail.com     -> /ccrr",
    "\n  EEC Admin: deepp03@bu.edu               -> /eec",
    "\n\nChild Care Choices demo data:",
    "\n  3 upcoming sessions with registrants (virtual, in-person, summer refresher)",
    "\n  Run: npm run demo:verify",
  );
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
