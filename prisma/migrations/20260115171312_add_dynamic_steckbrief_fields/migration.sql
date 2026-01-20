-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'TEXTAREA', 'SINGLE_IMAGE', 'MULTI_IMAGE');

-- CreateTable
CREATE TABLE "steckbrief_fields" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "FieldType" NOT NULL,
    "label" TEXT NOT NULL,
    "placeholder" TEXT,
    "maxLength" INTEGER,
    "maxFiles" INTEGER DEFAULT 3,
    "rows" INTEGER DEFAULT 4,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "steckbrief_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "steckbrief_values" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "textValue" TEXT,
    "imageValue" TEXT,
    "imagesValue" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "steckbrief_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "steckbrief_fields_key_key" ON "steckbrief_fields"("key");

-- CreateIndex
CREATE UNIQUE INDEX "steckbrief_values_profileId_fieldId_key" ON "steckbrief_values"("profileId", "fieldId");

-- AddForeignKey
ALTER TABLE "steckbrief_values" ADD CONSTRAINT "steckbrief_values_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "steckbrief_values" ADD CONSTRAINT "steckbrief_values_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "steckbrief_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
