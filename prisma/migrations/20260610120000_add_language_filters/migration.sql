-- Add language columns. Supports both current PascalCase tables (production)
-- and legacy snake_case tables (shadow DB from older init migration).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'OrientationSession'
  ) THEN
    ALTER TABLE "OrientationSession"
      ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'en';

    CREATE INDEX IF NOT EXISTS "OrientationSession_language_idx"
      ON "OrientationSession"("language");
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orientation_sessions'
  ) THEN
    ALTER TABLE "orientation_sessions"
      ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'en';

    CREATE INDEX IF NOT EXISTS "orientation_sessions_language_idx"
      ON "orientation_sessions"("language");
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Registration'
  ) THEN
    ALTER TABLE "Registration"
      ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT NOT NULL DEFAULT 'en';

    CREATE INDEX IF NOT EXISTS "Registration_preferredLanguage_idx"
      ON "Registration"("preferredLanguage");
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'registrations'
  ) THEN
    ALTER TABLE "registrations"
      ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT NOT NULL DEFAULT 'en';

    CREATE INDEX IF NOT EXISTS "registrations_preferredLanguage_idx"
      ON "registrations"("preferredLanguage");
  END IF;
END $$;
