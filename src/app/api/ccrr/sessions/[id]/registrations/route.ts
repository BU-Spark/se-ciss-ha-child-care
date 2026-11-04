import { RegistrationStatus } from "@prisma/client";
import { after } from "next/server";
import { z } from "zod";

import { ApiError } from "@/lib/api/errors";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import {
  requireCcrrAgencyId,
  requireRole,
} from "@/lib/auth/require-user";
import { prisma } from "@/lib/db";
import { sendRegistrationConfirmationEmail } from "@/lib/registration-confirmation-email";
import { rosterRegistrationStatusFilter } from "@/lib/registration-status";

const staffRegistrationSchema = z.object({
  providerName: z.string().trim().min(1),
  contactEmail: z.string().trim().email(),
  phone: z.string().trim().optional(),
  stateProviderId: z.string().trim().min(1),
  preferredLanguage: z.string().trim().min(2).max(10).optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const profile = await requireRole(["CCRR_STAFF", "EEC_ADMIN"]);
    const { id } = await context.params;

    const session = await prisma.orientationSession.findUnique({
      where: { id },
      include: {
        agency: { select: { id: true, name: true, region: true } },
        registrations: {
          where: rosterRegistrationStatusFilter,
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            providerName: true,
            organizationName: true,
            stateProviderId: true,
            contactEmail: true,
            phone: true,
            status: true,
            attendanceStatus: true,
            notes: true,
            createdAt: true,
            checkedInAt: true,
            registrationAgency: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!session) {
      throw ApiError.notFound("Session not found");
    }

    const canManageAttendance =
      profile.role === "EEC_ADMIN" || session.agencyId === profile.agencyId;

    return jsonSuccess({
      canManageAttendance,
      canAssistRegistration:
        profile.role === "CCRR_STAFF" &&
        session.agencyId === profile.agencyId &&
        session.status === "PUBLISHED",
      session: {
        id: session.id,
        title: session.title,
        description: session.description,
        region: session.region,
        format: session.format,
        status: session.status,
        startsAt: session.startsAt.toISOString(),
        endsAt: session.endsAt.toISOString(),
        capacity: session.capacity ?? 0,
        locationName: session.locationName,
        address: session.address,
        meetingUrl: session.meetingUrl,
        agency: session.agency,
        registeredCount: session.registrations.length,
      },
      registrations: session.registrations.map((r) => ({
        id: r.id,
        providerName: r.providerName,
        organizationName: r.organizationName,
        stateProviderId: r.stateProviderId,
        contactEmail: r.contactEmail,
        phone: r.phone,
        status: r.status,
        attendanceStatus: r.attendanceStatus,
        notes: r.notes,
        registeredAt: r.createdAt.toISOString(),
        checkedInAt: r.checkedInAt?.toISOString() ?? null,
        registrationAgency: r.registrationAgency,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const profile = await requireRole(["CCRR_STAFF"]);
    const registrationAgencyId = requireCcrrAgencyId(profile);
    const { id: sessionId } = await context.params;
    const body = staffRegistrationSchema.safeParse(await request.json());

    if (!body.success) {
      throw ApiError.badRequest("Enter a valid provider registration", "INVALID_BODY");
    }

    const result = await prisma.$transaction(async (tx) => {
      const [session, program] = await Promise.all([
        tx.orientationSession.findUnique({ where: { id: sessionId } }),
        tx.providerProgram.findUnique({ where: { stateProviderId: body.data.stateProviderId } }),
      ]);

      if (!session || session.status !== "PUBLISHED") throw ApiError.notFound("Session not found");
      if (session.agencyId !== registrationAgencyId) {
        throw ApiError.forbidden(
          "You can only register providers for sessions hosted by your agency",
        );
      }
      if (session.startsAt <= new Date()) {
        throw ApiError.badRequest("Registration is closed for this session", "REGISTRATION_CLOSED");
      }
      if (!program || !program.isActive) {
        throw ApiError.badRequest("Program ID was not found in the active provider directory", "INVALID_PROGRAM_ID");
      }

      const existing = await tx.registration.findFirst({
        where: { sessionId, stateProviderId: program.stateProviderId, status: { not: RegistrationStatus.CANCELLED } },
      });
      if (existing) throw ApiError.conflict("This Program ID is already registered for this session", "DUPLICATE_REGISTRATION");

      const count = await tx.registration.count({ where: { sessionId, ...rosterRegistrationStatusFilter } });
      if ((session.capacity ?? 0) > 0 && count >= (session.capacity ?? 0)) {
        throw ApiError.conflict("This session is full", "SESSION_FULL");
      }

      const registration = await tx.registration.create({
        data: {
          sessionId,
          registrationAgencyId,
          providerName: body.data.providerName,
          organizationName: program.programName,
          contactEmail: body.data.contactEmail,
          phone: body.data.phone || null,
          providerType: program.providerType,
          stateProviderId: program.stateProviderId,
          preferredLanguage: body.data.preferredLanguage ?? "en",
          status: RegistrationStatus.REGISTERED,
          attendanceStatus: "NOT_MARKED",
        },
        include: { registrationAgency: { select: { id: true, name: true } } },
      });

      return { registration, session };
    });

    after(async () => {
      try {
        const registration = await prisma.registration.findUnique({
          where: { id: result.registration.id },
          select: { confirmationSentAt: true },
        });

        if (registration?.confirmationSentAt) return;

        await sendRegistrationConfirmationEmail({
          to: result.registration.contactEmail,
          providerName: result.registration.providerName,
          session: result.session,
        });

        await prisma.registration.update({
          where: { id: result.registration.id },
          data: { confirmationSentAt: new Date() },
        });
      } catch (emailError) {
        console.error("Staff-assisted registration confirmation email failed", emailError);
      }
    });

    return jsonSuccess({
      registration: {
        id: result.registration.id,
        providerName: result.registration.providerName,
        organizationName: result.registration.organizationName,
        stateProviderId: result.registration.stateProviderId,
        contactEmail: result.registration.contactEmail,
        attendanceStatus: result.registration.attendanceStatus,
        notes: result.registration.notes,
        registeredAt: result.registration.createdAt.toISOString(),
        registrationAgency: result.registration.registrationAgency,
      },
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
