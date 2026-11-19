import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();
    const take = Math.min(Math.max(Number(url.searchParams.get("take") || 250), 1), 500);
    const payments = await prisma.payment.findMany({
      where: { payerEmail: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 5000,
      select: {
        id: true, payerName: true, payerEmail: true, amountCents: true, currency: true,
        status: true, paymentMethod: true, createdAt: true, capturedAt: true,
        refundedAt: true, refundAmountCents: true,
        media: { select: { id: true, title: true, type: true, thumbnail: true } },
      },
    });

    type CustomerSummary = {
      email: string;
      name: string | null;
      payments: typeof payments;
      totalSpentCents: number;
      refundedCents: number;
      completedCount: number;
    };

    const grouped = new Map<string, CustomerSummary>();
    for (const payment of payments) {
      const email = payment.payerEmail?.trim().toLowerCase();
      if (!email) continue;
      let customer = grouped.get(email);
      if (!customer) {
        customer = { email, name: payment.payerName, payments: [], totalSpentCents: 0, refundedCents: 0, completedCount: 0 };
        grouped.set(email, customer);
      }
      if (!customer.name && payment.payerName) customer.name = payment.payerName;
      customer.payments.push(payment);
      if (payment.status === "COMPLETED") {
        customer.totalSpentCents += payment.amountCents;
        customer.completedCount += 1;
      }
      if (payment.status === "REFUNDED") customer.refundedCents += payment.refundAmountCents ?? payment.amountCents;
    }

    const all = [...grouped.values()];
    const filtered = q ? all.filter((customer) =>
      customer.email.includes(q) || (customer.name || "").toLowerCase().includes(q) ||
      customer.payments.some((payment) => (payment.media.title || "").toLowerCase().includes(q))
    ) : all;
    filtered.sort((a, b) => b.totalSpentCents - a.totalSpentCents || b.payments[0].createdAt.getTime() - a.payments[0].createdAt.getTime());
    const loyalty = (customer: Pick<CustomerSummary, "totalSpentCents" | "refundedCents">) => {
      const netSpendCents = Math.max(0, customer.totalSpentCents - customer.refundedCents);
      const points = Math.floor(netSpendCents / 100);
      const tiers = [
        { name: "Bronze", threshold: 0, reward: "Welcome recognition" },
        { name: "Silver", threshold: 250, reward: "Eligible for a $5 loyalty reward" },
        { name: "Gold", threshold: 750, reward: "Eligible for a $15 loyalty reward" },
        { name: "Platinum", threshold: 1500, reward: "Eligible for a $30 loyalty reward" },
      ];
      const index = tiers.reduce((found, tier, i) => points >= tier.threshold ? i : found, 0);
      const current = tiers[index];
      const next = tiers[index + 1] ?? null;
      return { points, tier: current.name, reward: current.reward, nextTier: next?.name ?? null, pointsToNextTier: next ? Math.max(0, next.threshold - points) : 0 };
    };
    const customers = filtered.slice(0, take).map(({ payments: customerPayments, ...customer }) => ({
      ...customer,
      ...loyalty(customer),
      lastPurchaseAt: customerPayments[0]?.createdAt ?? null,
      payments: customerPayments.slice(0, 30),
    }));
    const tierCounts = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
    for (const customer of all) tierCounts[loyalty(customer).tier.toLowerCase() as keyof typeof tierCounts] += 1;
    const summary = {
      customers: all.length,
      payingCustomers: all.filter((customer) => customer.completedCount > 0).length,
      lifetimeRevenueCents: all.reduce((sum, customer) => sum + customer.totalSpentCents - customer.refundedCents, 0),
      repeatCustomers: all.filter((customer) => customer.completedCount > 1).length,
      tierCounts,
      totalPointsIssued: all.reduce((sum, customer) => sum + loyalty(customer).points, 0),
      rewardEligibleCustomers: all.filter((customer) => loyalty(customer).points >= 250).length,
    };
    return NextResponse.json({ customers, summary, total: filtered.length });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === "UNAUTHORIZED";
    console.error("Admin customers failed:", error);
    return NextResponse.json({ error: unauthorized ? "Unauthorized" : "Unable to load customers." }, { status: unauthorized ? 401 : 500 });
  }
}
