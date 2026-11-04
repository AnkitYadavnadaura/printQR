"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { PDFDocument } from "pdf-lib";

async function countPages(f) {
  if (f.type !== "application/pdf") return 1;
  try { return (await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true })).getPageCount(); }
  catch { return 1; }
}

export default function Customer() {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [files, setFiles] = useState([]); // [{ file, pages }]
  const [copies, setCopies] = useState(1);
  const [color, setColor] = useState(false);
  const [duplex, setDuplex] = useState(false);
  const [state, setState] = useState("idle"); // idle | busy | done
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`/api/printers?id=${id}`).then(async (r) => {
      const d = await r.json();
      r.ok ? setShop(d) : setErr(d.error);
    });
  }, [id]);

  async function pick(list) {
    setState("idle");
    setFiles(await Promise.all(list.map(async (file) => ({ file, pages: await countPages(file) }))));
  }

  async function send() {
    setState("busy"); setErr("");
    try {
      for (const { file, pages } of files) {
        const blob = await upload(file.name, file, { access: "public", handleUploadUrl: "/api/upload", clientPayload: id });
        const r = await fetch("/api/jobs", { method: "POST", body: JSON.stringify({ id, url: blob.url, name: file.name, copies, color, duplex, pages }) });
        if (!r.ok) throw new Error((await r.json()).error);
      }
      setState("done"); setFiles([]);
    } catch (e) { setErr(e.message); setState("idle"); }
  }

  if (err && !shop) return <h1>{err}</h1>;
  if (!shop) return <p>Loading…</p>;

  return (
    <>
      <h1>{shop.name}</h1>
      <p>Choose your PDF or photo. It prints at the counter.</p>
      <label className="drop">
        <input type="file" hidden multiple accept="application/pdf,image/jpeg,image/png" onChange={(e) => pick([...e.target.files])} />
        {files.length
          ? <strong>{files.map((f) => `${f.file.name} (${f.pages} ${f.pages > 1 ? "pages" : "page"})`).join(", ")}</strong>
          : <span><strong>Tap to choose files</strong><br />PDF, JPG or PNG, up to 25 MB each</span>}
      </label>
      <div className="row" style={{ marginBottom: 16 }}>
        <label htmlFor="c">Copies</label>
        <input id="c" type="number" min="1" max="20" value={copies} onChange={(e) => setCopies(e.target.value)} style={{ width: 90 }} />
        <label htmlFor="col">Print</label>
        <select id="col" value={color ? "c" : "b"} onChange={(e) => setColor(e.target.value === "c")} style={{ padding: 10, font: "inherit", borderRadius: 6 }}>
          <option value="b">Black &amp; white</option>
          <option value="c">Colour</option>
        </select>
        <label><input type="checkbox" checked={duplex} onChange={(e) => setDuplex(e.target.checked)} /> Both sides</label>
      </div>
      <button onClick={send} disabled={!files.length || state === "busy"}>
        {state === "busy" ? "Sending…" : "Send to printer"}
      </button>
      {state === "done" && <p className="ok">Sent. Collect your pages at the counter.</p>}
      {err && <p className="err">{err}</p>}
    </>
  );
}
