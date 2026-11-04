"use client";
import { useState } from "react";

const field = { width: "100%", padding: 12, border: "1.5px solid var(--line)", borderRadius: 6, font: "inherit", background: "#fff" };

export default function Home() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function register(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch("/api/printers", { method: "POST", body: JSON.stringify({ name, password }) });
    const d = await r.json();
    if (!r.ok) { setErr(d.error); setBusy(false); return; }
    location.href = `/dashboard/${d.id}?key=${d.secret}`;
  }

  return (
    <>
      <h1>Customers scan. Files print.</h1>
      <p>Register your print shop, stick the QR on your counter, and uploads go straight to your printer.</p>
      <form onSubmit={register}>
        <label htmlFor="n"><strong>Shop name</strong></label>
        <div style={{ margin: "8px 0 16px" }}><input id="n" style={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sharma Xerox & Print" required /></div>
        <label htmlFor="p"><strong>Password</strong></label>
        <div style={{ margin: "8px 0 16px" }}><input id="p" type="password" style={field} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required /></div>
        <div className="row"><button disabled={busy}>{busy ? "Creating…" : "Create my QR"}</button><a href="/login">I already have a shop</a></div>
        {err && <p className="err">{err}</p>}
      </form>
    </>
  );
}
