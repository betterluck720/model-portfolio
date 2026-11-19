import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";
const schema = z.object({
  code: z.string().trim().min(3).max(32).regex(/^[A-Za-z0-9_-]+$/),
  description: z.string().trim().max(160).optional().nullable(),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discountValue: z.number().int().min(1).max(1000000),
  minOrderCents: z.number().int().min(0).default(0),
  maxDiscountCents: z.number().int().positive().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  active: z.boolean().default(true),
}).refine(v => v.discountType !== "PERCENT" || v.discountValue <= 100, { message: "Percentage cannot exceed 100%." });

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ coupons });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const input = schema.parse(await request.json());
    if (input.startsAt && input.expiresAt && new Date(input.expiresAt) <= new Date(input.startsAt)) {
      return NextResponse.json({ error: "Expiry must be later than the start date." }, { status: 400 });
    }
    const coupon = await prisma.coupon.create({ data: {
      ...input, code: input.code.toUpperCase(),
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    } });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("Unique constraint") ? "That coupon code already exists." : "Invalid coupon details.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
