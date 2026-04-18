-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "bestSellerScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isBestSeller" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "ratingAverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "soldCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "viewsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wishlistCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Product_isActive_publishedAt_idx" ON "Product"("isActive", "publishedAt");

-- CreateIndex
CREATE INDEX "Product_isActive_publishedAt_stock_idx" ON "Product"("isActive", "publishedAt", "stock");

-- CreateIndex
CREATE INDEX "Product_isBestSeller_bestSellerScore_idx" ON "Product"("isBestSeller", "bestSellerScore");
