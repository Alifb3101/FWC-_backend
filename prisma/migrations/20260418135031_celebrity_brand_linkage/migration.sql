-- AlterTable
ALTER TABLE "CelebrityLook" ADD COLUMN     "brandId" INTEGER;

-- CreateIndex
CREATE INDEX "CelebrityLook_brandId_idx" ON "CelebrityLook"("brandId");

-- AddForeignKey
ALTER TABLE "CelebrityLook" ADD CONSTRAINT "CelebrityLook_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
