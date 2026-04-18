-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isNewArrival" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "HeroBanner" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "imageUrl" TEXT NOT NULL,
    "targetUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroBanner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CelebrityLook" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CelebrityLook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CelebrityLookProduct" (
    "celebrityLookId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CelebrityLookProduct_pkey" PRIMARY KEY ("celebrityLookId","productId")
);

-- CreateIndex
CREATE INDEX "HeroBanner_isActive_publishedAt_sortOrder_idx" ON "HeroBanner"("isActive", "publishedAt", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CelebrityLook_slug_key" ON "CelebrityLook"("slug");

-- CreateIndex
CREATE INDEX "CelebrityLook_isActive_publishedAt_idx" ON "CelebrityLook"("isActive", "publishedAt");

-- CreateIndex
CREATE INDEX "CelebrityLookProduct_productId_idx" ON "CelebrityLookProduct"("productId");

-- CreateIndex
CREATE INDEX "CelebrityLookProduct_celebrityLookId_sortOrder_idx" ON "CelebrityLookProduct"("celebrityLookId", "sortOrder");

-- CreateIndex
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");

-- CreateIndex
CREATE INDEX "Product_isActive_isNewArrival_publishedAt_idx" ON "Product"("isActive", "isNewArrival", "publishedAt");

-- AddForeignKey
ALTER TABLE "CelebrityLookProduct" ADD CONSTRAINT "CelebrityLookProduct_celebrityLookId_fkey" FOREIGN KEY ("celebrityLookId") REFERENCES "CelebrityLook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CelebrityLookProduct" ADD CONSTRAINT "CelebrityLookProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
