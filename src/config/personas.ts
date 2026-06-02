export type PersonaId = "provider" | "ccrr" | "eec";

export type Persona = {
  id: PersonaId;
  href: `/${PersonaId}`;
  title: string;
  audience: string;
  description: string;
  features: string[];
};

export const personas: Persona[] = [
  {
    id: "provider",
    href: "/provider",
    title: "Child Care Provider",
    audience: "Providers seeking EEC orientation",
    description:
      "Find upcoming orientation sessions across all Massachusetts CCR&R regions, register online, and receive session details by email.",
    features: [
      "Browse virtual and in-person sessions statewide",
      "Filter by region, date, and format",
      "Register and receive confirmation with session details",
    ],
  },
  {
    id: "ccrr",
    href: "/ccrr",
    title: "CCR&R Staff",
    audience: "Regional Child Care Resource & Referral agencies",
    description:
      "Manage registrations and attendance for your agency’s orientation sessions without spreadsheets or phone tag.",
    features: [
      "View registrations for your sessions only",
      "Mark attendance and track completion",
      "Session summaries and automated follow-up emails",
    ],
  },
  {
    id: "eec",
    href: "/eec",
    title: "EEC Administrator",
    audience: "Massachusetts Department of Early Education and Care",
    description:
      "Monitor orientation participation statewide with filters and exports to support program oversight and reporting.",
    features: [
      "Statewide registration and completion data",
      "Filter by agency, region, date, and provider type",
      "Aggregate metrics and CSV export",
    ],
  },
];

export function getPersona(id: PersonaId): Persona {
  const persona = personas.find((p) => p.id === id);
  if (!persona) {
    throw new Error(`Unknown persona: ${id}`);
  }
  return persona;
}
