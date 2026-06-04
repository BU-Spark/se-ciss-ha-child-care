import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { getCurrentProfile } from "@/lib/auth/current-profile";

function displayName(firstName: string | null, lastName: string | null) {
  const name = [firstName, lastName].filter(Boolean).join(" ");

  return name || null;
}

export async function GET() {
  try {
    const profile = await getCurrentProfile();

    if (profile.source === "STAFF_USER") {
      return jsonSuccess({
        profile: {
          source: profile.source,
          role: profile.role,
          id: profile.user.id,
          clerkUserId: profile.user.clerkUserId,
          email: profile.user.email,
          name: profile.user.name,
          agency: profile.user.agency,
        },
      });
    }

    return jsonSuccess({
      profile: {
        source: profile.source,
        role: profile.role,
        id: profile.user.id,
        clerkUserId: profile.user.clerkUserId,
        email: profile.user.email,
        name:
          displayName(profile.user.firstName, profile.user.lastName) ??
          profile.user.providerName ??
          profile.user.organizationName ??
          profile.user.email,
        agency: profile.user.agency,
        providerName: profile.user.providerName,
        organizationName: profile.user.organizationName,
        phone: profile.user.phone,
        providerType: profile.user.providerType,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
