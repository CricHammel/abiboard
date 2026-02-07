-- CreateTable
CREATE TABLE "student_activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityName" TEXT,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_activities_createdAt_idx" ON "student_activities"("createdAt");

-- CreateIndex
CREATE INDEX "student_activities_updatedAt_idx" ON "student_activities"("updatedAt");

-- AddForeignKey
ALTER TABLE "student_activities" ADD CONSTRAINT "student_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
