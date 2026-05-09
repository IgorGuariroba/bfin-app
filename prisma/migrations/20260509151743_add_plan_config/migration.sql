-- CreateTable
CREATE TABLE "PlanConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "monthlyAmount" DOUBLE PRECISION NOT NULL DEFAULT 14.9,
    "annualAmount" DOUBLE PRECISION NOT NULL DEFAULT 119.9,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanConfig_pkey" PRIMARY KEY ("id")
);
