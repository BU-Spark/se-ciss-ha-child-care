ALTER TABLE "Registration"
  ADD COLUMN IF NOT EXISTS "confirmationSentAt" TIMESTAMP(3);
