"use client";
import { useState } from "react";

export default function Login() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function go(e) {
    e.preventDefault(); setErr("");
    const r = await fetch("/api/login", { method: "POST", body: JSON.stringify({ id, password }) });
    const d = await r.json();
    if (!r.ok) return setErr(d.error);
    location.href = `/dashboard/${d.id}?key=${d.secret}`;
  }

  return (
    <>
      <h1>Log in to your shop</h1>
      <p>Your Shop ID is the code in your QR link (the part after /p/).</p>
      <form onSubmit={go}>
        <label htmlFor="i"><strong>Shop ID</strong></label>
        <div style={{ margin: "8px 0 16px" }}><input id="i" type="text" value={id} onChange={(e) => setId(e.target.value)} required /></div>
        <label htmlFor="pw"><strong>Password</strong></label>
        <div style={{ margin: "8px 0 16px" }}><input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", padding: 12, border: "1.5px solid var(--line)", borderRadius: 6, font: "inherit" }} /></div>
        <div className="row"><button>Log in</button><a href="/">Create a new shop</a></div>
        {err && <p className="err">{err}</p>}
      </form>
    </>
  );
}
