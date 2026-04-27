-- Admin panel architecture upgrade

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'Role' AND e.enumlabel = 'STAFF'
  ) THEN
    ALTER TYPE "Role" ADD VALUE 'STAFF';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'Role' AND e.enumlabel = 'SUPER_ADMIN'
  ) THEN
    ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';
  END IF;
END$$;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "refreshTokenVersion" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "salePrice" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "gender" TEXT,
  ADD COLUMN IF NOT EXISTS "movement" TEXT,
  ADD COLUMN IF NOT EXISTS "strapMaterial" TEXT,
  ADD COLUMN IF NOT EXISTS "caseMaterial" TEXT,
  ADD COLUMN IF NOT EXISTS "waterResistance" TEXT,
  ADD COLUMN IF NOT EXISTS "warranty" TEXT,
  ADD COLUMN IF NOT EXISTS "metaTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "metaDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

UPDATE "Product"
SET "isPublished" = true
WHERE "publishedAt" IS NOT NULL;

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "customerFirstName" TEXT,
  ADD COLUMN IF NOT EXISTS "customerLastName" TEXT,
  ADD COLUMN IF NOT EXISTS "customerEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "customerPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "shippingAddress" JSONB,
  ADD COLUMN IF NOT EXISTS "notes" TEXT;

CREATE TABLE IF NOT EXISTS "RefreshToken" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "RefreshToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Setting" (
  "id" SERIAL PRIMARY KEY,
  "storeName" TEXT NOT NULL DEFAULT 'FWC Store',
  "contactInfo" JSONB,
  "whatsappNumber" TEXT,
  "email" TEXT,
  "shippingConfig" JSONB,
  "taxConfig" JSONB,
  "homepageBanners" JSONB,
  "socialLinks" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Coupon" (
  "id" SERIAL PRIMARY KEY,
  "code" TEXT NOT NULL,
  "description" TEXT,
  "discountPercent" INTEGER,
  "discountAmount" DECIMAL(12,2),
  "minOrderAmount" DECIMAL(12,2),
  "maxDiscount" DECIMAL(12,2),
  "usageLimit" INTEGER,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "startsAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Coupon_code_key" ON "Coupon"("code");
CREATE INDEX IF NOT EXISTS "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX IF NOT EXISTS "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");
CREATE INDEX IF NOT EXISTS "Coupon_isActive_idx" ON "Coupon"("isActive");
CREATE INDEX IF NOT EXISTS "Coupon_expiresAt_idx" ON "Coupon"("expiresAt");
CREATE INDEX IF NOT EXISTS "Product_isPublished_idx" ON "Product"("isPublished");
CREATE INDEX IF NOT EXISTS "Product_deletedAt_idx" ON "Product"("deletedAt");
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");
