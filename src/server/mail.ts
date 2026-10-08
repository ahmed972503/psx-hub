import nodemailer from "nodemailer";

export type MailSettings = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

export function mailSettings(): MailSettings | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD?.replace(/\s+/g, "");
  const from = process.env.SMTP_FROM?.trim() || user;
  const port = Number(process.env.SMTP_PORT || 587);
  if (!host || !user || !pass || !from || !Number.isFinite(port)) return null;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  return { host, port, secure, user, pass, from };
}

export async function sendMail(input: { to: string; subject: string; text: string }) {
  const settings = mailSettings();
  if (!settings) return { sent: false as const, reason: "SMTP is not configured." };
  const transport = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: { user: settings.user, pass: settings.pass },
  });
  try {
    await transport.sendMail({
      from: settings.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return { sent: true as const };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Email could not be sent.";
    console.error("[mail]", reason);
    return { sent: false as const, reason };
  }
}
