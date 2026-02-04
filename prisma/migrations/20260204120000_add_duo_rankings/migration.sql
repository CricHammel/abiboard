-- CreateEnum
CREATE TYPE "AnswerMode" AS ENUM ('SINGLE', 'GENDER_SPECIFIC', 'DUO');

-- AlterTable: Add answerMode column with default
ALTER TABLE "ranking_questions" ADD COLUMN "answerMode" "AnswerMode" NOT NULL DEFAULT 'SINGLE';

-- Migrate existing data: genderSpecific=true -> GENDER_SPECIFIC, genderSpecific=false -> SINGLE
UPDATE "ranking_questions" SET "answerMode" = 'GENDER_SPECIFIC' WHERE "genderSpecific" = true;
UPDATE "ranking_questions" SET "answerMode" = 'SINGLE' WHERE "genderSpecific" = false;

-- Drop the old genderSpecific column
ALTER TABLE "ranking_questions" DROP COLUMN "genderSpecific";

-- AlterTable: Add studentId2 and teacherId2 for Duo mode
ALTER TABLE "ranking_votes" ADD COLUMN "studentId2" TEXT;
ALTER TABLE "ranking_votes" ADD COLUMN "teacherId2" TEXT;

-- AddForeignKey
ALTER TABLE "ranking_votes" ADD CONSTRAINT "ranking_votes_studentId2_fkey" FOREIGN KEY ("studentId2") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_votes" ADD CONSTRAINT "ranking_votes_teacherId2_fkey" FOREIGN KEY ("teacherId2") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
