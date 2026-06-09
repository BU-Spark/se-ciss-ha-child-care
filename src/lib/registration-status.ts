import { RegistrationStatus } from "@prisma/client";

/** Registrations that occupy a session seat or appear on staff rosters. */
export const ACTIVE_REGISTRATION_STATUSES: RegistrationStatus[] = [
  RegistrationStatus.REGISTERED,
  RegistrationStatus.ATTENDED,
  RegistrationStatus.NO_SHOW,
  RegistrationStatus.WAITLISTED,
];

export const ROSTER_REGISTRATION_STATUSES: RegistrationStatus[] = [
  RegistrationStatus.REGISTERED,
  RegistrationStatus.ATTENDED,
  RegistrationStatus.NO_SHOW,
];

export const activeRegistrationStatusFilter = {
  status: { in: ACTIVE_REGISTRATION_STATUSES },
} as const;

export const rosterRegistrationStatusFilter = {
  status: { in: ROSTER_REGISTRATION_STATUSES },
} as const;
