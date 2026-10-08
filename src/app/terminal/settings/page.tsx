import { ActionForm } from "@/components/action-form";
import { logoutAllAction, savePreferenceAction } from "@/server/actions";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { formatWhen } from "@/lib/format";

export default async function SettingsPage() {
  const user = await requireUser();
  const activity = await prisma.loginActivity.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  const preference = user.preference;
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <ActionForm action={savePreferenceAction} className="card space-y-3 p-4">
        <label className="block text-sm">Language
          <select className="mt-1" name="language" defaultValue={preference?.language ?? "en"}>
            <option value="en">English</option>
            <option value="ur">Urdu</option>
            <option value="roman">Roman Urdu</option>
          </select>
        </label>
        <label className="block text-sm">Alert sensitivity
          <select className="mt-1" name="alertSensitivity" defaultValue={preference?.alertSensitivity ?? "medium"}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label className="block text-sm">Quiet hours start<input className="mt-1" name="quietStart" placeholder="22:00" defaultValue={preference?.quietStart ?? ""} /></label>
        <label className="block text-sm">Quiet hours end<input className="mt-1" name="quietEnd" placeholder="08:00" defaultValue={preference?.quietEnd ?? ""} /></label>
        <button className="btn btn-gold" type="submit">Save</button>
      </ActionForm>
      <form action={logoutAllAction}>
        <button className="btn btn-ghost" type="submit">Log out of all devices</button>
      </form>
      <section>
        <h2 className="font-semibold">Recent logins</h2>
        <ul className="mt-2 space-y-2 text-sm text-muted">
          {activity.map((row) => (
            <li key={row.id}>{row.success ? "Success" : "Failed"} · {formatWhen(row.createdAt)} · {row.ip}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
