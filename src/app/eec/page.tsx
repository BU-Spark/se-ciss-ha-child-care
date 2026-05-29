import type { Metadata } from "next";

import { PersonaLanding } from "@/components/PersonaLanding";
import { getPersona } from "@/config/personas";

export const metadata: Metadata = {
  title: "EEC Administrator Portal | EEC Orientation",
};

export default function EecPage() {
  return <PersonaLanding persona={getPersona("eec")} />;
}
