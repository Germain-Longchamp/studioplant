"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { ScanLine, Loader2, X, ShieldCheck, Sun, Droplets, HeartPulse, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { quickAnalyzePlant } from "@/server/actions";

export default function QuickAnalysis() {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleTriggerClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    startTransition(async () => {
      const result = await quickAnalyzePlant(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success && result.data && result.data.name !== "Erreur") {
        setAnalysisResult(result.data);
      } else {
        toast.error("Oups, je ne reconnais pas de plante sur cette photo.");
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  const getRobustnessColor = (score: number) => {
    if (score >= 8) return "bg-emerald-500";
    if (score >= 5) return "bg-amber-400";
    return "bg-rose-500";
  };

  const popupContent = analysisResult ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-5 animate-in fade-in duration-200" onClick={() => setAnalysisResult(null)}>
      <div className="bg-[#FDFCF8] w-full max-w-sm rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* EN-TÊTE FIXE */}
        <div className="bg-emerald-900 bg-gradient-to-b from-emerald-800 to-emerald-950 p-6 relative shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setAnalysisResult(null)} className="absolute top-4 right-4 text-emerald-300 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </Button>
          <div className="mb-2 p-2 bg-white/10 w-fit rounded-xl backdrop-blur-sm">
            <ScanLine className="w-6 h-6 text-emerald-300" />
          </div>
          <h3 className="font-extrabold text-white text-2xl tracking-tight leading-tight pr-8">{analysisResult.name}</h3>
          <p className="text-emerald-300/80 font-medium italic text-sm mt-0.5">{analysisResult.species}</p>
        </div>

        {/* CORPS SCROLLABLE */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Robustesse
              </h4>
              <span className="font-extrabold text-stone-800 text-sm">{analysisResult.robustness} / 10</span>
            </div>
            <div className="h-2.5 w-full bg-stone-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${getRobustnessColor(analysisResult.robustness)}`} 
                style={{ width: `${(analysisResult.robustness / 10) * 100}%` }}
              />
            </div>
            <p className="text-sm text-stone-600 font-medium">{analysisResult.robustness_comment}</p>
          </div>

          <div className="h-px w-full bg-stone-100" />

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-amber-50/50 border border-amber-100/50 p-3 rounded-2xl">
              <Sun className="w-4 h-4 text-amber-500 mb-1.5" />
              <p className="text-[10px] uppercase font-bold text-amber-800/60 mb-0.5">Lumière</p>
              <p className="text-xs font-semibold text-stone-700 leading-tight">{analysisResult.light}</p>
            </div>
            <div className="bg-sky-50/50 border border-sky-100/50 p-3 rounded-2xl">
              <Droplets className="w-4 h-4 text-sky-500 mb-1.5" />
              <p className="text-[10px] uppercase font-bold text-sky-800/60 mb-0.5">Arrosage</p>
              <p className="text-xs font-semibold text-stone-700 leading-tight">{analysisResult.water}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-stone-50 p-3 rounded-2xl">
              <HeartPulse className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-stone-400 mb-0.5">Toxicité (Animaux)</p>
                <p className="text-xs font-semibold text-stone-700">{analysisResult.toxicity}</p>
              </div>
            </div>

            {analysisResult.match_comment && (
              <div className="flex items-start gap-3 bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-emerald-600 mb-0.5">Match avec chez vous</p>
                  <p className="text-xs font-semibold text-emerald-900">{analysisResult.match_comment}</p>
                </div>
              </div>
            )}
          </div>

          <Button onClick={() => setAnalysisResult(null)} className="w-full h-12 shrink-0 rounded-[1.25rem] bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold active:scale-95 transition-all shadow-none">
            Fermer l'analyse
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

      {/* NOUVEAU DESIGN : Très doux, clair et harmonieux */}
      <button 
        onClick={handleTriggerClick}
        disabled={isPending}
        className="w-full bg-white rounded-[2rem] p-5 flex items-center gap-4 shadow-lg shadow-stone-200/40 border border-stone-100/60 transition-all hover:shadow-xl hover:border-emerald-200 active:scale-95 group"
      >
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0 transition-transform group-hover:scale-105">
          {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <ScanLine className="w-6 h-6" />}
        </div>
        <div className="text-left flex-1">
          <h3 className="font-bold text-stone-800 text-lg leading-tight">
            {isPending ? "Analyse en cours..." : "Scan en jardinerie"}
          </h3>
          <p className="text-stone-500 text-sm font-medium mt-0.5">
            {isPending ? "Recherche de la plante..." : "Analysez une plante avant achat"}
          </p>
        </div>
      </button>

      {mounted && analysisResult && createPortal(popupContent, document.body)}
    </>
  );
}
