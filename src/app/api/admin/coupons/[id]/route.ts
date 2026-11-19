import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-api";
const patchSchema = z.object({ active: z.boolean().optional(), description: z.string().trim().max(160).nullable().optional(), expiresAt: z.string().datetime().nullable().optional(), usageLimit: z.number().int().positive().nullable().optional() });
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(); if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { const { id } = await context.params; const data = patchSchema.parse(await request.json());
    const coupon = await prisma.coupon.update({ where: { id }, data: { ...data, ...(data.expiresAt !== undefined ? { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null } : {}) } });
    return NextResponse.json({ coupon });
  } catch { return NextResponse.json({ error: "Unable to update coupon." }, { status: 400 }); }
}
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(); if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { const { id } = await context.params; await prisma.coupon.delete({ where: { id } }); return NextResponse.json({ success: true }); }
  catch { return NextResponse.json({ error: "Unable to delete coupon." }, { status: 400 }); }
}
