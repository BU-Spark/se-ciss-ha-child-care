import { ApiError } from "@/lib/api/errors";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { requireAppUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db";
import { sendRegistrationConfirmation } from "@/lib/email/send";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAppUser();
    const { id } = await context.params;

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { session: true },
    });

    if (!registration) {
      throw ApiError.notFound("Registration not found");
    }

    // A provider can only trigger confirmations for their own registration.
    if (registration.userId !== user.id) {
      throw ApiError.forbidden(
        "You can only send confirmations for your own registrations",
      );
    }

    await sendRegistrationConfirmation({
      to: registration.contactEmail,
      providerName: registration.providerName,
      session: {
        title: registration.session.title,
        startsAt: registration.session.startsAt,
        endsAt: registration.session.endsAt,
        locationName: registration.session.locationName,
        address: registration.session.address,
        meetingUrl: registration.session.meetingUrl,
      },
    });

    return jsonSuccess({ sent: true });
  } catch (error) {
    return handleApiError(error);
  }
}