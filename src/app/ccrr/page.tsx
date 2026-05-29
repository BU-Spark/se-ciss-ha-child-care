import type { Metadata } from "next";

import { PersonaLanding } from "@/components/PersonaLanding";
import { getPersona } from "@/config/personas";

export const metadata: Metadata = {
  title: "CCR&R Staff Portal | EEC Orientation",
};

export default function CcrrPage() {
  return <PersonaLanding persona={getPersona("ccrr")} />;
}
