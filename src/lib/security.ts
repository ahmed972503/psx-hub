import { createHash, randomBytes } from "crypto";

export const SESSION_COOKIE = "psx_session";
export const SESSION_HOURS = 12;

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function newToken() {
  return randomBytes(32).toString("hex");
}

export function passwordError(password: string) {
  if (password.length < 10) return "Use at least 10 characters.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Use at least one letter and one number.";
  }
  return null;
}

const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true as const };
  }
  current.count += 1;
  if (current.count > limit) return { ok: false as const, retryAt: current.reset };
  return { ok: true as const };
}

export function appUrl() {
  return process.env.APP_URL ?? "http://localhost:3000";
}
