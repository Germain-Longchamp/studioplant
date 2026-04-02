import { ClipboardList } from "lucide-react";

interface AdminLog {
  id: string;
  created_at: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
}

const ACTION_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  delete_user: { label: "Suppression utilisateur", bg: "bg-rose-50",   text: "text-rose-700"  },
  update_role: { label: "Modification de rôle",    bg: "bg-amber-50",  text: "text-amber-700" },
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)   return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}

export default function AdminLogs({ logs }: { logs: AdminLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
        <ClipboardList className="w-8 h-8 text-stone-300 mx-auto mb-3" />
        <p className="text-stone-400 text-sm font-medium">Aucune action enregistrée pour l'instant.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <div className="divide-y divide-stone-100">
        {logs.map((log) => {
          const actionInfo = ACTION_LABELS[log.action] ?? {
            label: log.action,
            bg: "bg-stone-50",
            text: "text-stone-600",
          };
          const formattedDate = new Date(log.created_at).toLocaleString("fr-FR", {
            day: "numeric", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          });

          return (
            <div key={log.id} className="flex items-start gap-4 px-6 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${actionInfo.bg} ${actionInfo.text}`}>
                    {actionInfo.label}
                  </span>
                  {log.metadata?.email && (
                    <span className="text-xs text-stone-500 truncate">
                      {String(log.metadata.email)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-400 mt-1 font-mono truncate">
                  target: {log.target_id ?? "—"}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-semibold text-stone-500" title={formattedDate}>
                  {timeAgo(log.created_at)}
                </p>
                <p className="text-[10px] text-stone-300 mt-0.5">{formattedDate}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
