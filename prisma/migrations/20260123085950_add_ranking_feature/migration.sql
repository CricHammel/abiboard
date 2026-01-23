-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "Salutation" AS ENUM ('HERR', 'FRAU');

-- CreateEnum
CREATE TYPE "GenderTarget" AS ENUM ('MALE', 'FEMALE', 'ALL');

-- CreateEnum
CREATE TYPE "RankingQuestionType" AS ENUM ('STUDENT', 'TEACHER');

-- CreateEnum
CREATE TYPE "RankingStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "gender" "Gender";

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "salutation" "Salutation" NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT NOT NULL,
    "subject" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_questions" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" "RankingQuestionType" NOT NULL,
    "genderSpecific" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ranking_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_votes" (
    "id" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "genderTarget" "GenderTarget" NOT NULL DEFAULT 'ALL',
    "studentId" TEXT,
    "teacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ranking_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_submissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RankingStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ranking_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ranking_votes_voterId_questionId_genderTarget_key" ON "ranking_votes"("voterId", "questionId", "genderTarget");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_submissions_userId_key" ON "ranking_submissions"("userId");

-- AddForeignKey
ALTER TABLE "ranking_votes" ADD CONSTRAINT "ranking_votes_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_votes" ADD CONSTRAINT "ranking_votes_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ranking_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_votes" ADD CONSTRAINT "ranking_votes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_votes" ADD CONSTRAINT "ranking_votes_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_submissions" ADD CONSTRAINT "ranking_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
