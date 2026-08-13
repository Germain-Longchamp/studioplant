"use client";

import { useState, useRef } from "react";
import { Stethoscope, Camera, Clock } from "lucide-react";
import type { PlantDiagnostic } from "@/server/actions";
import DoctorPlantFlow from "../../DoctorPlantFlow";
import DiagnosticDetailDrawer from "./DiagnosticDetailDrawer";
import DiagnosticHistoryDrawer from "./DiagnosticHistoryDrawer";

function urgencyBadgeStyles(urgency: string) {
  if (urgency === "Haute")   return "bg-rose-50 text-rose-700 border border-rose-100";
  if (urgency === "Moyenne") return "bg-amber-50 text-amber-700 border border-amber-100";
  return "bg-emerald-50 text-emerald-700 border border-emerald-100";
}

export default function DoctorPlantBlock({
  plantId,
  plantName,
  initialDiagnoses,
}: {
  plantId: string;
  plantName: string;
  initialDiagnoses: PlantDiagnostic[];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<{ file: File; previewUrl: string } | null>(null);

  // ── History state ──
  const [diagnoses, setDiagnoses]                   = useState<PlantDiagnostic[]>(initialDiagnoses);
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<PlantDiagnostic | null>(null);
  const [showHistory, setShowHistory]               = useState(false);

  const handleTriggerClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPicked({ file, previewUrl: URL.createObjectURL(file) });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeFlow = () => {
    if (picked) URL.revokeObjectURL(picked.previewUrl);
    setPicked(null);
  };

  const handleDiagnosed = (data: { diagnosis: string; urgency: string; action: string }) => {
    // Ajout optimiste en tête d'historique (revalidatePath gère le rafraîchissement SSR)
    const newEntry: PlantDiagnostic = {
      id: crypto.randomUUID(),
      diagnosis: data.diagnosis,
      urgency: data.urgency,
      action: data.action,
      created_at: new Date().toISOString(),
    };
    setDiagnoses(prev => [newEntry, ...prev].slice(0, 10));
  };

  const handleDiagnosticDeleted = (id: string) => {
    setDiagnoses(prev => prev.filter(d => d.id !== id));
  };

  // ── Visible items ──
  const visibleDiagnoses = diagnoses.slice(0, 3);
  const hasMore = diagnoses.length > 3;

  return (
    <>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="bg-white rounded-[1.5rem] border border-stone-100 shadow-sm overflow-hidden">

        {/* ── Header ── */}
        <div className="px-4 pt-4 pb-3 border-b border-stone-100">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-[0.6rem] bg-blue-100 text-blue-500 flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-blue-900">Docteur Plante</div>
                <div className="text-[10px] text-blue-300 mt-0.5 truncate">{plantName}</div>
              </div>
            </div>
            {diagnoses.length > 0 && (
              <span className="text-[9px] font-bold text-blue-500 bg-blue-50 border border-blue-200 px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                {diagnoses.length} diagnostic{diagnoses.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* CTA consultation */}
          <button
            onClick={handleTriggerClick}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-[0.9rem] font-bold text-sm flex items-center justify-center gap-2 mt-3 transition-colors active:scale-95"
          >
            <Camera className="w-4 h-4" /> Nouvelle consultation
          </button>
        </div>

        {/* ── Historique (3 derniers) ── */}
        {visibleDiagnoses.length > 0 && (
          <>
            <div className="flex items-center gap-2 px-4 pt-3 pb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-stone-300 whitespace-nowrap">Historique</span>
              <div className="flex-1 h-px bg-stone-100" />
            </div>

            <div className="px-3 pb-3 flex flex-col gap-2">
              {visibleDiagnoses.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDiagnostic(d)}
                  className="w-full text-left flex items-start gap-2 p-2.5 bg-stone-50 rounded-xl border border-stone-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors active:scale-[0.99]"
                >
                  <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md flex-shrink-0 mt-0.5 whitespace-nowrap ${urgencyBadgeStyles(d.urgency)}`}>
                    {d.urgency}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-stone-700 leading-snug line-clamp-2">{d.diagnosis}</p>
                    <p className="text-[9px] text-stone-400 mt-0.5">
                      {new Date(d.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className="text-stone-300 text-xs shrink-0 mt-0.5">›</span>
                </button>
              ))}

              {/* Bouton "Voir l'historique complet" */}
              {hasMore && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold text-blue-500 hover:text-blue-700 transition-colors"
                >
                  <Clock className="w-3 h-3" />
                  Voir l'historique complet ({diagnoses.length})
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Portals ── */}
      {picked && (
        <DoctorPlantFlow
          file={picked.file}
          previewUrl={picked.previewUrl}
          preselectedPlant={{ id: plantId, name: plantName }}
          onClose={closeFlow}
          onDiagnosed={handleDiagnosed}
        />
      )}

      {selectedDiagnostic && (
        <DiagnosticDetailDrawer
          diagnostic={selectedDiagnostic}
          plantId={plantId}
          onClose={() => setSelectedDiagnostic(null)}
          onDeleted={handleDiagnosticDeleted}
        />
      )}

      {showHistory && (
        <DiagnosticHistoryDrawer
          diagnoses={diagnoses}
          onClose={() => setShowHistory(false)}
          onSelect={(d) => {
            setShowHistory(false);
            setSelectedDiagnostic(d);
          }}
        />
      )}
    </>
  );
}
