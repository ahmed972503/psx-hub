import { PublicFrame } from "@/components/public-frame";

export default function TermsPage() {
  return (
    <PublicFrame width="max-w-2xl" corner={{ href: "/login", label: "Login" }}>
      <p className="kicker">Policy</p>
      <h1 className="mt-3 text-3xl font-semibold">Terms</h1>
      <div className="card mt-6 space-y-4 p-5 text-sm leading-6 text-muted">
        <p>PSX Intelligence is an information desk for approved users. Impact scores describe importance, not the probability that a price will rise or fall.</p>
        <p>Nothing on the platform is investment advice, a solicitation, or a guaranteed outcome. Confirm material facts at the original source.</p>
        <p>Market prices are shown only when a licensed provider is connected. A private website does not create a right to redistribute proprietary market data.</p>
      </div>
    </PublicFrame>
  );
}
