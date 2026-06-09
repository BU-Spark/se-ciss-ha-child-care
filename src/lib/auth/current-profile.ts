import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import type { AppUser, StaffUser, UserRole } from "@prisma/client";

import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/db";

type AgencySummary = {
  id: string;
  name: string;
  region: string;
};

type AppUserWithAgency = AppUser & {
  agency: AgencySummary | null;
};

type StaffUserWithAgency = StaffUser & {
  agency: AgencySummary | null;
};

export type CurrentProfile =
  | {
      source: "APP_USER";
      role: UserRole;
      agencyId: string | null;
      user: AppUserWithAgency;
    }
  | {
      source: "STAFF_USER";
      role: UserRole;
      agencyId: string | null;
      user: StaffUserWithAgency;
    };

export async function getCurrentProfile(): Promise<CurrentProfile> {
  const { userId } = await auth();

  if (!userId) {
    throw ApiError.unauthorized();
  }

  const [staffUser, appUser] = await Promise.all([
    prisma.staffUser.findUnique({
      where: { clerkUserId: userId },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            region: true,
          },
        },
      },
    }),
    prisma.appUser.findUnique({
      where: { clerkUserId: userId },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            region: true,
          },
        },
      },
    }),
  ]);

  if (staffUser) {
    return {
      source: "STAFF_USER",
      role: staffUser.role,
      agencyId: staffUser.agencyId,
      user: staffUser,
    };
  }

  if (appUser) {
    return {
      source: "APP_USER",
      role: appUser.role,
      agencyId: appUser.agencyId,
      user: appUser,
    };
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw ApiError.unauthorized();
  }

  const email = clerkUser.primaryEmailAddress?.emailAddress;

  if (!email) {
    throw ApiError.badRequest(
      "Your Clerk account must have a primary email before using the app",
      "MISSING_EMAIL",
    );
  }

  const provisionedUser = await prisma.appUser.upsert({
    where: { clerkUserId: userId },
    update: {
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
    },
    create: {
      clerkUserId: userId,
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      role: "PROVIDER",
    },
    include: {
      agency: {
        select: {
          id: true,
          name: true,
          region: true,
        },
      },
    },
  });

  return {
    source: "APP_USER",
    role: provisionedUser.role,
    agencyId: provisionedUser.agencyId,
    user: provisionedUser,
  };
}

export async function requireAppUser(): Promise<AppUserWithAgency> {
  const profile = await getCurrentProfile();

  if (profile.source !== "APP_USER") {
    throw ApiError.forbidden("Provider profile required");
  }

  return profile.user;
}

export async function requireRole(
  allowedRoles: UserRole[],
): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();

  if (!allowedRoles.includes(profile.role)) {
    throw ApiError.forbidden(
      "Your account does not have access to this resource",
    );
  }

  return profile;
}

export function requireCcrrAgencyId(profile: CurrentProfile): string {
  if (profile.role !== "CCRR_STAFF") {
    throw ApiError.forbidden("CCR&R agency scope required");
  }

  if (!profile.agencyId) {
    throw ApiError.forbidden(
      "CCR&R staff account is missing an agency assignment",
      "MISSING_AGENCY",
    );
  }

  return profile.agencyId;
}

export async function requireAgencyAccess(
  agencyId: string,
): Promise<CurrentProfile> {
  const profile = await requireRole(["CCRR_STAFF", "EEC_ADMIN"]);

  if (profile.role === "EEC_ADMIN") {
    return profile;
  }

  requireCcrrAgencyId(profile);

  if (profile.agencyId !== agencyId) {
    throw ApiError.forbidden(
      "CCR&R staff can only access their own agency data",
    );
  }

  return profile;
}
