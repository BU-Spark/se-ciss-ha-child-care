"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

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

const portalLabels: Record<PortalId, string> = {
  provider: "Child Care Provider",
  ccrr: "CCR&R Staff",
  eec: "EEC Administrator",
};

export function usePersonaGuard(portal: PortalId) {
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [notice] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return new URLSearchParams(window.location.search).get("portalNotice");
  });
  const [setupMessage, setSetupMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("portalNotice")) {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("portalNotice");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }, []);

  useEffect(() => {
    if (!authLoaded) {
      return;
    }

    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent(portalPath(portal))}`);
      return;
    }

    async function verifyPortal() {
      try {
        const meUrl =
          portal === "provider" ? "/api/me?autoProvision=provider" : "/api/me";
        const res = await fetch(meUrl);
        const json = await res.json();

        if (res.status === 401) {
          router.push(`/sign-in?redirect_url=${encodeURIComponent(portalPath(portal))}`);
          return;
        }

        if (!res.ok || !json.success) {
          if (json.error?.code === "PROFILE_NOT_LINKED") {
            setSetupMessage(json.error.message);
            setIsReady(true);
            return;
          }

          setSetupMessage(
            json.error?.message ?? "Unable to load your account profile.",
          );
          setIsReady(true);
          return;
        }

        const profile = json.data.profile as MeProfile;

        if (!canAccessPortal(profile, portal)) {
          const home = homePortalForProfile(profile);
          const message = `This area is for ${portalLabels[portal]}. Taking you to the ${portalLabels[home]} portal instead.`;
          router.replace(
            `${portalPath(home)}?portalNotice=${encodeURIComponent(message)}`,
          );
          return;
        }

        setIsReady(true);
      } catch {
        setSetupMessage("Network error. Please refresh and try again.");
        setIsReady(true);
      }
    }

    verifyPortal();
  }, [authLoaded, isSignedIn, portal, router]);

  const canLoadData = authLoaded && isSignedIn && isReady && !setupMessage;

  return {
    isReady,
    notice,
    setupMessage,
    portalLabel: portalLabels[portal],
    canLoadData,
  };
}
