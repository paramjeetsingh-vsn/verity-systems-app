-- AlterTable
ALTER TABLE "DocumentType" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedById" INTEGER;

-- CreateIndex
CREATE INDEX "DocumentType_tenantId_isActive_idx" ON "DocumentType"("tenantId", "isActive");
