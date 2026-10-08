import { PublicFrame } from "@/components/public-frame";

export default function ContactPage() {
  const email = process.env.SUPPORT_EMAIL ?? "support@psx.local";
  return (
    <PublicFrame width="max-w-2xl" corner={{ href: "/login", label: "Login" }}>
      <p className="kicker">Support</p>
      <h1 className="mt-3 text-3xl font-semibold">Contact</h1>
      <p className="card mt-6 p-5 text-sm leading-6">
        Email <a className="text-gold" href={`mailto:${email}`}>{email}</a>
      </p>
    </PublicFrame>
  );
}
