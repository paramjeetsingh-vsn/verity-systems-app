-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "documentNumber" TEXT,
ADD COLUMN     "typeId" TEXT;

-- CreateTable
CREATE TABLE "DocumentType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSequence" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentType_tenantId_idx" ON "DocumentType"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentType_tenantId_name_key" ON "DocumentType"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSequence_tenantId_year_key" ON "DocumentSequence"("tenantId", "year");

-- CreateIndex
CREATE INDEX "Document_tenantId_typeId_idx" ON "Document"("tenantId", "typeId");

-- CreateIndex
CREATE INDEX "Document_tenantId_expiryDate_idx" ON "Document"("tenantId", "expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "Document_tenantId_documentNumber_key" ON "Document"("tenantId", "documentNumber");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "DocumentType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentType" ADD CONSTRAINT "DocumentType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSequence" ADD CONSTRAINT "DocumentSequence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
