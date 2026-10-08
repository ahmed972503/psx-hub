import { formatWhen } from "@/lib/format";
import { prisma } from "@/server/db";

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: { actor: true },
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Audit log</h1>
      <ul className="mt-4 space-y-2 text-sm">
        {logs.map((log) => (
          <li key={log.id} className="card p-3">
            {formatWhen(log.createdAt)} · {log.actor?.email ?? "system"} · {log.action} · {log.entityType}
          </li>
        ))}
      </ul>
    </div>
  );
}
