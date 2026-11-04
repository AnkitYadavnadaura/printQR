import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

// Returns the printer record only if id + key match
export async function authPrinter(id, key) {
  if (!id || !key) return null;
  const p = await redis.get(`printer:${id}`);
  return p && p.secret === key ? p : null;
}
