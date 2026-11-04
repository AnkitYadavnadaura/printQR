"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Peer from "peerjs";
import { PDFDocument } from "pdf-lib";
import { peerServerOptions, printerPeerId } from "@/lib/peer-config.mjs";

const maxFileSize = 25 * 1024 * 1024;
const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
const chunkSize = 16 * 1024;

async function countPages(f) {
  if (f.type !== "application/pdf") return 1;
  try { return (await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true })).getPageCount(); }
  catch { return 1; }
}

function waitForEvent(target, event, timeout, timeoutMessage) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      target.off(event, onEvent);
      target.off("error", onError);
    };
    const onEvent = (value) => {
      cleanup();
      resolve(value);
    };
    const onError = (error) => {
      cleanup();
      reject(new Error(error.message || "Peer connection failed."));
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(timeoutMessage));
    }, timeout);
    target.on(event, onEvent);
    target.on("error", onError);
  });
}

function waitForJobResult(connection, jobId) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      connection.off("data", onData);
      connection.off("close", onClose);
      connection.off("error", onError);
    };
    const onData = (data) => {
      if (!data || data.jobId !== jobId || (data.type !== "printed" && data.type !== "error")) return;
      cleanup();
      if (data.type === "printed") resolve();
      else reject(new Error(data.message || "The printer agent could not print this file."));
    };
    const onClose = () => {
      cleanup();
      reject(new Error("Connection to the printer was closed."));
    };
    const onError = (error) => {
      cleanup();
      reject(new Error(error.message || "Connection to the printer failed."));
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Printer did not respond. Check its agent tab and try again."));
    }, 5 * 60 * 1000);
    connection.on("data", onData);
    connection.on("close", onClose);
    connection.on("error", onError);
  });
}

async function waitForBuffer(connection) {
  const deadline = Date.now() + 30000;
  while (connection.bufferSize > 1024 * 1024) {
    if (!connection.open) throw new Error("Connection to the printer was closed.");
    if (Date.now() >= deadline) throw new Error("The printer connection is too slow. Please try again.");
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

export default function Customer() {
  const { id } = useParams();
  const [shopName, setShopName] = useState("");
  const [files, setFiles] = useState([]); // [{ file, pages }]
  const [copies, setCopies] = useState(1);
  const [color, setColor] = useState(false);
  const [duplex, setDuplex] = useState(false);
  const [state, setState] = useState("idle"); // idle | busy | done
  const [err, setErr] = useState("");

  useEffect(() => {
    setShopName(new URLSearchParams(location.search).get("name") || "Print shop");
  }, [id]);

  async function pick(list) {
    setState("idle");
    const accepted = list.filter((file) => allowedTypes.includes(file.type) && file.size <= maxFileSize);
    setFiles(await Promise.all(accepted.map(async (file) => ({ file, pages: await countPages(file) }))));
    setErr(accepted.length === list.length ? "" : "Only PDF, JPG and PNG files up to 25 MB each are accepted.");
  }

  async function send() {
    setState("busy"); setErr("");
    let peer;
    let connection;
    try {
      if (!files.length) throw new Error("Choose at least one file.");
      const copyCount = Math.min(Math.max(Number.parseInt(copies, 10) || 1, 1), 20);
      peer = new Peer(undefined, peerServerOptions);
      setState("busy");
      await waitForEvent(peer, "open", 20000, "Could not connect to the PeerJS signaling service.");
      connection = peer.connect(printerPeerId(id), { reliable: true, serialization: "binary" });
      await waitForEvent(connection, "open", 30000, "Printer is offline or cannot be reached. Check the agent tab and network.");

      for (let index = 0; index < files.length; index++) {
        const { file, pages } = files[index];
        setState("busy");
        const jobId = crypto.randomUUID();
        await connection.send({
          type: "job",
          jobId,
          name: file.name,
          mime: file.type,
          size: file.size,
          copies: copyCount,
          color,
          duplex,
          pages,
        });
        const buffer = await file.arrayBuffer();
        for (let offset = 0; offset < buffer.byteLength; offset += chunkSize) {
          await waitForBuffer(connection);
          await connection.send(new Uint8Array(buffer.slice(offset, offset + chunkSize)));
        }
        const result = waitForJobResult(connection, jobId);
        await connection.send({ type: "end", jobId });
        await result;
      }
      setState("done"); setFiles([]);
    } catch (e) {
      setErr(e.message || "Could not send files to the printer.");
      setState("idle");
    } finally {
      connection?.close();
      peer?.destroy();
    }
  }

  return (
    <>
      <h1>{shopName}</h1>
      <p>Choose your PDF or photo. Files are sent directly to the printer PC; the printer agent must be online.</p>
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
        {state === "busy" ? "Connecting / sending…" : "Send to printer"}
      </button>
      {state === "done" && <p className="ok">Printed. Collect your pages at the counter.</p>}
      {err && <p className="err">{err}</p>}
    </>
  );
}
