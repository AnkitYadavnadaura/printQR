import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { del } from "@vercel/blob";
import { redis, authPrinter } from "@/lib/db";

// Customer: create a print job after the file is uploaded
export async function POST(req) {
  const { id, url, name, copies, color, duplex, pages } = await req.json();
  const shop = await redis.get(`printer:${id}`);
  if (!shop)
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  let host = "";
  try { host = new URL(url).hostname; } catch {}
  if (!host.endsWith(".public.blob.vercel-storage.com"))
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  const pg = Math.min(Math.max(parseInt(pages) || 1, 1), 500);
  const nCopies = Math.min(Math.max(parseInt(copies) || 1, 1), 20);
  const jobId = randomUUID();
  const job = {
    id: jobId, url, name: String(name || "file").slice(0, 120),
    copies: nCopies, pages: pg,
    color: !!color, duplex: !!duplex,
    status: "pending", at: Date.now(),
  };
  await redis.hset(`jobs:${id}`, { [jobId]: job });
  return NextResponse.json({ ok: true });
}

// Owner / agent: list jobs (pending only unless all=1)
export async function GET(req) {
  const q = new URL(req.url).searchParams;
  if (!(await authPrinter(q.get("id"), q.get("key"))))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const all = Object.values((await redis.hgetall(`jobs:${q.get("id")}`)) || {});
  const now = Date.now();
  for (const x of all) {
    if (x.status === "pending" && now - x.at > 24 * 3600e3) {
      try { await del(x.url); } catch {}
      x.status = "expired"; x.url = null;
      await redis.hset(`jobs:${q.get("id")}`, { [x.id]: x });
    }
  }
  const jobs = all
    .filter((j) => q.get("all") || j.status === "pending")
    .sort((a, b) => b.at - a.at)
    .slice(0, 30);
  return NextResponse.json({ jobs });
}

// Agent: mark job printed and delete the file
export async function PATCH(req) {
  const { id, key, jobId } = await req.json();
  if (!(await authPrinter(id, key)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const job = await redis.hget(`jobs:${id}`, jobId);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  try { await del(job.url); } catch {}
  await redis.hset(`jobs:${id}`, { [jobId]: { ...job, status: "printed", url: null } });
  return NextResponse.json({ ok: true });
}
