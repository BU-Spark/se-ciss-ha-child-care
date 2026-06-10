import { auth, currentUser } from "@clerk/nextjs/server";
import { ProviderType } from "@prisma/client";
import { z } from "zod";

import { ApiError } from "@/lib/api/errors";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { isSupportedLanguage } from "@/lib/languages";
import { prisma } from "@/lib/db";
import { activeRegistrationStatusFilter } from "@/lib/registration-status";

const registrationSchema = z.object({
  sessionId: z.string().min(1),
  providerName: z.string().min(1),
  organizationName: z.string().min(1),
  contactEmail: z.string().email(),
  phone: z.string().optional(),
  stateProviderId: z.string().optional(),
  providerType: z
    .enum([
      ProviderType.CENTER_BASED,
      ProviderType.FAMILY_CHILD_CARE,
      ProviderType.SCHOOL_AGE,
      ProviderType.OTHER,
      ProviderType.UNKNOWN,
    ])
    .default(ProviderType.UNKNOWN),
  preferredLanguage: z.string().min(2).max(10).optional(),
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw ApiError.unauthorized();
    }

    const body = registrationSchema.safeParse(await request.json());

    if (!body.success) {
      throw ApiError.badRequest("Invalid registration request", "INVALID_BODY");
    }

    const clerkUser = await currentUser();
    const primaryEmail =
      clerkUser?.primaryEmailAddress?.emailAddress ?? body.data.contactEmail;
    const stateProviderId = body.data.stateProviderId?.trim();
    const preferredLanguage =
      body.data.preferredLanguage && isSupportedLanguage(body.data.preferredLanguage)
        ? body.data.preferredLanguage
        : undefined;

    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.orientationSession.findUnique({
        where: { id: body.data.sessionId },
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

      if (!session || session.status !== "PUBLISHED") {
        throw ApiError.notFound("Session not found");
      }

      if (session.startsAt <= new Date()) {
        throw ApiError.badRequest(
          "Registration is closed for this session",
          "REGISTRATION_CLOSED",
        );
      }

      const existingStaffProfile = await tx.staffUser.findUnique({
        where: { clerkUserId: userId },
      });

      if (existingStaffProfile) {
        throw ApiError.forbidden("Staff accounts cannot register as providers");
      }

      const appUser = await tx.appUser.upsert({
        where: { clerkUserId: userId },
        update: {
          email: primaryEmail,
          firstName: clerkUser?.firstName,
          lastName: clerkUser?.lastName,
          providerName: body.data.providerName,
          organizationName: body.data.organizationName,
          phone: body.data.phone,
          providerType: body.data.providerType,
          ...(preferredLanguage ? { preferredLanguage } : {}),
          ...(stateProviderId ? { stateProviderId } : {}),
        },
        create: {
          clerkUserId: userId,
          email: primaryEmail,
          firstName: clerkUser?.firstName,
          lastName: clerkUser?.lastName,
          role: "PROVIDER",
          providerName: body.data.providerName,
          organizationName: body.data.organizationName,
          phone: body.data.phone,
          providerType: body.data.providerType,
          preferredLanguage: preferredLanguage ?? "en",
          ...(stateProviderId ? { stateProviderId } : {}),
        },
      });

      const existingRegistration = await tx.registration.findFirst({
        where: {
          sessionId: session.id,
          userId: appUser.id,
          status: { not: "CANCELLED" },
        },
      });

      if (existingRegistration) {
        throw ApiError.conflict(
          "You are already registered for this session",
          "DUPLICATE_REGISTRATION",
        );
      }

      const registeredCount = await tx.registration.count({
        where: {
          sessionId: session.id,
          ...activeRegistrationStatusFilter,
        },
      });
      const capacity = session.capacity ?? 0;

      if (capacity > 0 && registeredCount >= capacity) {
        throw ApiError.conflict("This session is full", "SESSION_FULL");
      }

      const registration = await tx.registration.create({
        data: {
          sessionId: session.id,
          userId: appUser.id,
          providerName: body.data.providerName,
          organizationName: body.data.organizationName,
          contactEmail: body.data.contactEmail,
          phone: body.data.phone,
          providerType: body.data.providerType,
          preferredLanguage: preferredLanguage ?? appUser.preferredLanguage,
          status: "REGISTERED",
          attendanceStatus: "NOT_MARKED",
        },
      });

      return {
        registration,
        session,
        registeredCount: registeredCount + 1,
      };
    });

    const capacity = result.session.capacity ?? 0;

    return jsonSuccess(
      {
        registration: {
          id: result.registration.id,
          status: result.registration.status,
          attendanceStatus: result.registration.attendanceStatus,
          providerName: result.registration.providerName,
          organizationName: result.registration.organizationName,
          contactEmail: result.registration.contactEmail,
          createdAt: result.registration.createdAt.toISOString(),
        },
        session: {
          id: result.session.id,
          title: result.session.title,
          startsAt: result.session.startsAt.toISOString(),
          endsAt: result.session.endsAt.toISOString(),
          format: result.session.format,
          agency: result.session.agency,
        },
        spotsLeft:
          capacity > 0 ? Math.max(capacity - result.registeredCount, 0) : null,
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
