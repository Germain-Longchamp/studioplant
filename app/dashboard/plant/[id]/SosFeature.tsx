"use client";

import { useState, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Stethoscope, Loader2, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { toast } from "sonner";
import { diagnoseSickPlant } from "@/server/actions";

export default function SosFeature({ plantId }: { plantId: string }) {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<any>(null);

  // Déclenche l'ouverture de la caméra/galerie
  const handleTriggerClick = () => {
    fileInputRef.current?.click();
  };

  // Gère l'envoi de la photo
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
      // On reset l'input pour pouvoir reprendre une photo si besoin
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  // Couleurs dynamiques selon l'urgence
  const getUrgencyStyles = (urgency: string) => {
    if (urgency === "Haute") return "bg-rose-100 text-rose-800 border-rose-200";
    if (urgency === "Moyenne") return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  };

  return (
    <>
      {/* INPUT CACHÉ POUR LA CAMÉRA */}
      <input
        type="file"
        accept="image/*"
        capture="environment" // Sur mobile, privilégie l'appareil photo arrière
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* BOUTON D'APPEL SOS */}
      <button 
        onClick={handleTriggerClick}
        disabled={isPending}
        className="w-full relative overflow-hidden group bg-gradient-to-r from-rose-500 to-rose-600 rounded-[1.5rem] p-4 flex items-center gap-4 shadow-lg shadow-rose-500/20 transition-transform active:scale-95"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-colors"></div>
        <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white shrink-0 relative z-10">
          {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Stethoscope className="w-6 h-6" />}
        </div>
        <div className="text-left relative z-10 flex-1">
          <h3 className="font-bold text-white text-lg leading-tight">
            {isPending ? "Analyse en cours..." : "SOS Plante Malade"}
          </h3>
          <p className="text-rose-100 text-xs font-medium mt-0.5">
            {isPending ? "Gemini examine la photo" : "Prenez une photo de la feuille malade"}
          </p>
        </div>
      </button>

      {/* POPUP DE DIAGNOSTIC */}
      {diagnosisResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-5 animate-in fade-in duration-200" onClick={() => setDiagnosisResult(null)}>
          <div className="bg-[#FDFCF8] w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            
            <div className="bg-rose-50 p-6 text-center relative border-b border-rose-100">
              <Button variant="ghost" size="icon" onClick={() => setDiagnosisResult(null)} className="absolute top-4 right-4 text-rose-400 hover:text-rose-600 hover:bg-rose-100/50 rounded-full">
                <X className="w-5 h-5" />
              </Button>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-rose-500">
                <Stethoscope className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-rose-900 text-xl tracking-tight">Diagnostic terminé</h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Le diagnostic */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">Ce qu'il se passe</h4>
                <p className="text-sm text-stone-700 leading-relaxed font-medium">
                  {diagnosisResult.diagnosis}
                </p>
              </div>

              {/* L'urgence */}
              <div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${getUrgencyStyles(diagnosisResult.urgency)}`}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Urgence : {diagnosisResult.urgency}
                </div>
              </div>

              {/* L'action à prendre */}
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Plan d'action
                </h4>
                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                  {diagnosisResult.action}
                </p>
              </div>

              <Button onClick={() => setDiagnosisResult(null)} className="w-full h-12 rounded-[1.25rem] bg-stone-900 hover:bg-stone-800 text-white font-bold shadow-lg shadow-stone-900/20 active:scale-95 transition-all">
                J'ai compris, merci !
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
