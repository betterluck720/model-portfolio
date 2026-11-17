CREATE TABLE "Coupon" (
  "id" TEXT NOT NULL, "code" TEXT NOT NULL, "description" TEXT,
  "discountType" TEXT NOT NULL DEFAULT 'PERCENT', "discountValue" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD', "minOrderCents" INTEGER NOT NULL DEFAULT 0,
  "maxDiscountCents" INTEGER, "usageLimit" INTEGER, "usageCount" INTEGER NOT NULL DEFAULT 0,
  "startsAt" TIMESTAMP(3), "expiresAt" TIMESTAMP(3), "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");
CREATE INDEX "Coupon_active_expiresAt_idx" ON "Coupon"("active", "expiresAt");
