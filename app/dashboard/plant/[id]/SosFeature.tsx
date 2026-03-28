"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Stethoscope, Loader2, AlertTriangle, CheckCircle, X, Copy, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { diagnoseSickPlant, appendDiagnosisToNotes } from "@/server/actions";

interface SosFeatureProps {
  plantId: string;
  plantName: string;
}

export default function SosFeature({ plantId, plantName }: SosFeatureProps) {
  const [isPending, startTransition] = useTransition();
  const [isSaving, startSavingTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<any>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const handleTriggerClick = () => { fileInputRef.current?.click(); };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  const getUrgencyBanner = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case "haute":    return "bg-rose-500";
      case "moyenne":  return "bg-orange-500";
      case "faible":   return "bg-emerald-500";
      default:         return "bg-stone-400";
    }
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
        <div className={`${getUrgencyBanner(diagnosisResult.urgency)} px-5 py-2.5 flex items-center justify-between shrink-0 rounded-t-[2rem]`}>
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

        {/* HEADER BLEU ROI */}
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
            <p className="text-sm text-stone-700 leading-relaxed font-medium">
              {diagnosisResult.diagnosis}
            </p>
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Plan d'action
            </h4>
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
              {diagnosisResult.action}
            </p>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-2.5">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1 h-11 rounded-2xl text-sm font-semibold border-stone-200 gap-2"
            >
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

      <button
        onClick={handleTriggerClick}
        disabled={isPending}
        className="w-full bg-blue-50/80 rounded-[2rem] p-5 flex items-center gap-4 shadow-sm border border-blue-200/60 transition-all hover:bg-blue-100/50 hover:shadow-md active:scale-95 group mt-4"
      >
        <div className="p-3 bg-blue-600 text-white rounded-2xl shrink-0 transition-transform group-hover:scale-105 shadow-sm shadow-blue-600/20">
          {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Stethoscope className="w-6 h-6" />}
        </div>
        <div className="text-left flex-1">
          <h3 className="font-bold text-blue-950 text-lg leading-tight">
            {isPending ? "Analyse en cours..." : `SOS – ${plantName}`}
          </h3>
          <p className="text-blue-700/80 text-sm font-medium mt-0.5">
            {isPending ? "On examine vos feuilles" : "Analyse basée sur son historique et son environnement"}
          </p>
        </div>
      </button>

      {mounted && diagnosisResult && createPortal(popupContent, document.body)}
    </>
  );
}
