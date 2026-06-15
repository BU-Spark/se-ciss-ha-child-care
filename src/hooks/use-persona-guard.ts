"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  canAccessPortal,
  homePortalForProfile,
  portalPath,
  type PortalId,
} from "@/lib/auth/portal-access";

type MeProfile = {
  source: "APP_USER" | "STAFF_USER";
  role: "PROVIDER" | "CCRR_STAFF" | "EEC_ADMIN";
};

export function usePersonaGuard(portal: PortalId) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectNotice = params.get("portalNotice");
    if (redirectNotice) {
      setNotice(redirectNotice);
      const url = new URL(window.location.href);
      url.searchParams.delete("portalNotice");
      window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    }
  }, []);

  useEffect(() => {
    async function verifyPortal() {
      try {
        const res = await fetch("/api/me");
        const json = await res.json();

        if (!res.ok || !json.success) {
          router.push("/sign-in");
          return;
        }

        const profile = json.data.profile as MeProfile;

        if (!canAccessPortal(profile, portal)) {
          const home = homePortalForProfile(profile);
          const labels: Record<PortalId, string> = {
            provider: "Child Care Provider",
            ccrr: "CCR&R Staff",
            eec: "EEC Administrator",
          };
          const message = `This area is for ${labels[portal]}. Taking you to the ${labels[home]} portal instead.`;
          router.replace(
            `${portalPath(home)}?portalNotice=${encodeURIComponent(message)}`,
          );
          return;
        }

        setIsReady(true);
      } catch {
        router.push("/sign-in");
      }
    }

    verifyPortal();
  }, [portal, router]);

  return { isReady, notice };
}
