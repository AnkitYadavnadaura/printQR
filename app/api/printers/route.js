import { NextResponse } from "next/server";
import { randomUUID, randomBytes, scryptSync } from "crypto";
import { redis } from "@/lib/db";

// Register a shop
export async function POST(req) {
  const { name, password } = await req.json();
  if (!name || name.trim().length < 2)
    return NextResponse.json({ error: "Enter your shop name" }, { status: 400 });
  if (!password || password.length < 6)
    return NextResponse.json({ error: "Password needs at least 6 characters" }, { status: 400 });
  const id = randomUUID().replace(/-/g, "").slice(0, 8);
  const secret = randomUUID();
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  await redis.set(`printer:${id}`, { name: name.trim().slice(0, 60), secret, salt, hash });
  return NextResponse.json({ id, secret });
}

// Public: shop name for the customer upload page
export async function GET(req) {
  const id = new URL(req.url).searchParams.get("id");
  const p = id && (await redis.get(`printer:${id}`));
  if (!p) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  return NextResponse.json({ name: p.name });
}
