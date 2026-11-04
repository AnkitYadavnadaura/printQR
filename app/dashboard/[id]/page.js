"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

export default function Dashboard() {
  const { id } = useParams();
  const [key, setKey] = useState("");
  const [link, setLink] = useState("");
  const [jobs, setJobs] = useState([]);
  const [err, setErr] = useState("");
  useEffect(() => {
    setLink(`${location.origin}/p/${id}`);
    setKey(new URLSearchParams(location.search).get("key") || "");
  }, [id]);

  useEffect(() => {
    if (!key) return;
    const load = async () => {
      const r = await fetch(`/api/jobs?id=${id}&key=${key}&all=1`);
      const d = await r.json();
      r.ok ? setJobs(d.jobs) : setErr(d.error);
    };
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [id, key]);

  if (err) return <h1>{err}</h1>;

  return (
    <>
      <h1>Your shop QR</h1>
      <p>Print this and stick it on your counter.</p>
      <div className="qrbox">
        {link && <QRCodeSVG value={link} size={220} />}
        <p>{link}</p>
      </div>
      <div className="row" style={{ marginTop: 16 }}>
        <button onClick={() => window.print()}>Print QR</button>
        <button className="alt" onClick={() => navigator.clipboard.writeText(link)}>Copy link</button>
      </div>

      <h2>Incoming files</h2>
      {!jobs.length && <p>Nothing yet. Files show up here when a customer sends one.</p>}
      {jobs.map((j) => (
        <div className="job" key={j.id}>
          <span>{j.name}: {j.copies} {j.copies > 1 ? "copies" : "copy"}, {j.color ? "colour" : "B&W"}{j.duplex ? ", both sides" : ""}{j.pages ? `, ${j.pages} ${j.pages > 1 ? "pages" : "page"}` : ""}</span>
          <span className={`tag ${j.status}`}>{j.status === "pending" ? "Waiting for printer" : j.status === "printed" ? "Printed" : "Expired"}</span>
        </div>
      ))}

      <h2>Auto-print agent</h2>
      <p>Run this on the PC connected to your printer:</p>
      <p><code>SERVER={link && location.origin} PRINTER_ID={id} KEY={key} node agent.mjs</code></p>
      <p>Lost this page? Log in again at <a href="/login">/login</a> with your Shop ID <code>{id}</code> and password.</p>
    </>
  );
}
