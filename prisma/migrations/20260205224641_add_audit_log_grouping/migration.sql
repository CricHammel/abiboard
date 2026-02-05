-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "count" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Set updatedAt to createdAt for existing records
UPDATE "audit_logs" SET "updatedAt" = "createdAt";

-- CreateIndex
CREATE INDEX "audit_logs_updatedAt_idx" ON "audit_logs"("updatedAt");
