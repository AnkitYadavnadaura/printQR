"use client";
import { useState } from "react";
import { saveShop } from "@/lib/shops";

const field = { width: "100%", padding: 12, border: "1.5px solid var(--line)", borderRadius: 6, font: "inherit", background: "#fff" };

export default function Home() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function register(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const shop = { id: crypto.randomUUID().replace(/-/g, ""), name: name.trim() };
      saveShop(shop);
      location.href = `/dashboard/${shop.id}`;
    } catch (e) {
      setErr(e.message || "Could not save this shop in your browser.");
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Customers scan. Files print.</h1>
      <p>Create a shop QR. Customer files travel directly to your printer PC; no account or cloud file storage is used.</p>
      <form onSubmit={register}>
        <label htmlFor="n"><strong>Shop name</strong></label>
        <div style={{ margin: "8px 0 16px" }}><input id="n" style={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sharma Xerox & Print" required /></div>
        <div className="row"><button disabled={busy}>{busy ? "Creating…" : "Create my QR"}</button><a href="/login">Saved shops</a></div>
        {err && <p className="err">{err}</p>}
      </form>
      <p style={{ marginTop: 20 }}>Shop details are saved only in this browser. The printer agent must be online for customers to send files.</p>
    </>
  );
}
