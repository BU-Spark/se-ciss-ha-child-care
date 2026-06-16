-- AlterTable
ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS "stateProviderId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Registration_stateProviderId_idx" ON "Registration"("stateProviderId");
