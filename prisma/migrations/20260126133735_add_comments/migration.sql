-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "text" VARCHAR(500) NOT NULL,
    "authorId" TEXT NOT NULL,
    "targetStudentId" TEXT,
    "targetTeacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comments_authorId_idx" ON "comments"("authorId");

-- CreateIndex
CREATE INDEX "comments_targetStudentId_idx" ON "comments"("targetStudentId");

-- CreateIndex
CREATE INDEX "comments_targetTeacherId_idx" ON "comments"("targetTeacherId");

-- CreateIndex
CREATE UNIQUE INDEX "comments_authorId_targetStudentId_key" ON "comments"("authorId", "targetStudentId");

-- CreateIndex
CREATE UNIQUE INDEX "comments_authorId_targetTeacherId_key" ON "comments"("authorId", "targetTeacherId");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_targetStudentId_fkey" FOREIGN KEY ("targetStudentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_targetTeacherId_fkey" FOREIGN KEY ("targetTeacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
