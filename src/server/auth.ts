import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/server/db";
import { SESSION_COOKIE, SESSION_HOURS, newToken, rateLimit, sha256 } from "@/lib/security";

const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "ANALYST"];

export async function requestMeta() {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ip: forwarded || headerStore.get("x-real-ip") || "unknown",
    userAgent: headerStore.get("user-agent")?.slice(0, 300) ?? "unknown",
  };
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  };
}

export async function createSession(userId: string) {
  const token = newToken();
  const meta = await requestMeta();
  await prisma.session.create({
    data: {
      userId,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000),
      ip: meta.ip,
      userAgent: meta.userAgent,
    },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, cookieOptions());
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.updateMany({
      where: { tokenHash: sha256(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { include: { preference: true } } },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  if (session.user.status !== "ACTIVE") return null;
  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireStaff() {
  const user = await requireUser();
  if (!ADMIN_ROLES.includes(user.role)) redirect("/terminal");
  return user;
}

export async function loginWithPassword(email: string, password: string) {
  const meta = await requestMeta();
  const key = `${meta.ip}:${email.toLowerCase()}`;
  const limit = rateLimit(key, 8, 15 * 60 * 1000);
  if (!limit.ok) return { ok: false as const, error: "Too many attempts. Wait 15 minutes." };

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  const valid = user?.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
  await prisma.loginActivity.create({
    data: {
      userId: user?.id,
      email: email.toLowerCase().trim(),
      success: Boolean(valid && user?.status === "ACTIVE"),
      ip: meta.ip,
      userAgent: meta.userAgent,
    },
  });
  if (!user || !valid) return { ok: false as const, error: "Email or password is incorrect." };
  if (user.status !== "ACTIVE") return { ok: false as const, error: "This account is suspended." };
  if (!user.passwordHash) return { ok: false as const, error: "Set a password from your invitation link first." };
  await createSession(user.id);
  return { ok: true as const, role: user.role };
}

export function isStaff(role: Role) {
  return ADMIN_ROLES.includes(role);
}
