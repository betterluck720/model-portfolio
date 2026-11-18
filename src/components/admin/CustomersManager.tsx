"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Purchase = {
  id: string; amountCents: number; currency: string; status: string; paymentMethod: string;
  createdAt: string; capturedAt: string | null; refundedAt: string | null; refundAmountCents: number | null;
  media: { id: string; title: string | null; type: "IMAGE" | "VIDEO"; thumbnail: string | null };
};
type Customer = {
  email: string; name: string | null; totalSpentCents: number; refundedCents: number;
  completedCount: number; lastPurchaseAt: string | null; payments: Purchase[];
};
type Summary = { customers: number; payingCustomers: number; lifetimeRevenueCents: number; repeatCustomers: number };
const money = (cents: number, currency = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
const date = (value: string | null) => value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function CustomersManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState<Summary>({ customers: 0, payingCustomers: 0, lifetimeRevenueCents: 0, repeatCustomers: 0 });
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ take: "500" });
      if (query.trim()) params.set("q", query.trim());
      const response = await fetch(`/api/admin/customers?${params}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load customers.");
      setCustomers(data.customers || []); setSummary(data.summary); setTotal(data.total || 0);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load customers."); }
    finally { setLoading(false); }
  }, [query]);
  useEffect(() => { void load(); }, [load]);

  const average = useMemo(() => summary.payingCustomers ? summary.lifetimeRevenueCents / summary.payingCustomers : 0, [summary]);
  function exportCsv() {
    const rows = [["Name", "Email", "Completed purchases", "Net lifetime value", "Refunded", "Last purchase"], ...customers.map((c) => [c.name || "", c.email, String(c.completedCount), (c.totalSpentCents - c.refundedCents) / 100, c.refundedCents / 100, c.lastPurchaseAt || ""])];
    const csv = rows.map((row) => row.map((value) => { const text = String(value); const safe = /^[\s]*[=+@\-]/.test(text) ? `'${text}` : text; return `"${safe.replace(/"/g, '""')}"`; }).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  }

  return <div className="admin-page" style={{ display: "grid", gap: 22 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
      <div><div className="admin-breadcrumb">Relationships /</div><h1 style={{ margin: "8px 0", fontSize: 30 }}>Customers</h1><p style={{ margin: 0, opacity: .7 }}>Customer records are consolidated from payment email addresses and purchase history.</p></div>
      <button onClick={exportCsv} style={{ padding: "11px 16px", borderRadius: 9, border: "1px solid var(--admin-border, #ddd)", background: "transparent", color: "inherit", cursor: "pointer" }} disabled={!customers.length}>Export CSV</button>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
      {[["All customers", summary.customers.toLocaleString()], ["Paying customers", summary.payingCustomers.toLocaleString()], ["Net lifetime revenue", money(summary.lifetimeRevenueCents)], ["Repeat customers", summary.repeatCustomers.toLocaleString()]].map(([label, value]) => <div key={label} style={{ padding: 18, border: "1px solid var(--admin-border, #ddd)", borderRadius: 14 }}><div style={{ fontSize: 13, opacity: .65 }}>{label}</div><strong style={{ display: "block", fontSize: 24, marginTop: 8 }}>{value}</strong></div>)}
    </div>
    <div style={{ fontSize: 13, opacity: .7 }}>Average net value per paying customer: <strong>{money(average)}</strong></div>

    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <input aria-label="Search customers" placeholder="Search name, email, or purchased item…" value={query} onChange={(event) => setQuery(event.target.value)} style={{ flex: "1 1 280px", minHeight: 44, padding: "0 14px", border: "1px solid var(--admin-border, #ddd)", borderRadius: 10, background: "transparent", color: "inherit" }} />
      <button onClick={() => void load()} disabled={loading} style={{ padding: "11px 16px", borderRadius: 9, border: "1px solid var(--admin-border, #ddd)", background: "transparent", color: "inherit", cursor: "pointer" }}>Refresh</button>
    </div>
    {error && <div role="alert" style={{ padding: 14, borderRadius: 10, background: "#fee", color: "#900" }}>{error}</div>}
    <div style={{ border: "1px solid var(--admin-border, #ddd)", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: 14, borderBottom: "1px solid var(--admin-border, #ddd)", display: "flex", justifyContent: "space-between" }}><strong>Customer directory</strong><span style={{ opacity: .65, fontSize: 13 }}>{total} records</span></div>
      {loading ? <p style={{ padding: 20 }}>Loading customers…</p> : customers.length === 0 ? <p style={{ padding: 20, opacity: .7 }}>No customer payment records found.</p> : customers.map((customer) => <div key={customer.email} style={{ borderBottom: "1px solid var(--admin-border, #ddd)" }}>
        <button onClick={() => setExpanded(expanded === customer.email ? null : customer.email)} aria-expanded={expanded === customer.email} style={{ width: "100%", display: "grid", gridTemplateColumns: "minmax(180px,2fr) repeat(3,minmax(100px,1fr))", gap: 12, alignItems: "center", textAlign: "left", padding: 16, background: "transparent", border: 0, color: "inherit", cursor: "pointer" }}>
          <span style={{ minWidth: 0 }}><strong style={{ display: "block" }}>{customer.name || "Customer"}</strong><span style={{ opacity: .65, fontSize: 13, overflowWrap: "anywhere" }}>{customer.email}</span></span>
          <span><strong>{money(customer.totalSpentCents - customer.refundedCents)}</strong><small style={{ display: "block", opacity: .6 }}>Net spend</small></span>
          <span><strong>{customer.completedCount}</strong><small style={{ display: "block", opacity: .6 }}>Purchases</small></span>
          <span><strong>{date(customer.lastPurchaseAt)}</strong><small style={{ display: "block", opacity: .6 }}>Last purchase</small></span>
        </button>
        {expanded === customer.email && <div style={{ padding: "0 16px 16px", overflowX: "auto" }}><div style={{ fontWeight: 650, marginBottom: 10 }}>Purchase & refund history</div><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 560 }}><thead><tr>{["Item", "Date", "Method", "Status", "Amount"].map((heading) => <th key={heading} style={{ textAlign: "left", padding: 9, opacity: .65 }}>{heading}</th>)}</tr></thead><tbody>{customer.payments.map((payment) => <tr key={payment.id} style={{ borderTop: "1px solid var(--admin-border, #ddd)" }}><td style={{ padding: 9 }}>{payment.media.title || payment.media.type}</td><td style={{ padding: 9 }}>{date(payment.createdAt)}</td><td style={{ padding: 9 }}>{payment.paymentMethod}</td><td style={{ padding: 9 }}>{payment.status}</td><td style={{ padding: 9 }}>{money(payment.amountCents, payment.currency)}{payment.refundAmountCents ? <small style={{ display: "block", opacity: .65 }}>Refund: {money(payment.refundAmountCents, payment.currency)}</small> : null}</td></tr>)}</tbody></table>{customer.payments.length >= 30 && <p style={{ fontSize: 12, opacity: .6 }}>Showing the latest 30 transactions for this customer.</p>}</div>}
      </div>)}
    </div>
    <p style={{ fontSize: 12, opacity: .6 }}>Customer identity is currently derived from payer email. This directory analyzes up to the 5,000 most recent payment records; no separate customer account or personal profile is created by this feature.</p>
  </div>;
}
