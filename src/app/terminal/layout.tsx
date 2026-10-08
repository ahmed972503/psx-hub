import { Shell } from "@/components/shell";
import { requireUser } from "@/server/auth";

export default async function TerminalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <Shell user={user}>{children}</Shell>;
}
