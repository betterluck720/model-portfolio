"use client";
import { useEffect, useState } from "react";
type Coupon = { id: string; code: string; description: string | null; discountType: string; discountValue: number; minOrderCents: number; maxDiscountCents: number | null; usageLimit: number | null; usageCount: number; startsAt: string | null; expiresAt: string | null; active: boolean };
const money = (c: number) => `$${(c / 100).toFixed(2)}`;
export default function CouponManager() {
  const [items, setItems] = useState<Coupon[]>([]); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [code, setCode] = useState(""); const [description, setDescription] = useState(""); const [type, setType] = useState("PERCENT"); const [value, setValue] = useState("10"); const [limit, setLimit] = useState(""); const [minimum, setMinimum] = useState("0"); const [expiry, setExpiry] = useState("");
  async function load() { const r = await fetch("/api/admin/coupons", { cache: "no-store" }); const d = await r.json(); if (r.ok) setItems(d.coupons); else setError(d.error || "Unable to load coupons."); }
  useEffect(() => { void load(); }, []);
  async function create(e: React.FormEvent) { e.preventDefault(); setBusy(true); setError(""); try { const r = await fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, description: description || null, discountType: type, discountValue: Number(value), minOrderCents: Math.round(Number(minimum || 0) * 100), usageLimit: limit ? Number(limit) : null, expiresAt: expiry ? new Date(`${expiry}T23:59:59`).toISOString() : null, active: true }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error); setCode(""); setDescription(""); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Unable to create coupon."); } finally { setBusy(false); } }
  async function toggle(c: Coupon) { const r = await fetch(`/api/admin/coupons/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !c.active }) }); if (r.ok) await load(); else setError("Unable to update coupon."); }
  async function remove(c: Coupon) { if (!window.confirm(`Delete ${c.code}?`)) return; const r = await fetch(`/api/admin/coupons/${c.id}`, { method: "DELETE" }); if (r.ok) await load(); else setError("Unable to delete coupon."); }
  return <div className="admin-page-content"><div className="admin-page-heading"><div><span className="admin-eyebrow">REVENUE TOOLS</span><h1>Discount & coupons</h1><p>Create and manage promotional codes for your customers.</p></div></div>
    {error && <div role="alert" className="admin-alert admin-alert-error">{error}</div>}
    <form onSubmit={create} className="admin-card" style={{ padding: 24, display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))" }}><h2 style={{ gridColumn: "1/-1" }}>Create coupon</h2>
      <label>Coupon code<input required minLength={3} maxLength={32} value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="WELCOME10" /></label>
      <label>Description<input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Welcome discount" /></label>
      <label>Discount type<select value={type} onChange={e=>setType(e.target.value)}><option value="PERCENT">Percentage (%)</option><option value="FIXED">Fixed amount (cents)</option></select></label>
      <label>{type === "PERCENT" ? "Percentage" : "Amount in cents"}<input type="number" min="1" max={type === "PERCENT" ? 100 : 1000000} required value={value} onChange={e=>setValue(e.target.value)} /></label>
      <label>Minimum order ($)<input type="number" min="0" step="0.01" value={minimum} onChange={e=>setMinimum(e.target.value)} /></label>
      <label>Usage limit (blank = unlimited)<input type="number" min="1" value={limit} onChange={e=>setLimit(e.target.value)} /></label>
      <label>Expires on<input type="date" value={expiry} onChange={e=>setExpiry(e.target.value)} /></label>
      <div style={{ display:"flex", alignItems:"end" }}><button className="admin-button admin-button-primary" disabled={busy}>{busy ? "Creating…" : "Create coupon"}</button></div>
    </form>
    <div className="admin-card" style={{ marginTop: 24, padding: 24 }}><h2>Coupons ({items.length})</h2>{items.length === 0 ? <p>No coupons yet. Create your first promotional code above.</p> : <div style={{ overflowX:"auto" }}><table className="admin-table"><thead><tr><th>Code</th><th>Discount</th><th>Minimum</th><th>Usage</th><th>Expires</th><th>Status</th><th>Actions</th></tr></thead><tbody>{items.map(c=><tr key={c.id}><td><strong>{c.code}</strong><small>{c.description}</small></td><td>{c.discountType === "PERCENT" ? `${c.discountValue}%` : money(c.discountValue)}</td><td>{money(c.minOrderCents)}</td><td>{c.usageCount}{c.usageLimit ? ` / ${c.usageLimit}` : " / ∞"}</td><td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "No expiry"}</td><td>{c.active ? "Active" : "Paused"}</td><td><button className="admin-button" onClick={()=>void toggle(c)}>{c.active ? "Pause" : "Activate"}</button> <button className="admin-button" onClick={()=>void remove(c)}>Delete</button></td></tr>)}</tbody></table></div>}</div>
    <p style={{ marginTop: 16, opacity: .7, fontSize: 13 }}>Coupon validation endpoint: POST /api/coupons/validate. Usage is not yet consumed by checkout; integrate reservation and redemption into the payment capture flow before running a public promotion.</p>
  </div>;
}
