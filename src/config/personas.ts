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
      "Find a CCFA information session near you or online, register in a few clicks, and get all the details sent to your email.",
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
      "See who’s registered for your agency’s sessions, track attendance, and keep everything in one place.",
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
      "View information session participation across the state, with filters and downloads to support reporting.",
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
