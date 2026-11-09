-- CreateEnum
CREATE TYPE "application_status" AS ENUM ('saved', 'applied', 'offer', 'rejected', 'withdrawn');

-- CreateTable
CREATE TABLE "job_applications" (
    "id" UUID NOT NULL,
    "position" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "status" "application_status" NOT NULL DEFAULT 'saved',
    "applied_at" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_applications_status_idx" ON "job_applications"("status");

-- CreateIndex
CREATE INDEX "job_applications_created_at_idx" ON "job_applications"("created_at");
