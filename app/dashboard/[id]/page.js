"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { getShop } from "@/lib/shops";
import { printerPeerId } from "@/lib/peer-config.mjs";

export default function Dashboard() {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [link, setLink] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    try {
      const saved = getShop(id);
      if (!saved) {
        setErr("This shop is not saved in this browser. Create it again on this device.");
        return;
      }
      setShop(saved);
      setLink(`${location.origin}/p/${id}?name=${encodeURIComponent(saved.name)}`);
    } catch (e) { setErr(e.message); }
  }, [id]);

  if (err) return <><h1>{err}</h1><p><a href="/">Create a shop</a></p></>;
  if (!shop) return <p>Loading…</p>;

  return (
    <>
      <h1>{shop.name}: shop QR</h1>
      <p>Print this and put it on your counter. The printer PC must be online before customers send files.</p>
      <div className="qrbox">
        {link && <QRCodeSVG value={link} size={220} />}
        <p>{link}</p>
      </div>
      <div className="row" style={{ marginTop: 16 }}>
        <button onClick={() => window.print()}>Print QR</button>
        <button className="alt" onClick={() => navigator.clipboard.writeText(link)}>Copy link</button>
      </div>

      <h2>Auto-print agent</h2>
      <p>On the PC connected to your printer, install the agent dependencies and run it with this shop ID:</p>
      <pre><code>{`cd C:\\path\\to\\printqr\\agent
npm install
$env:SHOP_ID="${id}"
node .\\agent.mjs`}</code></pre>
      <p>Then open <code>http://localhost:4317</code> in a browser on that PC and leave the tab open. Printer ID: <code>{printerPeerId(id)}</code></p>
      <p>Saved shops: <a href="/login">this browser only</a>. There is no password login or cross-device recovery because no shop database is used.</p>
    </>
  );
}
