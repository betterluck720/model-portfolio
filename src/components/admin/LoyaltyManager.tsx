"use client";

import { useCallback, useEffect, useState } from "react";

type Customer = { email: string; name: string | null; points: number; tier: string; reward: string; nextTier: string | null; pointsToNextTier: number; completedCount: number; totalSpentCents: number; refundedCents: number };
type Data = { customers: Customer[]; summary: { customers: number; tierCounts: { bronze: number; silver: number; gold: number; platinum: number }; totalPointsIssued: number; rewardEligibleCustomers: number } };
const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
const tiers = [
  { name: "Bronze", points: "0–249", description: "Entry tier", color: "#a66b43" },
  { name: "Silver", points: "250–749", description: "$5 reward eligibility", color: "#8b929c" },
  { name: "Gold", points: "750–1,499", description: "$15 reward eligibility", color: "#b58a2a" },
  { name: "Platinum", points: "1,500+", description: "$30 reward eligibility", color: "#657d9d" },
];

export default function LoyaltyManager() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/admin/customers?take=500${query.trim() ? `&q=${encodeURIComponent(query.trim())}` : ""}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load loyalty data.");
      setData(result);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load loyalty data."); }
    finally { setLoading(false); }
  }, [query]);
  useEffect(() => { void load(); }, [load]);
  const summary = data?.summary;

  return <main className="admin-page" style={{ display: "grid", gap: 22 }}>
    <header><div className="admin-breadcrumb">Relationships /</div><h1 style={{ margin: "8px 0", fontSize: 30 }}>Customer loyalty</h1><p style={{ margin: 0, opacity: .7 }}>Reward customers based on completed purchases and net lifetime spend.</p></header>
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
      {[["Customers", summary?.customers ?? "—"], ["Points issued", summary?.totalPointsIssued?.toLocaleString() ?? "—"], ["Reward eligible", summary?.rewardEligibleCustomers ?? "—"]].map(([label, value]) => <div key={label} style={{ padding: 18, border: "1px solid var(--admin-border, #ddd)", borderRadius: 14 }}><div style={{ fontSize: 13, opacity: .65 }}>{label}</div><strong style={{ display: "block", fontSize: 25, marginTop: 8 }}>{value}</strong></div>)}
    </section>
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>
      {tiers.map((tier) => <article key={tier.name} style={{ padding: 18, border: "1px solid var(--admin-border, #ddd)", borderRadius: 14 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: 99, background: tier.color }} /><strong>{tier.name}</strong><span style={{ marginLeft: "auto", fontSize: 20, fontWeight: 700 }}>{summary?.tierCounts[tier.name.toLowerCase() as keyof typeof summary.tierCounts] ?? "—"}</span></div><p style={{ margin: "12px 0 4px", fontSize: 13, opacity: .7 }}>{tier.points} points</p><small style={{ opacity: .65 }}>{tier.description}</small></article>)}
    </section>
    <div style={{ padding: 16, border: "1px solid var(--admin-border, #ddd)", borderRadius: 12, fontSize: 13, lineHeight: 1.6 }}><strong>How points work</strong><br/>Customers earn 1 point per $1 of completed purchase value, after refunds. Silver begins at 250 points, Gold at 750, and Platinum at 1,500. Reward eligibility is informational: this release does not automatically issue coupon codes, apply discounts, or redeem rewards at checkout.</div>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><input aria-label="Search loyalty customers" placeholder="Search by customer name or email…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ flex: "1 1 280px", minHeight: 44, padding: "0 14px", border: "1px solid var(--admin-border, #ddd)", borderRadius: 10, background: "transparent", color: "inherit" }}/><button onClick={() => void load()} disabled={loading} style={{ padding: "10px 16px", border: "1px solid var(--admin-border, #ddd)", borderRadius: 9, background: "transparent", color: "inherit", cursor: "pointer" }}>Refresh</button></div>
    {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
    <section style={{ border: "1px solid var(--admin-border, #ddd)", borderRadius: 14, overflow: "hidden" }}><div style={{ padding: 14, borderBottom: "1px solid var(--admin-border, #ddd)" }}><strong>Loyalty members</strong></div>{loading ? <p style={{ padding: 18 }}>Loading loyalty members…</p> : !data?.customers.length ? <p style={{ padding: 18, opacity: .7 }}>No matching customers found.</p> : data.customers.map((customer) => <div key={customer.email} style={{ display: "grid", gridTemplateColumns: "minmax(180px,2fr) repeat(3,minmax(100px,1fr))", gap: 12, alignItems: "center", padding: 15, borderBottom: "1px solid var(--admin-border, #ddd)" }}><div style={{ minWidth: 0 }}><strong>{customer.name || "Customer"}</strong><div style={{ fontSize: 12, opacity: .65, overflowWrap: "anywhere" }}>{customer.email}</div></div><div><strong>{customer.tier}</strong><small style={{ display: "block", opacity: .65 }}>Tier</small></div><div><strong>{customer.points.toLocaleString()}</strong><small style={{ display: "block", opacity: .65 }}>Points</small></div><div><strong>{money(Math.max(0, customer.totalSpentCents - customer.refundedCents))}</strong><small style={{ display: "block", opacity: .65 }}>Net spend</small></div>{customer.nextTier && <div style={{ gridColumn: "1 / -1", fontSize: 12, opacity: .7 }}>{customer.pointsToNextTier} points to {customer.nextTier}</div>}</div>)}</section>
    <p style={{ fontSize: 12, opacity: .6 }}>Data is calculated from up to the 5,000 most recent payment records with payer emails. Points are derived and are not stored as a separate balance.</p>
  </main>;
}
