import { createHash, timingSafeEqual } from "node:crypto";

export const ROOM = "demo";
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const secretEquals = (a: string, b: string) =>
  timingSafeEqual(Buffer.from(hash(a)), Buffer.from(hash(b)));
export const validId = (value: unknown): value is string =>
  typeof value === "string" && /^[\w-]{8,100}$/.test(value);
export const validText = (value: unknown, max: number): value is string =>
  typeof value === "string" && !!value.trim() && value.length <= max;

export class RateLimiter {
  private buckets = new Map<string, number[]>();
  allow(key: string, limit: number, windowMs: number, now = Date.now()) {
    if (this.buckets.size > 10000) {
      for (const [k, times] of this.buckets)
        if (!times.length || times.at(-1)! < now - 3600000)
          this.buckets.delete(k);
    }
    const times = (this.buckets.get(key) ?? []).filter(
      (t) => t > now - windowMs,
    );
    if (times.length >= limit) return false;
    times.push(now);
    this.buckets.set(key, times);
    return true;
  }
}
