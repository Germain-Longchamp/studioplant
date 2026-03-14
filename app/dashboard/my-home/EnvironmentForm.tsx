"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Map, Sun, Home as HomeIcon, MapPin, Loader2, Sparkles, Building2, Compass, Thermometer } from "lucide-react";
import { toast } from "sonner";
import { updateProfileContext } from "@/server/actions";

export default function EnvironmentForm({ metadata }: { metadata: any }) {
  const [isPendingContext, startTransitionContext] = useTransition();

  const [homeType, setHomeType] = useState(metadata?.home_type || "");
  const [orientations, setOrientations] = useState<string[]>(
    metadata?.orientation ? metadata.orientation.split('-') : []
  );

  const toggleOrientation = (dir: string) => {
    if (orientations.includes(dir)) {
      setOrientations(orientations.filter(d => d !== dir));
    } else {
      if (orientations.length < 2) {
        setOrientations([...orientations, dir]);
      } else {
        setOrientations([orientations[0], dir]);
      }
    }
  };

  const handleContextSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransitionContext(async () => {
      const result = await updateProfileContext(formData);
      if (result?.error) toast.error("Erreur : " + result.error);
      else toast.success("Contexte mis à jour ! 🌱 Nos conseils s'adapteront.");
    });
  };

  return (
    <section className="bg-white p-6 rounded-[2rem] shadow-xl shadow-stone-200/40 border border-stone-100/60 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
          <Map className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-stone-800 tracking-tight">Environnement</h2>
          <p className="text-xs text-stone-500 mt-0.5">Aide nous à te donner de meilleurs conseils pour entretenir ta jungle.</p>
        </div>
      </div>

      <form onSubmit={handleContextSubmit} className="space-y-6 relative z-10">
        
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1">
            <HomeIcon className="w-4 h-4 text-emerald-500" /> Habitation
          </Label>
          
          <input type="hidden" name="home_type" value={homeType} />
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setHomeType("Appartement")}
              className={`flex-1 flex flex-col items-center justify-center gap-2.5 p-4 rounded-[1.25rem] border-2 transition-all active:scale-95 ${
                homeType === "Appartement" 
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm" 
                  : "border-stone-100 bg-[#FDFCF8] text-stone-400 hover:border-stone-200 hover:text-stone-600"
              }`}
            >
              <Building2 className={`w-7 h-7 ${homeType === "Appartement" ? "text-emerald-600" : "text-stone-300"}`} />
              <span className="text-sm font-bold">Appartement</span>
            </button>

            <button
              type="button"
              onClick={() => setHomeType("Maison")}
              className={`flex-1 flex flex-col items-center justify-center gap-2.5 p-4 rounded-[1.25rem] border-2 transition-all active:scale-95 ${
                homeType === "Maison" 
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm" 
                  : "border-stone-100 bg-[#FDFCF8] text-stone-400 hover:border-stone-200 hover:text-stone-600"
              }`}
            >
              <HomeIcon className={`w-7 h-7 ${homeType === "Maison" ? "text-emerald-600" : "text-stone-300"}`} />
              <span className="text-sm font-bold">Maison</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1">
            <MapPin className="w-4 h-4 text-emerald-500" /> Ville / Région
          </Label>
          <Input name="city" defaultValue={metadata?.city || ""} placeholder="Ex: Lyon, Centre-ville" className="h-12 rounded-2xl bg-[#FDFCF8] border-stone-200 text-stone-800" />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1 text-sm">
              <Compass className="w-4 h-4 text-emerald-500" /> Orientation
            </Label>
            
            <input type="hidden" name="orientation" value={orientations.join('-')} />
            
            <div className="grid grid-cols-2 gap-2">
              {['Nord', 'Sud', 'Est', 'Ouest'].map((dir) => {
                const isSelected = orientations.includes(dir);
                return (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => toggleOrientation(dir)}
                    className={`py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border-2 active:scale-95 ${
                      isSelected 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                        : 'border-stone-100 bg-[#FDFCF8] text-stone-500 hover:border-stone-200'
                    }`}
                  >
                    {dir}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-stone-400 font-medium ml-1">Jusqu'à 2 choix (ex: Sud-Est)</p>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1 text-sm">
              <Sun className="w-4 h-4 text-amber-500" /> Luminosité
            </Label>
            <select name="light_level" defaultValue={metadata?.light_level || ""} className="flex h-12 w-full rounded-2xl border border-stone-200 bg-[#FDFCF8] px-4 text-sm text-stone-800 focus:ring-2 focus:ring-emerald-500/50 outline-none">
              <option value="">...</option>
              <option value="Faible">Faible</option>
              <option value="Moyenne">Moyenne</option>
              <option value="Forte">Forte</option>
            </select>
          </div>
        </div>

        {/* NOUVEAU BLOC: TEMPÉRATURES */}
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1 text-sm">
              <Thermometer className="w-4 h-4 text-rose-500" /> Temp. Été
            </Label>
            <div className="relative">
              <Input type="number" name="temp_summer" defaultValue={metadata?.temp_summer || ""} placeholder="Ex: 25" className="h-12 rounded-2xl bg-[#FDFCF8] border-stone-200 text-stone-800 pr-8" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">°C</span>
            </div>
          </div>
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1 text-sm">
              <Thermometer className="w-4 h-4 text-sky-500" /> Temp. Hiver
            </Label>
            <div className="relative">
              <Input type="number" name="temp_winter" defaultValue={metadata?.temp_winter || ""} placeholder="Ex: 19" className="h-12 rounded-2xl bg-[#FDFCF8] border-stone-200 text-stone-800 pr-8" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">°C</span>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isPendingContext} className="w-full h-12 rounded-[1.25rem] bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-lg shadow-emerald-900/20 active:scale-95 transition-all mt-4">
          {isPendingContext ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2 text-emerald-300" /> Enregistrer le contexte</>}
        </Button>
      </form>
    </section>
  );
}