-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PROVIDER', 'CCRR_STAFF', 'EEC_ADMIN');

-- CreateEnum
CREATE TYPE "SessionFormat" AS ENUM ('VIRTUAL', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('CENTER_BASED', 'FAMILY_CHILD_CARE', 'SCHOOL_AGE', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('REGISTERED', 'CANCELLED', 'WAITLISTED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('NOT_MARKED', 'ATTENDED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "agencies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_users" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'PROVIDER',
    "agencyId" TEXT,
    "providerName" TEXT,
    "organizationName" TEXT,
    "phone" TEXT,
    "providerType" "ProviderType" NOT NULL DEFAULT 'UNKNOWN',
    "stateProviderId" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "accessibilityNeeds" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orientation_sessions" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "region" TEXT NOT NULL,
    "format" "SessionFormat" NOT NULL DEFAULT 'VIRTUAL',
    "status" "SessionStatus" NOT NULL DEFAULT 'PUBLISHED',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 25,
    "locationName" TEXT,
    "address" TEXT,
    "meetingUrl" TEXT,
    "meetingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orientation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "organizationName" TEXT,
    "contactEmail" TEXT NOT NULL,
    "phone" TEXT,
    "providerType" "ProviderType" NOT NULL DEFAULT 'UNKNOWN',
    "status" "RegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
    "attendanceStatus" "AttendanceStatus" NOT NULL DEFAULT 'NOT_MARKED',
    "completedAt" TIMESTAMP(3),
    "checkedInAt" TIMESTAMP(3),
    "followUpSentAt" TIMESTAMP(3),
    "reminderSentAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agencies_name_region_key" ON "agencies"("name", "region");

-- CreateIndex
CREATE UNIQUE INDEX "app_users_clerkUserId_key" ON "app_users"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "app_users_email_key" ON "app_users"("email");

-- CreateIndex
CREATE INDEX "app_users_agencyId_idx" ON "app_users"("agencyId");

-- CreateIndex
CREATE INDEX "app_users_role_idx" ON "app_users"("role");

-- CreateIndex
CREATE INDEX "orientation_sessions_agencyId_idx" ON "orientation_sessions"("agencyId");

-- CreateIndex
CREATE INDEX "orientation_sessions_region_idx" ON "orientation_sessions"("region");

-- CreateIndex
CREATE INDEX "orientation_sessions_startsAt_idx" ON "orientation_sessions"("startsAt");

-- CreateIndex
CREATE INDEX "orientation_sessions_format_idx" ON "orientation_sessions"("format");

-- CreateIndex
CREATE INDEX "registrations_userId_idx" ON "registrations"("userId");

-- CreateIndex
CREATE INDEX "registrations_sessionId_idx" ON "registrations"("sessionId");

-- CreateIndex
CREATE INDEX "registrations_status_idx" ON "registrations"("status");

-- CreateIndex
CREATE INDEX "registrations_attendanceStatus_idx" ON "registrations"("attendanceStatus");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_sessionId_userId_key" ON "registrations"("sessionId", "userId");

-- AddForeignKey
ALTER TABLE "app_users" ADD CONSTRAINT "app_users_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orientation_sessions" ADD CONSTRAINT "orientation_sessions_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "orientation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

