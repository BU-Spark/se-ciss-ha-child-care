import type { Metadata } from "next";

import { PersonaLanding } from "@/components/PersonaLanding";
import { getPersona } from "@/config/personas";

export const metadata: Metadata = {
  title: "Provider Portal | EEC Orientation",
};

export default function ProviderPage() {
  return <PersonaLanding persona={getPersona("provider")} />;
}
