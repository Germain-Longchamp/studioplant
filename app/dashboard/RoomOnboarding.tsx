"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DoorOpen, Compass, Sun, Droplets, Thermometer, ArrowRight, X, Sparkles, Cloud, SunDim, Wind, Loader2 } from "lucide-react";
import { saveRoom } from "@/server/actions";

// 🟢 1. Ajout de la prop "show"
export default function RoomOnboarding({ show }: { show: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();

  // 🟢 2. Sécurisation de l'ouverture
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (show && !hasTriggered.current) {
      hasTriggered.current = true;
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [show]);

  const [orientations, setOrientations] = useState<string[]>([]);
  const [lightLevel, setLightLevel] = useState("Moyenne");
  const [humidityLevel, setHumidityLevel] = useState("Normale");

  if (!isOpen) return null;

  const toggleOrientation = (dir: string) => {
    if (orientations.includes(dir)) {
      setOrientations(orientations.filter(d => d !== dir));
    } else {
      if (orientations.length < 2) setOrientations([...orientations, dir]);
      else setOrientations([orientations[0], dir]);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await saveRoom(formData);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Magnifique ! Votre première pièce est créée. 🎉");
        setIsOpen(false);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-300">
      
      <div className="relative w-full max-w-md bg-[#FDFCF8] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        
        {/* ÉTAPE 1 : L'ANNONCE (Design Immersif Vert) */}
        {step === 1 && (
          <div className="bg-emerald-900 bg-gradient-to-br from-emerald-800 to-emerald-950 p-8 text-center relative overflow-hidden">
            {/* Effets de lumière */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl"></div>

            {/* Bouton fermer */}
            <button onClick={() => setIsOpen(false)} className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10">
              <X className="w-4 h-4" />
            </button>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 shadow-xl mb-6">
                <DoorOpen className="w-10 h-10 text-emerald-300" />
              </div>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 text-[10px] font-bold uppercase tracking-widest mb-4">
                <Sparkles className="w-3 h-3" /> Nouveauté
              </div>
              
              <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight mb-3">
                Découvrez les<br/>Micro-Climats
              </h2>
              
              <p className="text-emerald-100/90 text-sm font-medium leading-relaxed mb-8 px-2">
                Le salon n'est pas la salle de bain ! Notre expert prend désormais en compte la luminosité, la température et l'humidité de <b>chaque pièce</b> de votre maison pour des conseils sur-mesure.
              </p>

              <Button 
                onClick={() => setStep(2)} 
                className="w-full h-14 rounded-2xl bg-white hover:bg-stone-50 text-emerald-900 text-base font-bold shadow-xl shadow-emerald-950/50 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Créer ma première pièce <ArrowRight className="w-5 h-5" />
              </Button>
              
              <button onClick={() => setIsOpen(false)} className="mt-4 text-xs font-bold text-emerald-300/60 hover:text-emerald-200 transition-colors uppercase tracking-wider">
                Plus tard
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 2 : LE FORMULAIRE DE CRÉATION */}
        {step === 2 && (
          <div className="p-6 relative max-h-[85vh] overflow-y-auto">
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shadow-sm border border-emerald-100/50">
                  <DoorOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-stone-800 tracking-tight">Nouvelle pièce</h2>
                  <p className="text-xs text-stone-500 mt-0.5 font-medium">Définissez ses caractéristiques.</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* NOM */}
              <div className="space-y-2.5">
                <Label className="text-stone-700 font-bold ml-1">Nom de la pièce</Label>
                <Input name="name" required placeholder="Ex: Salon, Véranda..." className="h-12 rounded-2xl bg-white border-stone-200 focus:ring-emerald-500 font-medium shadow-sm" />
              </div>

              {/* ORIENTATION */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-end ml-1">
                  <Label className="flex items-center gap-1.5 text-stone-700 font-bold"><Compass className="w-4 h-4 text-emerald-500" /> Orientation</Label>
                  <span className="text-[10px] text-stone-400 font-medium">Max 2</span>
                </div>
                <input type="hidden" name="orientation" value={orientations.join('-')} />
                <div className="grid grid-cols-4 gap-2">
                  {['Nord', 'Sud', 'Est', 'Ouest'].map((dir) => (
                    <button
                      key={dir} type="button" onClick={() => toggleOrientation(dir)}
                      className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border active:scale-95 ${
                        orientations.includes(dir) ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
                      }`}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
              </div>

              {/* LUMINOSITÉ */}
              <div className="space-y-2.5">
                <Label className="flex items-center gap-1.5 text-stone-700 font-bold ml-1"><Sun className="w-4 h-4 text-amber-500" /> Lumière globale</Label>
                <input type="hidden" name="light_level" value={lightLevel} />
                <div className="flex bg-stone-100/50 border border-stone-200/60 rounded-2xl p-1.5">
                  {[
                    { value: 'Faible', icon: Cloud, label: 'Faible' },
                    { value: 'Moyenne', icon: SunDim, label: 'Moyenne' },
                    { value: 'Forte', icon: Sun, label: 'Forte' }
                  ].map((opt) => (
                    <button
                      key={opt.value} type="button" onClick={() => setLightLevel(opt.value)}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        lightLevel === opt.value ? 'bg-white text-amber-600 shadow-sm border border-stone-200/50' : 'text-stone-400 hover:text-stone-600'
                      }`}
                    >
                      <opt.icon className="w-4 h-4" /> {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TEMPÉRATURES */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2.5">
                  <Label className="flex items-center gap-1.5 text-stone-700 font-bold ml-1"><Thermometer className="w-4 h-4 text-rose-500" /> Été</Label>
                  <div className="relative">
                    <Input name="temp_summer" type="number" placeholder="25" className="h-12 rounded-2xl bg-white border-stone-200 pr-8 font-medium shadow-sm" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-bold">°C</span>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label className="flex items-center gap-1.5 text-stone-700 font-bold ml-1"><Thermometer className="w-4 h-4 text-sky-500" /> Hiver</Label>
                  <div className="relative">
                    <Input name="temp_winter" type="number" placeholder="19" className="h-12 rounded-2xl bg-white border-stone-200 pr-8 font-medium shadow-sm" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-bold">°C</span>
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={isPending} className="w-full h-14 mt-4 rounded-2xl bg-emerald-800 text-white text-base font-bold hover:bg-emerald-900 transition-all shadow-lg shadow-emerald-900/20 active:scale-95">
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2 text-emerald-300" /> Créer cet emplacement</>}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
