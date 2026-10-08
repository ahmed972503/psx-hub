import { mailSettings, sendMail } from "../src/server/mail";

async function main() {
  const settings = mailSettings();
  if (!settings) {
    console.error("SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM in .env, then restart the app.");
    process.exit(1);
  }
  const to = process.argv[2] || settings.user;
  const result = await sendMail({
    to,
    subject: "PSX Intelligence mail test",
    text: "SMTP is working. Invitation and password-reset emails can be sent from this app.",
  });
  if (!result.sent) {
    console.error(result.reason);
    process.exit(1);
  }
  console.log(`Test email sent to ${to}`);
}

main();
