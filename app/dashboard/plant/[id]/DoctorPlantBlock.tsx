"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Stethoscope, Camera, Loader2, AlertTriangle, CheckCircle, X, Copy, BookOpen, Clock } from "lucide-react";
import { toast } from "sonner";
import { diagnoseSickPlant, appendDiagnosisToNotes } from "@/server/actions";
import type { PlantDiagnostic } from "@/server/actions";
import DiagnosticDetailDrawer from "./DiagnosticDetailDrawer";
import DiagnosticHistoryDrawer from "./DiagnosticHistoryDrawer";

function urgencyBadgeStyles(urgency: string) {
  if (urgency === "Haute")   return "bg-rose-50 text-rose-700 border border-rose-100";
  if (urgency === "Moyenne") return "bg-amber-50 text-amber-700 border border-amber-100";
  return "bg-emerald-50 text-emerald-700 border border-emerald-100";
}

function urgencyBanner(urgency: string) {
  switch (urgency?.toLowerCase()) {
    case "haute":   return "bg-rose-500";
    case "moyenne": return "bg-orange-500";
    case "faible":  return "bg-emerald-500";
    default:        return "bg-stone-400";
  }
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
  // ── SOS state ──
  const [isPending, startTransition]           = useTransition();
  const [isSaving, startSavingTransition]      = useTransition();
  const fileInputRef                           = useRef<HTMLInputElement>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<{ diagnosis: string; urgency: string; action: string } | null>(null);
  const [mounted, setMounted]                  = useState(false);

  // ── History state ──
  const [diagnoses, setDiagnoses]                   = useState<PlantDiagnostic[]>(initialDiagnoses);
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<PlantDiagnostic | null>(null);
  const [showHistory, setShowHistory]               = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // ── SOS handlers ──
  const handleTriggerClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    startTransition(async () => {
      const result = await diagnoseSickPlant(plantId, formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success && result.data) {
        setDiagnosisResult(result.data);
        // Prepend new diagnosis to local state (revalidatePath handles SSR refresh)
        const newEntry: PlantDiagnostic = {
          id: crypto.randomUUID(),
          diagnosis: result.data.diagnosis,
          urgency: result.data.urgency,
          action: result.data.action,
          created_at: new Date().toISOString(),
        };
        setDiagnoses(prev => [newEntry, ...prev].slice(0, 10));
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  const handleCopy = () => {
    if (!diagnosisResult) return;
    const text = `Diagnostic : ${diagnosisResult.diagnosis}\nUrgence : ${diagnosisResult.urgency}\nPlan d'action :\n${diagnosisResult.action}`;
    navigator.clipboard.writeText(text).then(() => toast.success("Ordonnance copiée !"));
  };

  const handleSaveToNotes = () => {
    if (!diagnosisResult) return;
    startSavingTransition(async () => {
      const noteContent = `Diagnostic : ${diagnosisResult.diagnosis}\nUrgence : ${diagnosisResult.urgency}\nPlan d'action :\n${diagnosisResult.action}`;
      const result = await appendDiagnosisToNotes(plantId, noteContent);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Sauvegardé dans les notes d'entretien !");
        setDiagnosisResult(null);
      }
    });
  };

  const handleDiagnosticDeleted = (id: string) => {
    setDiagnoses(prev => prev.filter(d => d.id !== id));
  };

  // ── Visible items ──
  const visibleDiagnoses = diagnoses.slice(0, 3);
  const hasMore = diagnoses.length > 3;

  // ── Result modal ──
  const popupContent = diagnosisResult ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-5 animate-in fade-in duration-200"
      onClick={() => setDiagnosisResult(null)}
    >
      <div
        className="bg-[#FDFCF8] w-full max-w-sm rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* BANDEAU D'URGENCE */}
        <div className={`${urgencyBanner(diagnosisResult.urgency)} px-5 py-2.5 flex items-center justify-between shrink-0 rounded-t-[2rem]`}>
          <span className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Urgence {diagnosisResult.urgency}
          </span>
          <Button
            variant="ghost" size="icon"
            onClick={() => setDiagnosisResult(null)}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-full h-7 w-7"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* HEADER */}
        <div className="bg-blue-900 bg-gradient-to-b from-blue-800 to-blue-950 p-6 relative shrink-0">
          <div className="flex gap-4 items-center">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm shrink-0">
              <Stethoscope className="w-7 h-7 text-blue-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-xl tracking-tight leading-tight">{plantName}</h3>
              <p className="text-blue-300 text-sm font-medium mt-0.5">Diagnostic terminé</p>
            </div>
          </div>
        </div>

        {/* CONTENU */}
        <div className="p-6 space-y-5 overflow-y-auto">
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">Ce qu'il se passe</h4>
            <p className="text-sm text-stone-700 leading-relaxed font-medium">{diagnosisResult.diagnosis}</p>
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Plan d'action
            </h4>
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{diagnosisResult.action}</p>
          </div>

          <div className="flex gap-2.5">
            <Button onClick={handleCopy} variant="outline" className="flex-1 h-11 rounded-2xl text-sm font-semibold border-stone-200 gap-2">
              <Copy className="w-4 h-4" /> Copier
            </Button>
            <Button
              onClick={handleSaveToNotes}
              disabled={isSaving}
              variant="outline"
              className="flex-1 h-11 rounded-2xl text-sm font-semibold border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
              Dans les notes
            </Button>
          </div>

          <Button
            onClick={() => setDiagnosisResult(null)}
            className="w-full h-12 rounded-[1.25rem] bg-stone-900 hover:bg-stone-800 text-white font-bold shadow-lg shadow-stone-900/20 active:scale-95 transition-all"
          >
            J'ai compris, merci !
          </Button>
        </div>
      </div>
    </div>
  ) : null;

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
            disabled={isPending}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-[0.9rem] font-bold text-sm flex items-center justify-center gap-2 mt-3 transition-colors active:scale-95"
          >
            {isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyse en cours…</>
              : <><Camera className="w-4 h-4" /> Nouvelle consultation</>
            }
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
      {mounted && createPortal(popupContent, document.body)}

      {mounted && selectedDiagnostic && (
        <DiagnosticDetailDrawer
          diagnostic={selectedDiagnostic}
          plantId={plantId}
          onClose={() => setSelectedDiagnostic(null)}
          onDeleted={handleDiagnosticDeleted}
        />
      )}

      {mounted && showHistory && (
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
