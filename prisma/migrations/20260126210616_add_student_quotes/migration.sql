-- CreateTable
CREATE TABLE "student_quotes" (
    "id" TEXT NOT NULL,
    "text" VARCHAR(500) NOT NULL,
    "studentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_quotes_studentId_idx" ON "student_quotes"("studentId");

-- CreateIndex
CREATE INDEX "student_quotes_userId_idx" ON "student_quotes"("userId");

-- AddForeignKey
ALTER TABLE "student_quotes" ADD CONSTRAINT "student_quotes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_quotes" ADD CONSTRAINT "student_quotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
