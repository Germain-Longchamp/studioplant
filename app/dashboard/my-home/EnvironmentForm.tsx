"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Map, MapPin, Loader2, Sparkles, CloudSun } from "lucide-react";
import { toast } from "sonner";
import { updateProfileContext } from "@/server/actions";

export default function EnvironmentForm({ metadata }: { metadata: any }) {
  const [isPendingContext, startTransitionContext] = useTransition();

  const handleContextSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransitionContext(async () => {
      const result = await updateProfileContext(formData);
      if (result?.error) toast.error("Erreur : " + result.error);
      else toast.success("Localisation mise à jour ! 🌱");
    });
  };

  return (
    <section className="bg-white p-6 rounded-[2rem] shadow-xl shadow-stone-200/40 border border-stone-100/60 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shadow-sm border border-emerald-100/50">
          <Map className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-stone-800 tracking-tight">Ma région</h2>
          <p className="text-xs text-stone-500 mt-0.5">Aide-nous à cibler ton climat local.</p>
        </div>
      </div>

      <form onSubmit={handleContextSubmit} className="space-y-6 relative z-10">
        
        <div className="space-y-3">
          <div className="flex items-center justify-between ml-1">
            <Label className="flex items-center gap-2 text-stone-700 font-semibold">
              <MapPin className="w-4 h-4 text-emerald-500" /> Ville ou Région
            </Label>
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">Optionnel</span>
          </div>
          
          <Input 
            name="city" 
            defaultValue={metadata?.city || ""} 
            placeholder="Ex: Lyon, Sud de la France, Bretagne..." 
            className="h-12 rounded-2xl bg-[#FDFCF8] border-stone-200 text-stone-800 font-medium focus:ring-emerald-500" 
          />

          {/* MESSAGE EXPLICATIF */}
          <div className="flex items-start gap-3 p-4 bg-amber-50/80 rounded-2xl border border-amber-100/60 mt-3">
            <CloudSun className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-stone-600 font-medium leading-relaxed">
              Indiquer votre région permet à notre expert de prendre en compte le climat naturel de votre zone (humidité naturelle, forte chaleur estivale...) pour affiner ses conseils d'entretien.
            </p>
          </div>
        </div>

        <Button type="submit" disabled={isPendingContext} className="w-full h-12 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-lg shadow-emerald-900/20 active:scale-95 transition-all">
          {isPendingContext ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2 text-emerald-300" /> Enregistrer ma région</>}
        </Button>
      </form>
    </section>
  );
}
