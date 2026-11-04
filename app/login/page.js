"use client";
import { useEffect, useState } from "react";
import { getShops } from "@/lib/shops";

export default function Login() {
  const [shops, setShops] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    try { setShops(getShops()); }
    catch (e) { setErr(e.message); }
  }, []);

  return (
    <>
      <h1>Saved shops</h1>
      <p>Shops are saved in this browser only. They are not available after clearing browser data or on another device.</p>
      {err && <p className="err">{err}</p>}
      {!shops.length && !err && <p>No saved shops on this browser yet.</p>}
      {shops.map((shop) => (
        <div className="job" key={shop.id}>
          <strong>{shop.name}</strong>
          <a href={`/dashboard/${shop.id}`}>Open QR</a>
        </div>
      ))}
      <p style={{ marginTop: 20 }}><a href="/">Create a shop</a></p>
    </>
  );
}
