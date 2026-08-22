"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { ScanLine, Loader2, X, ShieldCheck, Sun, Droplets, HeartPulse, Sparkles, History, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { quickAnalyzePlant, getQuickScansHistory } from "@/server/actions";
import { compressImage } from "@/lib/utils";

export default function QuickAnalysis() {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // États pour les modales
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleTriggerClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Photo compressée avant upload — même correctif que sur l'ajout de plante et
    // Docteur Plante, pour éviter de dépasser la limite de taille de la Server Action.
    const compressedFile = await compressImage(file);

    const formData = new FormData();
    formData.append("image", compressedFile);

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

  // Charger l'historique
  const handleOpenHistory = async () => {
    setShowHistory(true);
    setIsLoadingHistory(true);
    const result = await getQuickScansHistory();
    if (result.success && result.data) {
      setHistoryData(result.data);
    } else {
      toast.error("Impossible de charger l'historique.");
    }
    setIsLoadingHistory(false);
  };

  // Clic sur un élément de l'historique
  const handleHistoryClick = (scan: any) => {
    setShowHistory(false);
    setAnalysisResult(scan); // Réouvre la belle fiche de score
  };

  const getRobustnessColor = (score: number) => {
    if (score >= 8) return "bg-emerald-500";
    if (score >= 5) return "bg-amber-400";
    return "bg-rose-500";
  };

  // MODALE : FICHE DE SCORE (inchangée)
  const popupContent = analysisResult ? (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-5 animate-in fade-in duration-200" onClick={() => setAnalysisResult(null)}>
      <div className="bg-[#FDFCF8] w-full max-w-sm rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        
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
            Fermer
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  // MODALE : HISTORIQUE
  const historyContent = showHistory ? (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-stone-900/60 backdrop-blur-sm sm:p-5 animate-in fade-in duration-200" onClick={() => setShowHistory(false)}>
      <div className="bg-[#FDFCF8] w-full max-w-md h-[85vh] sm:h-auto sm:max-h-[85vh] sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        <div className="p-6 text-center relative border-b border-stone-100 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full">
            <X className="w-5 h-5" />
          </Button>
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
            <History className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-stone-900 text-xl tracking-tight">Historique des scans</h3>
        </div>

        <div className="p-4 overflow-y-auto flex-1 bg-stone-50/50">
          {isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center py-12 text-stone-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
              <p className="text-sm font-medium">Chargement de vos découvertes...</p>
            </div>
          ) : historyData.length === 0 ? (
            <div className="text-center py-12 px-6">
              <ScanLine className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500 font-medium">Vous n'avez pas encore scanné de plantes. Rendez-vous en jardinerie !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyData.map((scan) => (
                <div 
                  key={scan.id} 
                  onClick={() => handleHistoryClick(scan)}
                  className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all active:scale-[0.98] group"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-bold text-stone-800 truncate mb-0.5">{scan.name}</h4>
                    <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide">
                      {new Date(scan.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} • Score : <span className={scan.robustness >= 8 ? 'text-emerald-500' : scan.robustness >= 5 ? 'text-amber-500' : 'text-rose-500'}>{scan.robustness}/10</span>
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center group-hover:bg-emerald-50 text-stone-400 group-hover:text-emerald-600 transition-colors shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
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

      {/* BOUTON PRINCIPAL */}
      <button 
        onClick={handleTriggerClick}
        disabled={isPending}
        className="w-full bg-emerald-50/80 rounded-[2rem] p-5 flex items-center gap-4 shadow-sm border border-emerald-200/60 transition-all hover:bg-emerald-100/50 hover:shadow-md active:scale-95 group"
      >
        <div className="p-3 bg-emerald-500 text-white rounded-2xl shrink-0 transition-transform group-hover:scale-105 shadow-sm shadow-emerald-500/20">
          {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <ScanLine className="w-6 h-6" />}
        </div>
        <div className="text-left flex-1">
          <h3 className="font-bold text-emerald-950 text-lg leading-tight">
            {isPending ? "Analyse en cours..." : "Scan rapide"}
          </h3>
          <p className="text-emerald-700/80 text-sm font-medium mt-0.5">
            {isPending ? "Recherche de la plante..." : "Analysez une plante avant achat"}
          </p>
        </div>
      </button>

      {/* NOUVEAU : BOUTON HISTORIQUE SOUS LE SCAN */}
      <button 
        onClick={handleOpenHistory}
        className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-emerald-700/60 hover:text-emerald-800 hover:bg-emerald-50/80 transition-all active:scale-95"
      >
        <History className="w-3.5 h-3.5" />
        Voir l'historique des scans
      </button>

      {mounted && createPortal(popupContent, document.body)}
      {mounted && createPortal(historyContent, document.body)}
    </div>
  );
}
