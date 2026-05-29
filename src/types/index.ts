export type PersonaId = "provider" | "ccrr" | "eec";

export type PortalCard = {
  id: PersonaId;
  href: `/${PersonaId}`;
  title: string;
  description: string;
};
