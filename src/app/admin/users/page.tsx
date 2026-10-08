import { ActionForm } from "@/components/action-form";
import { suspendUserAction } from "@/server/actions";
import { prisma } from "@/server/db";

export default async function UsersAdminPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Users</h1>
      <div className="mt-4 space-y-3">
        {users.map((user) => (
          <article key={user.id} className="card flex items-center justify-between gap-3 p-4 text-sm">
            <div>
              <p>{user.name} · {user.email}</p>
              <p className="text-muted">{user.role} · {user.status}</p>
            </div>
            {user.status === "ACTIVE" ? (
              <ActionForm action={suspendUserAction}>
                <input type="hidden" name="id" value={user.id} />
                <button className="text-down" type="submit">Suspend</button>
              </ActionForm>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
