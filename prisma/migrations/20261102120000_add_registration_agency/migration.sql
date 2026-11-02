-- OrientationSession.agencyId is the hosting CCRR. This optional relation
-- identifies the CCRR that completed a staff-assisted registration.
ALTER TABLE "Registration"
  ADD COLUMN IF NOT EXISTS "registrationAgencyId" TEXT;

CREATE INDEX IF NOT EXISTS "Registration_registrationAgencyId_idx"
  ON "Registration"("registrationAgencyId");

ALTER TABLE "Registration"
  ADD CONSTRAINT "Registration_registrationAgencyId_fkey"
  FOREIGN KEY ("registrationAgencyId") REFERENCES "CcrrAgency"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
