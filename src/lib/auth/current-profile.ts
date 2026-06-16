import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import type { AppUser, StaffUser, UserRole } from "@prisma/client";

import { ApiError } from "@/lib/api/errors";
import { linkAppUserForClerk, linkStaffUserForClerk } from "@/lib/auth/link-app-user";
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
  const email = clerkUser?.primaryEmailAddress?.emailAddress;

  if (email) {
    const linkedStaff = await prisma.staffUser.findUnique({
      where: { email },
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

    if (
      linkedStaff &&
      (!linkedStaff.clerkUserId || linkedStaff.clerkUserId === userId)
    ) {
      const staffUser = linkedStaff.clerkUserId
        ? linkedStaff
        : await prisma.$transaction(async (tx) => {
            await tx.appUser.deleteMany({ where: { clerkUserId: userId } });

            return linkStaffUserForClerk(tx, {
              clerkUserId: userId,
              email,
              name: linkedStaff.name,
            });
          });

      if (staffUser) {
        return {
          source: "STAFF_USER",
          role: staffUser.role,
          agencyId: staffUser.agencyId,
          user: staffUser,
        };
      }
    }

    const linkedAppUser = await linkAppUserForClerk(prisma, {
      clerkUserId: userId,
      email,
      firstName: clerkUser?.firstName,
      lastName: clerkUser?.lastName,
      createIfMissing: false,
    }).catch((error) => {
      if (
        error instanceof ApiError &&
        error.code === "EMAIL_ALREADY_LINKED"
      ) {
        return null;
      }

      throw error;
    });

    if (linkedAppUser) {
      return {
        source: "APP_USER",
        role: linkedAppUser.role,
        agencyId: linkedAppUser.agencyId,
        user: linkedAppUser,
      };
    }
  }

  throw ApiError.forbidden(
    "No profile is linked to this Clerk account. Run npm run account:link for your role.",
    "PROFILE_NOT_LINKED",
  );
}

export async function provisionProviderProfile(): Promise<CurrentProfile> {
  const { userId } = await auth();

  if (!userId) {
    throw ApiError.unauthorized();
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

  const provisionedUser = await prisma.$transaction(async (tx) => {
    await tx.staffUser.deleteMany({ where: { clerkUserId: userId } });

    return linkAppUserForClerk(tx, {
      clerkUserId: userId,
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
    });
  });

  if (!provisionedUser) {
    throw ApiError.badRequest(
      "Unable to provision provider profile",
      "PROFILE_CREATE_FAILED",
    );
  }

  return {
    source: "APP_USER",
    role: provisionedUser.role,
    agencyId: provisionedUser.agencyId,
    user: provisionedUser,
  };
}

export async function requireAppUser(): Promise<AppUserWithAgency> {
  let profile: CurrentProfile;

  try {
    profile = await getCurrentProfile();
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.code === "PROFILE_NOT_LINKED"
    ) {
      profile = await provisionProviderProfile();
    } else {
      throw error;
    }
  }

  if (profile.source !== "APP_USER") {
    throw ApiError.forbidden("Provider profile required");
  }

  return profile.user;
}

function wrongRoleMessage(
  role: UserRole,
  allowedRoles: UserRole[],
): string {
  if (role === "PROVIDER" && allowedRoles.includes("CCRR_STAFF")) {
    return "You are signed in as a provider. Link this Clerk user as CCR&R staff with: npm run account:link -- ccrr <clerkUserId> <agencyId> <email>";
  }

  if (role === "PROVIDER" && allowedRoles.includes("EEC_ADMIN")) {
    return "You are signed in as a provider. Link this Clerk user as EEC admin with: npm run account:link -- eec <clerkUserId> <email>";
  }

  if (role === "CCRR_STAFF" && allowedRoles.includes("EEC_ADMIN")) {
    return "You are signed in as CCR&R staff. Use an EEC admin account for this page, or run: npm run account:link -- eec <clerkUserId> <email>";
  }

  if (role === "EEC_ADMIN" && allowedRoles.includes("CCRR_STAFF")) {
    return "You are signed in as an EEC admin. CCR&R staff data requires a CCR&R staff account.";
  }

  return "Your account does not have access to this resource";
}

export async function requireRole(
  allowedRoles: UserRole[],
): Promise<CurrentProfile> {
  let profile: CurrentProfile;

  try {
    profile = await getCurrentProfile();
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.code === "PROFILE_NOT_LINKED"
    ) {
      throw ApiError.forbidden(
        "No profile is linked to this Clerk account. Run npm run account:link for your role.",
        "PROFILE_NOT_LINKED",
      );
    }

    throw error;
  }

  if (!allowedRoles.includes(profile.role)) {
    throw ApiError.forbidden(
      wrongRoleMessage(profile.role, allowedRoles),
      "WRONG_ROLE",
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
