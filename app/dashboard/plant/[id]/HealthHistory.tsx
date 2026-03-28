import { Activity, ChevronDown, HeartPulse } from "lucide-react";

interface Diagnosis {
  id: string;
  diagnosis: string;
  urgency: string;
  action: string;
  created_at: string;
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const styles =
    urgency === "Haute"   ? "bg-rose-100 text-rose-700 border-rose-200" :
    urgency === "Moyenne" ? "bg-amber-100 text-amber-700 border-amber-200" :
                            "bg-emerald-100 text-emerald-700 border-emerald-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${styles}`}>
      <Activity className="w-3 h-3" />
      {urgency}
    </span>
  );
}

export default function HealthHistory({ diagnoses }: { diagnoses: Diagnosis[] }) {
  if (diagnoses.length === 0) return null;

  return (
    <details className="group [&_summary::-webkit-details-marker]:hidden bg-white rounded-[2rem] shadow-lg shadow-stone-200/30 border border-stone-100 overflow-hidden transition-all hover:border-rose-100/60">
      <summary className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-stone-50/50 active:bg-stone-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-2xl text-rose-500 shrink-0 shadow-sm">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-stone-800 font-extrabold text-lg">Historique santé</span>
            <span className="text-stone-400 text-sm font-medium mt-0.5">{diagnoses.length} diagnostic{diagnoses.length > 1 ? "s" : ""}</span>
          </div>
        </div>
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-white transition-colors shrink-0 border border-stone-100">
          <ChevronDown className="h-5 w-5 text-stone-400 transition-transform duration-300 group-open:-rotate-180" />
        </div>
      </summary>

      <div className="px-5 pb-6 pt-2 animate-in fade-in duration-300 space-y-4">
        {diagnoses.map((d) => (
          <div key={d.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-400 font-medium">
                {new Date(d.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </span>
              <UrgencyBadge urgency={d.urgency} />
            </div>
            <p className="text-sm text-stone-700 font-semibold leading-relaxed">{d.diagnosis}</p>
            <div className="border-t border-stone-100 pt-3">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">Plan d'action</p>
              <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{d.action}</p>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
