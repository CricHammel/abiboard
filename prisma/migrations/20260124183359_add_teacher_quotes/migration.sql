-- CreateTable
CREATE TABLE "teacher_quotes" (
    "id" TEXT NOT NULL,
    "text" VARCHAR(500) NOT NULL,
    "teacherId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teacher_quotes_teacherId_idx" ON "teacher_quotes"("teacherId");

-- CreateIndex
CREATE INDEX "teacher_quotes_userId_idx" ON "teacher_quotes"("userId");

-- AddForeignKey
ALTER TABLE "teacher_quotes" ADD CONSTRAINT "teacher_quotes_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_quotes" ADD CONSTRAINT "teacher_quotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
