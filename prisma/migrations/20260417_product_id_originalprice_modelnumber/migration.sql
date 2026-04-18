-- Rename comparePrice to originalPrice and add modelNumber for products.
ALTER TABLE "Product"
RENAME COLUMN "comparePrice" TO "originalPrice";

ALTER TABLE "Product"
ADD COLUMN "modelNumber" TEXT;

UPDATE "Product"
SET "modelNumber" = "sku"
WHERE "modelNumber" IS NULL;

ALTER TABLE "Product"
ALTER COLUMN "modelNumber" SET NOT NULL;

CREATE INDEX "Product_modelNumber_idx" ON "Product"("modelNumber");
