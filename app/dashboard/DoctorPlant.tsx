"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Stethoscope, Loader2, X, Activity, HeartPulse, ChevronRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { quickDiagnosePlant } from "@/server/actions";

export default function DoctorPlant() {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // États pour la modale de résultat
  const [diagnosisResult, setDiagnosisResult] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleTriggerClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Créer une URL temporaire pour afficher l'image scannée dans la modale
    const tempUrl = URL.createObjectURL(file);
    setPreviewUrl(tempUrl);

    const formData = new FormData();
    formData.append("image", file);

    startTransition(async () => {
      const result = await quickDiagnosePlant(formData);
      if (result.error) {
        toast.error(result.error);
        setPreviewUrl(null);
      } else if (result.success && result.data) {
        setDiagnosisResult(result.data);
      } else {
        toast.error("Oups, je n'ai pas pu analyser cette plante.");
        setPreviewUrl(null);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  const closeModale = () => {
    setDiagnosisResult(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case "haute": return "bg-rose-500 text-white";
      case "moyenne": return "bg-orange-500 text-white";
      case "faible": return "bg-emerald-500 text-white";
      default: return "bg-stone-400 text-white";
    }
  };

  const getUrgencyBg = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case "haute": return "bg-rose-50 border-rose-100";
      case "moyenne": return "bg-orange-50 border-orange-100";
      case "faible": return "bg-emerald-50 border-emerald-100";
      default: return "bg-stone-50 border-stone-100";
    }
  };

  // MODALE : ORDONNANCE (Inspirée de la Fiche de Score)
  const popupContent = diagnosisResult ? (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-5 animate-in fade-in duration-200" onClick={closeModale}>
      <div className="bg-[#FDFCF8] w-full max-w-sm rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* HEADER BLEU ROI */}
        <div className="bg-blue-900 bg-gradient-to-b from-blue-800 to-blue-950 p-6 relative shrink-0">
          <Button variant="ghost" size="icon" onClick={closeModale} className="absolute top-4 right-4 text-blue-300 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10">
            <X className="w-5 h-5" />
          </Button>
          
          <div className="flex gap-4 items-center">
            {previewUrl ? (
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/20 shadow-inner shrink-0 bg-blue-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Patient" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="mb-2 p-2 bg-white/10 w-fit rounded-xl backdrop-blur-sm">
                <Stethoscope className="w-6 h-6 text-blue-300" />
              </div>
            )}
            <div>
              <h3 className="font-extrabold text-white text-xl tracking-tight leading-tight pr-8">{diagnosisResult.name}</h3>
              <div className="flex items-center gap-1.5 mt-2">
                <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${getUrgencyColor(diagnosisResult.urgency)}`}>
                  <Activity className="w-3 h-3" />
                  Urgence {diagnosisResult.urgency}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENU DE L'ORDONNANCE */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800/60 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Diagnostic
            </h4>
            <div className={`p-4 rounded-2xl border ${getUrgencyBg(diagnosisResult.urgency)}`}>
              <p className="text-sm text-stone-700 font-semibold leading-relaxed">
                {diagnosisResult.diagnosis}
              </p>
            </div>
          </div>

          <div className="h-px w-full bg-stone-100" />

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF7F50] flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4" /> Ordonnance
            </h4>
            <div className="bg-[#FF7F50]/5 p-4 rounded-2xl border border-[#FF7F50]/20">
              <p className="text-sm font-semibold text-stone-700 leading-relaxed whitespace-pre-wrap">
                {diagnosisResult.action}
              </p>
            </div>
          </div>

          <Button onClick={closeModale} className="w-full h-12 shrink-0 rounded-[1.25rem] bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold active:scale-95 transition-all shadow-none">
            Fermer l'ordonnance
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="flex flex-col items-center">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* BOUTON PRINCIPAL (Design Jumeau de QuickAnalysis) */}
      <button 
        onClick={handleTriggerClick}
        disabled={isPending}
        className="w-full bg-blue-50/80 rounded-[2rem] p-5 flex items-center gap-4 shadow-sm border border-blue-200/60 transition-all hover:bg-blue-100/50 hover:shadow-md active:scale-95 group"
      >
        <div className="p-3 bg-blue-600 text-white rounded-2xl shrink-0 transition-transform group-hover:scale-105 shadow-sm shadow-blue-600/20">
          {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Stethoscope className="w-6 h-6" />}
        </div>
        <div className="text-left flex-1">
          <h3 className="font-bold text-blue-950 text-lg leading-tight">
            {isPending ? "Analyse en cours..." : "Docteur Plante"}
          </h3>
          <p className="text-blue-700/80 text-sm font-medium mt-0.5">
            {isPending ? "Recherche des symptômes..." : "Faites un diagnostic rapide d'une plante"}
          </p>
        </div>
        {!isPending && (
           <ChevronRight className="w-5 h-5 text-blue-300 group-hover:text-blue-500 transition-colors shrink-0" />
        )}
      </button>

      {/* PORTAL POUR LA MODALE */}
      {mounted && createPortal(popupContent, document.body)}
    </div>
  );
}