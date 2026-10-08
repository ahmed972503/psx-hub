"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { appUrl, newToken, passwordError, rateLimit, sha256 } from "@/lib/security";
import { mailSettings, sendMail } from "@/server/mail";
import { clearSession, createSession, getCurrentUser, isStaff, loginWithPassword, requestMeta } from "@/server/auth";
import { runCollectors } from "@/server/collector";
import { prisma } from "@/server/db";
import { fanOutAlerts, ingestItem } from "@/server/pipeline";

async function audit(action: string, entityType: string, entityId?: string, detail?: object) {
  const user = await getCurrentUser();
  await prisma.auditLog.create({
    data: { actorId: user?.id, action, entityType, entityId, detail },
  });
}

export async function requestAccessAction(formData: FormData) {
  const meta = await requestMeta();
  const limit = rateLimit(`access:${meta.ip}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return { error: "Too many requests from this network. Try again later." };
  const parsed = z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(180),
    phone: z.string().trim().max(40).optional(),
    requestedUsername: z.string().trim().max(40).optional(),
    reason: z.string().trim().min(8).max(1000),
    investorType: z.string().trim().min(2).max(40),
    country: z.string().trim().min(2).max(80),
    message: z.string().trim().max(1000).optional(),
  }).safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    requestedUsername: formData.get("requestedUsername") || undefined,
    reason: formData.get("reason"),
    investorType: formData.get("investorType"),
    country: formData.get("country"),
    message: formData.get("message") || undefined,
  });
  if (!parsed.success) return { error: "Check the form. Name, email, reason, investor type, and country are required." };
  await prisma.accessRequest.create({
    data: {
      ...parsed.data,
      email: parsed.data.email.toLowerCase(),
      status: "PENDING",
    },
  });
  redirect("/request-access?sent=1");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  const result = await loginWithPassword(email, password);
  if (!result.ok) return { error: result.error };
  const destination = next.startsWith("/terminal") || next.startsWith("/admin") ? next : isStaff(result.role) ? "/admin" : "/terminal";
  redirect(destination);
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function logoutAllAction() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await prisma.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
  await clearSession();
  redirect("/login");
}

export async function approveAccessAction(formData: FormData) {
  const actor = await getCurrentUser();
  if (!actor || !isStaff(actor.role)) return { error: "Not allowed." };
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").slice(0, 500);
  const request = await prisma.accessRequest.findUnique({ where: { id } });
  if (!request) return { error: "Request not found." };
  let user = await prisma.user.findUnique({ where: { email: request.email.toLowerCase() } });
  if (!user) {
    const usernameTaken = request.requestedUsername
      ? await prisma.user.findUnique({ where: { username: request.requestedUsername } })
      : null;
    user = await prisma.user.create({
      data: {
        email: request.email.toLowerCase(),
        name: request.name,
        username: usernameTaken ? null : request.requestedUsername,
        phone: request.phone,
        country: request.country,
        investorType: request.investorType,
        role: "USER",
        status: "ACTIVE",
        preference: { create: { language: "en", alertSensitivity: "medium", channels: ["IN_APP"] } },
      },
    });
  } else if (user.status === "SUSPENDED") {
    await prisma.user.update({ where: { id: user.id }, data: { status: "ACTIVE" } });
  }
  await prisma.accessRequest.update({
    where: { id },
    data: { status: "APPROVED", adminNote: note || null, reviewedAt: new Date(), reviewedById: actor.id },
  });
  await audit("approve_access", "access_request", id);
  if (user.passwordHash) {
    redirect("/admin/access?notice=already-active");
  }
  const token = newToken();
  await prisma.invitation.create({
    data: {
      userId: user.id,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + 7 * 86400000),
    },
  });
  const link = `${appUrl()}/invite/${token}`;
  const mailed = await sendMail({
    to: user.email,
    subject: "Your PSX Intelligence invitation",
    text: [
      `Hello ${user.name},`,
      "",
      "Your access request was approved.",
      "Open this link and set your password. It expires in 7 days:",
      link,
      "",
      "If you did not request access, ignore this email.",
    ].join("\n"),
  });
  const query = new URLSearchParams({ invite: link, mailed: mailed.sent ? "1" : "0" });
  redirect(`/admin/access?${query.toString()}`);
}

export async function rejectAccessAction(formData: FormData) {
  const actor = await getCurrentUser();
  if (!actor || !isStaff(actor.role)) return { error: "Not allowed." };
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").slice(0, 500);
  await prisma.accessRequest.update({
    where: { id },
    data: { status: "REJECTED", adminNote: note || null, reviewedAt: new Date(), reviewedById: actor.id },
  });
  await audit("reject_access", "access_request", id);
  revalidatePath("/admin/access");
}

export async function reviewAlertAction(formData: FormData) {
  const actor = await getCurrentUser();
  if (!actor || !isStaff(actor.role)) return { error: "Not allowed." };
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const review = await prisma.alertReview.findUnique({ where: { id }, include: { item: true } });
  if (!review) return { error: "Review not found." };
  if (decision === "reject") {
    await prisma.alertReview.update({
      where: { id },
      data: { status: "REJECTED", reviewerId: actor.id, reviewedAt: new Date(), note: String(formData.get("note") ?? "").slice(0, 500) },
    });
    await prisma.intelligenceItem.update({ where: { id: review.itemId }, data: { reviewStatus: "REJECTED", shouldAlert: false } });
    await audit("reject_alert", "alert_review", id);
  } else {
    const direction = String(formData.get("direction") ?? review.item.direction);
    const impactScore = Number(formData.get("impactScore") ?? review.item.impactScore);
    const confidence = Number(formData.get("confidence") ?? review.item.confidence);
    await prisma.intelligenceItem.update({
      where: { id: review.itemId },
      data: {
        direction: direction === "POSITIVE" || direction === "NEGATIVE" || direction === "MIXED" || direction === "NEUTRAL" ? direction : review.item.direction,
        impactScore: Number.isFinite(impactScore) ? Math.max(0, Math.min(100, impactScore)) : review.item.impactScore,
        confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(100, confidence)) : review.item.confidence,
        reviewStatus: "APPROVED",
        shouldAlert: true,
      },
    });
    await prisma.alertReview.update({
      where: { id },
      data: { status: "APPROVED", reviewerId: actor.id, reviewedAt: new Date(), note: String(formData.get("note") ?? "").slice(0, 500) },
    });
    await fanOutAlerts(review.itemId);
    await audit("approve_alert", "alert_review", id);
  }
  revalidatePath("/admin/review");
}

export async function saveSourceAction(formData: FormData) {
  const actor = await getCurrentUser();
  if (!actor || (actor.role !== "ADMIN" && actor.role !== "SUPER_ADMIN")) return { error: "Not allowed." };
  const type = String(formData.get("type") ?? "RSS");
  const allowed = ["RSS", "HTML", "OFFICIAL", "API", "SITEMAP", "MANUAL"];
  if (!allowed.includes(type)) return { error: "Unknown source type." };
  await prisma.source.create({
    data: {
      name: String(formData.get("name") ?? "").trim().slice(0, 120),
      type: type as "RSS",
      url: String(formData.get("url") ?? "").trim() || null,
      category: String(formData.get("category") ?? "news").trim().slice(0, 60),
      language: String(formData.get("language") ?? "en"),
      reliability: Math.max(0, Math.min(100, Number(formData.get("reliability") ?? 60))),
      pollIntervalSec: Math.max(120, Number(formData.get("pollIntervalSec") ?? 900)),
      enabled: formData.get("enabled") === "on",
      notes: String(formData.get("notes") ?? "").slice(0, 500) || null,
    },
  });
  await audit("add_source", "source");
  revalidatePath("/admin/sources");
}

export async function toggleSourceAction(formData: FormData) {
  const actor = await getCurrentUser();
  if (!actor || (actor.role !== "ADMIN" && actor.role !== "SUPER_ADMIN")) return { error: "Not allowed." };
  const id = String(formData.get("id") ?? "");
  const source = await prisma.source.findUnique({ where: { id } });
  if (!source) return { error: "Source not found." };
  await prisma.source.update({ where: { id }, data: { enabled: !source.enabled } });
  await audit(source.enabled ? "disable_source" : "enable_source", "source", id);
  revalidatePath("/admin/sources");
}

export async function collectAction() {
  const actor = await getCurrentUser();
  if (!actor || !isStaff(actor.role)) return { error: "Not allowed." };
  const results = await runCollectors(true);
  await audit("run_collectors", "source");
  revalidatePath("/admin/sources");
  revalidatePath("/terminal");
  return { results };
}

export async function intakeAction(formData: FormData) {
  const actor = await getCurrentUser();
  if (!actor || !isStaff(actor.role)) return { error: "Not allowed." };
  const sourceId = String(formData.get("sourceId") ?? "");
  const headline = String(formData.get("headline") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim().slice(0, 320);
  const publishedRaw = String(formData.get("publishedAt") ?? "");
  const publishedAt = publishedRaw ? new Date(publishedRaw) : null;
  if (!headline || !url) return { error: "Headline and original URL are required." };
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return { error: "URL must be http or https." };
  } catch {
    return { error: "Enter a valid original source URL." };
  }
  await ingestItem({
    sourceId,
    sourceUrl: url,
    headline,
    excerpt: excerpt || null,
    publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
  });
  await audit("manual_intake", "raw_news");
  revalidatePath("/terminal");
  redirect("/admin/intake?saved=1");
}

export async function addWatchAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const ticker = String(formData.get("ticker") ?? "").trim().toUpperCase();
  const company = await prisma.company.findUnique({ where: { ticker } });
  if (!company) return { error: `No listed company is mapped for ${ticker}.` };
  await prisma.watchlistItem.upsert({
    where: { userId_companyId: { userId: user.id, companyId: company.id } },
    create: { userId: user.id, companyId: company.id },
    update: {},
  });
  revalidatePath("/terminal/watchlist");
}

export async function removeWatchAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const id = String(formData.get("id") ?? "");
  await prisma.watchlistItem.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/terminal/watchlist");
}

export async function savePreferenceAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const language = String(formData.get("language") ?? "en");
  const alertSensitivity = String(formData.get("alertSensitivity") ?? "medium");
  await prisma.userPreference.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      language: ["en", "ur", "roman"].includes(language) ? language : "en",
      alertSensitivity: ["low", "medium", "high"].includes(alertSensitivity) ? alertSensitivity : "medium",
      quietStart: String(formData.get("quietStart") ?? "") || null,
      quietEnd: String(formData.get("quietEnd") ?? "") || null,
      channels: ["IN_APP"],
    },
    update: {
      language: ["en", "ur", "roman"].includes(language) ? language : "en",
      alertSensitivity: ["low", "medium", "high"].includes(alertSensitivity) ? alertSensitivity : "medium",
      quietStart: String(formData.get("quietStart") ?? "") || null,
      quietEnd: String(formData.get("quietEnd") ?? "") || null,
    },
  });
  revalidatePath("/terminal/settings");
}

export async function markAlertReadAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const id = String(formData.get("id") ?? "");
  await prisma.alert.updateMany({ where: { id, userId: user.id }, data: { readAt: new Date() } });
  revalidatePath("/terminal/alerts");
}

export async function suspendUserAction(formData: FormData) {
  const actor = await getCurrentUser();
  if (!actor || (actor.role !== "ADMIN" && actor.role !== "SUPER_ADMIN")) return { error: "Not allowed." };
  const id = String(formData.get("id") ?? "");
  if (id === actor.id) return { error: "You cannot suspend your own account." };
  await prisma.user.update({ where: { id }, data: { status: "SUSPENDED" } });
  await prisma.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
  await audit("suspend_user", "user", id);
  revalidatePath("/admin/users");
}

export async function acceptInviteAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const problem = passwordError(password);
  if (problem) return { error: problem };
  const invite = await prisma.invitation.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } });
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) return { error: "This invitation is invalid or expired." };
  await prisma.user.update({
    where: { id: invite.userId },
    data: { passwordHash: await bcrypt.hash(password, 12), emailVerifiedAt: new Date(), status: "ACTIVE" },
  });
  await prisma.invitation.update({ where: { id: invite.id }, data: { usedAt: new Date() } });
  await createSession(invite.userId);
  redirect("/terminal");
}

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const meta = await requestMeta();
  const limit = rateLimit(`reset:${meta.ip}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return { error: "Too many reset requests. Try again later." };
  const user = await prisma.user.findUnique({ where: { email } });
  let devLink: string | undefined;
  if (user && user.passwordHash && user.status === "ACTIVE") {
    const token = newToken();
    await prisma.passwordReset.create({
      data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const link = `${appUrl()}/reset-password/${token}`;
    if (mailSettings()) {
      const mailed = await sendMail({
        to: user.email,
        subject: "Reset your PSX Intelligence password",
        text: `Open this link within 1 hour to choose a new password:\n${link}\n\nIf you did not ask for this, ignore this email.`,
      });
      if (!mailed.sent && process.env.NODE_ENV !== "production") devLink = link;
    } else if (process.env.NODE_ENV !== "production") {
      devLink = link;
    }
  }
  return {
    ok: true as const,
    message: mailSettings()
      ? "If an active account exists, a reset email has been sent."
      : "If an active account exists, a reset link has been created.",
    devLink,
  };
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const problem = passwordError(password);
  if (problem) return { error: problem };
  const reset = await prisma.passwordReset.findUnique({ where: { tokenHash: sha256(token) } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) return { error: "This reset link is invalid or expired." };
  await prisma.user.update({ where: { id: reset.userId }, data: { passwordHash: await bcrypt.hash(password, 12) } });
  await prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } });
  await prisma.session.updateMany({ where: { userId: reset.userId, revokedAt: null }, data: { revokedAt: new Date() } });
  redirect("/login?reset=1");
}
