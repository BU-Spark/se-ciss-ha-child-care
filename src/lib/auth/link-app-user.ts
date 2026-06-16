import type { Prisma } from "@prisma/client";

import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/db";

const agencyInclude = {
  agency: {
    select: {
      id: true,
      name: true,
      region: true,
    },
  },
} as const;

export function isPlaceholderClerkUserId(clerkUserId: string) {
  return clerkUserId.startsWith("seed-");
}

type LinkAppUserInput = {
  clerkUserId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  create?: Omit<Prisma.AppUserCreateInput, "clerkUserId" | "email" | "firstName" | "lastName" | "role">;
  update?: Omit<Prisma.AppUserUpdateInput, "clerkUserId" | "email" | "firstName" | "lastName">;
  createIfMissing?: boolean;
};

type PrismaClientLike = Pick<typeof prisma, "appUser" | "staffUser">;

export async function linkStaffUserForClerk(
  db: PrismaClientLike,
  input: {
    clerkUserId: string;
    email: string;
    name?: string;
  },
) {
  const { clerkUserId, email, name } = input;

  const existing = await db.staffUser.findFirst({
    where: {
      OR: [{ clerkUserId }, { email }],
    },
    include: agencyInclude,
  });

  if (
    existing &&
    existing.clerkUserId &&
    existing.clerkUserId !== clerkUserId
  ) {
    throw ApiError.conflict(
      "This email is already linked to another Clerk account. Sign in with that account or use a different email.",
      "EMAIL_ALREADY_LINKED",
    );
  }

  if (existing) {
    return db.staffUser.update({
      where: { id: existing.id },
      data: {
        clerkUserId,
        email,
        ...(name ? { name } : {}),
      },
      include: agencyInclude,
    });
  }

  return null;
}

export async function linkAppUserForClerk(
  db: PrismaClientLike,
  input: LinkAppUserInput,
) {
  const { clerkUserId, email, firstName, lastName, create = {}, update = {}, createIfMissing = true } = input;

  const existing = await db.appUser.findFirst({
    where: {
      OR: [{ clerkUserId }, { email }],
    },
  });

  if (
    existing &&
    existing.clerkUserId !== clerkUserId &&
    !isPlaceholderClerkUserId(existing.clerkUserId)
  ) {
    throw ApiError.conflict(
      "This email is already linked to another Clerk account. Sign in with that account or use a different email.",
      "EMAIL_ALREADY_LINKED",
    );
  }

  const profileFields = {
    clerkUserId,
    email,
    firstName,
    lastName,
  };

  if (existing) {
    return db.appUser.update({
      where: { id: existing.id },
      data: {
        ...profileFields,
        ...update,
      },
      include: agencyInclude,
    });
  }

  if (!createIfMissing) {
    return null;
  }

  return db.appUser.create({
    data: {
      ...profileFields,
      role: "PROVIDER",
      ...create,
    },
    include: agencyInclude,
  });
}
