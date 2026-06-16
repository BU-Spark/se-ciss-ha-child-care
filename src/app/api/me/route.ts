import { ApiError } from "@/lib/api/errors";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import {
  getCurrentProfile,
  provisionProviderProfile,
} from "@/lib/auth/current-profile";

function displayName(firstName: string | null, lastName: string | null) {
  const name = [firstName, lastName].filter(Boolean).join(" ");

  return name || null;
}

function serializeProfile(
  profile: Awaited<ReturnType<typeof getCurrentProfile>>,
) {
  if (profile.source === "STAFF_USER") {
    return {
      source: profile.source,
      role: profile.role,
      id: profile.user.id,
      clerkUserId: profile.user.clerkUserId,
      email: profile.user.email,
      name: profile.user.name,
      agency: profile.user.agency,
    };
  }

  return {
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
    preferredLanguage: profile.user.preferredLanguage,
  };
}

export async function GET(request: Request) {
  try {
    const autoProvision =
      new URL(request.url).searchParams.get("autoProvision") === "provider";

    let profile;

    try {
      profile = await getCurrentProfile();
    } catch (error) {
      if (
        autoProvision &&
        error instanceof ApiError &&
        error.code === "PROFILE_NOT_LINKED"
      ) {
        profile = await provisionProviderProfile();
      } else {
        throw error;
      }
    }

    return jsonSuccess({
      profile: serializeProfile(profile),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
