-- CreateTable
CREATE TABLE "ProviderProgram" (
    "id" TEXT NOT NULL,
    "stateProviderId" TEXT NOT NULL,
    "programName" TEXT NOT NULL,
    "providerType" "ProviderType" NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "licensingRegion" TEXT NOT NULL,
    "subsidyRegion" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderProgram_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderProgram_stateProviderId_key" ON "ProviderProgram"("stateProviderId");

-- CreateIndex
CREATE INDEX "ProviderProgram_programName_idx" ON "ProviderProgram"("programName");

-- CreateIndex
CREATE INDEX "ProviderProgram_city_idx" ON "ProviderProgram"("city");

-- CreateIndex
CREATE INDEX "ProviderProgram_region_idx" ON "ProviderProgram"("region");
