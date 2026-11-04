import { NextResponse } from "next/server";
import { scryptSync, timingSafeEqual } from "crypto";
import { redis } from "@/lib/db";

export async function POST(req) {
  const { id, password } = await req.json();
  const p = id && (await redis.get(`printer:${id.trim()}`));
  const bad = NextResponse.json({ error: "Shop ID or password is wrong" }, { status: 401 });
  if (!p || !p.hash || !password) return bad;
  const a = Buffer.from(scryptSync(password, p.salt, 32).toString("hex"));
  const b = Buffer.from(p.hash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return bad;
  return NextResponse.json({ id: id.trim(), secret: p.secret });
}
