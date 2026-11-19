import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
const schema = z.object({ code: z.string().trim().min(1).max(32), subtotalCents: z.number().int().positive(), currency: z.string().length(3).default("USD") });
export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const coupon = await prisma.coupon.findUnique({ where: { code: input.code.toUpperCase() } });
    const now = new Date();
    if (!coupon || !coupon.active || (coupon.startsAt && coupon.startsAt > now) || (coupon.expiresAt && coupon.expiresAt < now) || (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) || coupon.currency !== input.currency.toUpperCase() || input.subtotalCents < coupon.minOrderCents) {
      return NextResponse.json({ valid: false, error: "This coupon is invalid or not currently available." }, { status: 400 });
    }
    const rawDiscount = coupon.discountType === "PERCENT" ? Math.floor(input.subtotalCents * coupon.discountValue / 100) : coupon.discountValue;
    const discountCents = Math.min(input.subtotalCents, coupon.maxDiscountCents ?? rawDiscount, rawDiscount);
    return NextResponse.json({ valid: true, code: coupon.code, discountCents, totalCents: input.subtotalCents - discountCents, description: coupon.description });
  } catch { return NextResponse.json({ valid: false, error: "Invalid coupon request." }, { status: 400 }); }
}
