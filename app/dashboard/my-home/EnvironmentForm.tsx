"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Map, Home as HomeIcon, MapPin, Loader2, Sparkles, Building2 } from "lucide-react";
import { toast } from "sonner";
import { updateProfileContext } from "@/server/actions";

export default function EnvironmentForm({ metadata }: { metadata: any }) {
  const [isPendingContext, startTransitionContext] = useTransition();
  const [homeType, setHomeType] = useState(metadata?.home_type || "");

  const handleContextSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransitionContext(async () => {
      const result = await updateProfileContext(formData);
      if (result?.error) toast.error("Erreur : " + result.error);
      else toast.success("Habitation mise à jour !");
    });
  };

  return (
    <section className="bg-white p-6 rounded-[2rem] shadow-xl shadow-stone-200/40 border border-stone-100/60 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
          <Map className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-stone-800 tracking-tight">Mon habitation</h2>
        </div>
      </div>

      <form onSubmit={handleContextSubmit} className="space-y-6 relative z-10">
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1">
            <HomeIcon className="w-4 h-4 text-emerald-500" /> Type de logement
          </Label>
          <input type="hidden" name="home_type" value={homeType} />
          <div className="flex gap-3">
            <button type="button" onClick={() => setHomeType("Appartement")} className={`flex-1 flex flex-col items-center justify-center gap-2.5 p-4 rounded-[1.25rem] border-2 transition-all active:scale-95 ${homeType === "Appartement" ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm" : "border-stone-100 bg-[#FDFCF8] text-stone-400 hover:border-stone-200 hover:text-stone-600"}`}>
              <Building2 className={`w-6 h-6 ${homeType === "Appartement" ? "text-emerald-600" : "text-stone-300"}`} />
              <span className="text-sm font-bold">Appartement</span>
            </button>
            <button type="button" onClick={() => setHomeType("Maison")} className={`flex-1 flex flex-col items-center justify-center gap-2.5 p-4 rounded-[1.25rem] border-2 transition-all active:scale-95 ${homeType === "Maison" ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm" : "border-stone-100 bg-[#FDFCF8] text-stone-400 hover:border-stone-200 hover:text-stone-600"}`}>
              <HomeIcon className={`w-6 h-6 ${homeType === "Maison" ? "text-emerald-600" : "text-stone-300"}`} />
              <span className="text-sm font-bold">Maison</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1">
            <MapPin className="w-4 h-4 text-emerald-500" /> Région (Climat)
          </Label>
          <Input name="city" defaultValue={metadata?.city || ""} placeholder="Ex: Lyon, Centre-ville" className="h-12 rounded-2xl bg-[#FDFCF8] border-stone-200 text-stone-800" />
        </div>

        <Button type="submit" disabled={isPendingContext} className="w-full h-12 rounded-[1.25rem] bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-lg shadow-emerald-900/20 active:scale-95 transition-all">
          {isPendingContext ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2 text-emerald-300" /> Enregistrer l'habitation</>}
        </Button>
      </form>
    </section>
  );
}
