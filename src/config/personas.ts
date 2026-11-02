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
    audience: "Providers seeking EEC information sessions",
    description:
      "Find upcoming information sessions across all Massachusetts CCRR regions, register online, and receive session details by email.",
    features: [
      "Browse virtual and in-person sessions statewide",
      "Filter by agency, region, language, date, and format",
      "Register and receive confirmation with session details",
    ],
  },
  {
    id: "ccrr",
    href: "/ccrr",
    title: "CCRR Staff",
    audience: "Regional Child Care Resource and Referral agencies",
    description:
      "Manage registrations and attendance for your agency’s information sessions without spreadsheets or phone tag.",
    features: [
      "Publish sessions and manage attendance for your agency",
      "Manage attendance rosters for your agency",
      "Export attendance data for compliance reporting",
    ],
  },
  {
    id: "eec",
    href: "/eec",
    title: "EEC Administrator",
    audience: "Massachusetts Department of Early Education and Care",
    description:
      "Monitor information session participation statewide with filters and exports to support program oversight and reporting.",
    features: [
      "Statewide registration and completion data",
      "Filter by agency, region, language, date, and provider type",
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
