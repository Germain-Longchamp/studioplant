"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Stethoscope } from "lucide-react";

interface DiagnosisEntry {
  id: string;
  diagnosis: string;
  urgency: string;
  created_at: string;
}

function urgencyStyles(urgency: string) {
  if (urgency === "Haute")   return "bg-rose-50 text-rose-700 border border-rose-100";
  if (urgency === "Moyenne") return "bg-amber-50 text-amber-700 border border-amber-100";
  return "bg-emerald-50 text-emerald-700 border border-emerald-100";
}

export default function PlantHealthHistory({ plantId }: { plantId: string }) {
  const [diagnoses, setDiagnoses] = useState<DiagnosisEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("plant_diagnoses")
      .select("id, diagnosis, urgency, created_at")
      .eq("plant_id", plantId)
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data, error }) => {
        if (!error) setDiagnoses(data ?? []);
        setLoaded(true);
      });
  }, [plantId]);

  if (!loaded || diagnoses.length === 0) return null;

  const latestDate = new Date(diagnoses[0].created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="bg-white rounded-[1.5rem] border border-stone-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[0.6rem] flex items-center justify-center bg-blue-50 shrink-0">
            <Stethoscope className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-stone-800">Historique santé</div>
            <div className="text-[10px] text-stone-400">
              {diagnoses.length} diagnostic{diagnoses.length > 1 ? "s" : ""} · dernier {latestDate}
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-stone-100 mx-4" />

      {/* Liste */}
      <div className="px-3 py-2 flex flex-col gap-2">
        {diagnoses.map((d) => (
          <div key={d.id} className="flex items-start gap-2 p-2.5 bg-stone-50 rounded-xl border border-stone-100">
            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md flex-shrink-0 mt-0.5 ${urgencyStyles(d.urgency)}`}>
              {d.urgency}
            </span>
            <div>
              <p className="text-[10px] font-semibold text-stone-700 leading-snug">{d.diagnosis}</p>
              <p className="text-[9px] text-stone-400 mt-0.5">
                {new Date(d.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
