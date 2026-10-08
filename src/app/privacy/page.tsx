import { PublicFrame } from "@/components/public-frame";

export default function PrivacyPage() {
  return (
    <PublicFrame width="max-w-2xl" corner={{ href: "/login", label: "Login" }}>
      <p className="kicker">Policy</p>
      <h1 className="mt-3 text-3xl font-semibold">Privacy</h1>
      <div className="card mt-6 space-y-4 p-5 text-sm leading-6 text-muted">
        <p>Watchlists, alert settings, and login activity belong to the signed-in user. Other users cannot read them.</p>
        <p>Administrators can see access requests, platform content, and audit logs. Passwords are stored only as hashes and are never shown.</p>
        <p>The platform stores headlines, source links, publication times, and short feed excerpts. It does not republish full copyrighted articles.</p>
      </div>
    </PublicFrame>
  );
}
