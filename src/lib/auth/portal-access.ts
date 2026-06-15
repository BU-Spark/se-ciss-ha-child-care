import type { UserRole } from "@prisma/client";

export type PortalId = "provider" | "ccrr" | "eec";

type ProfileShape = {
  source: "APP_USER" | "STAFF_USER";
  role: UserRole;
};

export function homePortalForProfile(profile: ProfileShape): PortalId {
  if (profile.role === "EEC_ADMIN") {
    return "eec";
  }

  if (profile.role === "CCRR_STAFF") {
    return "ccrr";
  }

  return "provider";
}

export function portalPath(portal: PortalId) {
  return `/${portal}`;
}

export function canAccessPortal(profile: ProfileShape, portal: PortalId) {
  return homePortalForProfile(profile) === portal;
}

export function wrongPortalMessage(profile: ProfileShape, portal: PortalId) {
  const home = homePortalForProfile(profile);

  if (home === portal) {
    return null;
  }

  const labels: Record<PortalId, string> = {
    provider: "Child Care Provider",
    ccrr: "CCR&R Staff",
    eec: "EEC Administrator",
  };

  return `This portal is for ${labels[portal]}. You were redirected to the ${labels[home]} portal.`;
}
