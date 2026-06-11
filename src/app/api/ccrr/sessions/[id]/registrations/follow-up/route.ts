import { ApiError } from "@/lib/api/errors";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { requireAgencyAccess, requireRole } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db";
import { sendSessionFollowUp } from "@/lib/email/send";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(["CCRR_STAFF", "EEC_ADMIN"]);
    const { id } = await context.params;

    const session = await prisma.orientationSession.findUnique({
      where: { id },
    });

    if (!session) {
      throw ApiError.notFound("Session not found");
    }

    // CCR&R staff can only email their own agency's sessions; EEC admins any.
    await requireAgencyAccess(session.agencyId);

    const registrations = await prisma.registration.findMany({
      where: { sessionId: id, status: { not: "CANCELLED" } },
    });

    const sessionInfo = {
      title: session.title,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      locationName: session.locationName,
      address: session.address,
      meetingUrl: session.meetingUrl,
    };

    const results = await Promise.allSettled(
      registrations.map((r) =>
        sendSessionFollowUp({
          to: r.contactEmail,
          providerName: r.providerName,
          session: sessionInfo,
        }),
      ),
    );

    // Stamp followUpSentAt only on the ones that actually sent.
    const sentIds = registrations
      .filter((_, i) => results[i].status === "fulfilled")
      .map((r) => r.id);

    if (sentIds.length > 0) {
      await prisma.registration.updateMany({
        where: { id: { in: sentIds } },
        data: { followUpSentAt: new Date() },
      });
    }

    const failed = results.length - sentIds.length;

    return jsonSuccess({
      total: registrations.length,
      sent: sentIds.length,
      failed,
    });
  } catch (error) {
    return handleApiError(error);
  }
}