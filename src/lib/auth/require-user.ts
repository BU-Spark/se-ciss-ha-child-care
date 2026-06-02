import "server-only";

import { auth } from "@clerk/nextjs/server";
import type { AppUser, UserRole } from "@prisma/client";

import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/db";

export async function requireAppUser(): Promise<AppUser> {
  const { userId } = await auth();

  if (!userId) {
    throw ApiError.unauthorized();
  }

  const user = await prisma.appUser.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    throw ApiError.forbidden("No application profile exists for this Clerk user");
  }

  return user;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<AppUser> {
  const user = await requireAppUser();

  if (!allowedRoles.includes(user.role)) {
    throw ApiError.forbidden("Your account does not have access to this resource");
  }

  return user;
}

export async function requireAgencyAccess(agencyId: string): Promise<AppUser> {
  const user = await requireRole(["CCRR_STAFF", "EEC_ADMIN"]);

  if (user.role === "EEC_ADMIN") {
    return user;
  }

  if (user.agencyId !== agencyId) {
    throw ApiError.forbidden("CCR&R staff can only access their own agency data");
  }

  return user;
}
