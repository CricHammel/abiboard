-- Convert any APPROVED profiles to SUBMITTED before removing the enum value
UPDATE "profiles" SET "status" = 'SUBMITTED' WHERE "status" = 'APPROVED';

-- Remove feedback column
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "feedback";

-- Remove APPROVED from ProfileStatus enum
-- PostgreSQL requires recreating the type
CREATE TYPE "ProfileStatus_new" AS ENUM ('DRAFT', 'SUBMITTED');
ALTER TABLE "profiles" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "profiles" ALTER COLUMN "status" TYPE "ProfileStatus_new" USING ("status"::text::"ProfileStatus_new");
ALTER TYPE "ProfileStatus" RENAME TO "ProfileStatus_old";
ALTER TYPE "ProfileStatus_new" RENAME TO "ProfileStatus";
DROP TYPE "ProfileStatus_old";
ALTER TABLE "profiles" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
