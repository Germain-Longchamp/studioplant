"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { createPortal } from "react-dom"; 
import { Button } from "@/components/ui/button";
import { Stethoscope, Loader2, AlertTriangle, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";
import { diagnoseSickPlant } from "@/server/actions";

export default function SosFeature({ plantId }: { plantId: string }) {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<any>(null);
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTriggerClick = () => {
    fileInputRef.current?.click();
  };

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

  const getUrgencyStyles = (urgency: string) => {
    if (urgency === "Haute") return "bg-rose-100 text-rose-800 border-rose-200";
    if (urgency === "Moyenne") return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  };

  const popupContent = diagnosisResult ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-5 animate-in fade-in duration-200" onClick={() => setDiagnosisResult(null)}>
      <div className="bg-[#FDFCF8] w-full max-w-sm rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        
        <div className="bg-rose-50 p-6 text-center relative border-b border-rose-100 shrink-0 rounded-t-[2rem]">
          <Button variant="ghost" size="icon" onClick={() => setDiagnosisResult(null)} className="absolute top-4 right-4 text-rose-400 hover:text-rose-600 hover:bg-rose-100/50 rounded-full">
            <X className="w-5 h-5" />
          </Button>
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-rose-500">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-rose-900 text-xl tracking-tight">Diagnostic terminé</h3>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">Ce qu'il se passe</h4>
            <p className="text-sm text-stone-700 leading-relaxed font-medium">
              {diagnosisResult.diagnosis}
            </p>
          </div>

          <div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${getUrgencyStyles(diagnosisResult.urgency)}`}>
              <AlertTriangle className="w-3.5 h-3.5" />
              Urgence : {diagnosisResult.urgency}
            </div>
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Plan d'action
            </h4>
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
              {diagnosisResult.action}
            </p>
          </div>

          <Button onClick={() => setDiagnosisResult(null)} className="w-full h-12 shrink-0 rounded-[1.25rem] bg-stone-900 hover:bg-stone-800 text-white font-bold shadow-lg shadow-stone-900/20 active:scale-95 transition-all">
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

      {/* NOUVEAU DESIGN : Même logique que le "Scan rapide" (Pastel + Icône vive) */}
      <button 
        onClick={handleTriggerClick}
        disabled={isPending}
        className="w-full bg-rose-50/80 rounded-[2rem] p-5 flex items-center gap-4 shadow-sm border border-rose-200/60 transition-all hover:bg-rose-100/50 hover:shadow-md active:scale-95 group mt-4"
      >
        <div className="p-3 bg-rose-500 text-white rounded-2xl shrink-0 transition-transform group-hover:scale-105 shadow-sm shadow-rose-500/20">
          {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Stethoscope className="w-6 h-6" />}
        </div>
        <div className="text-left flex-1">
          <h3 className="font-bold text-rose-950 text-lg leading-tight">
            {isPending ? "Analyse en cours..." : "Docteur Plante"}
          </h3>
          <p className="text-rose-700/80 text-sm font-medium mt-0.5">
            {isPending ? "On examine vos feuilles" : "Un problème ? Prenez une photo."}
          </p>
        </div>
      </button>

      {mounted && diagnosisResult && createPortal(popupContent, document.body)}
    </>
  );
}
