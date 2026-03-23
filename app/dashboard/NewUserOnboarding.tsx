"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Leaf, ArrowRight, Sparkles, 
  Cloud, SunDim, Sun, Thermometer, DoorOpen, Camera, CheckCircle, Loader2 
} from "lucide-react";
import { saveRoom } from "@/server/actions";

export default function NewUserOnboarding({ show }: { show: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // On utilise une référence pour mémoriser qu'on l'a déjà ouvert
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Si on doit l'afficher et qu'on ne l'a pas encore fait
    if (show && !hasTriggered.current) {
      hasTriggered.current = true;
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [show]);

  const [orientations, setOrientations] = useState<string[]>([]);
  const [lightLevel, setLightLevel] = useState("Moyenne");

  if (!isOpen) return null;

  const toggleOrientation = (dir: string) => {
    if (orientations.includes(dir)) {
      setOrientations(orientations.filter(d => d !== dir));
    } else {
      if (orientations.length < 2) setOrientations([...orientations, dir]);
      else setOrientations([orientations[0], dir]);
    }
  };

  const handleSaveRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await saveRoom(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Pièce créée avec succès !");
        setStep(4); // On passe à l'étape finale
      }
    });
  };

  const closeAndNavigate = () => {
    setIsOpen(false);
    router.push('/dashboard/add');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-[#FDFCF8] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        
        {/* ÉTAPE 1 : LA PROMESSE */}
        {step === 1 && (
          <div className="bg-emerald-900 bg-gradient-to-br from-emerald-800 to-emerald-950 p-8 text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/30 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col items-center pt-4">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center border border-white/20 shadow-xl mb-8">
                <Leaf className="w-12 h-12 text-emerald-300" />
              </div>
              
              <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight mb-4">
                Bienvenue sur <br/>StudioPlant
              </h2>
              
              <p className="text-emerald-100/90 text-sm font-medium leading-relaxed mb-8 px-2">
                Oubliez les conseils génériques. Ici, l'entretien de vos plantes s'adapte à <b className="text-white">l'environnement ultra-personnalisé</b> de votre propre maison.
              </p>

              <Button onClick={() => setStep(2)} className="w-full h-14 rounded-2xl bg-white hover:bg-stone-50 text-emerald-900 text-base font-bold shadow-xl shadow-emerald-950/50 transition-all active:scale-95 flex items-center justify-center gap-2">
                Découvrir comment <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* ÉTAPE 2 : COMMENT ÇA MARCHE */}
        {step === 2 && (
          <div className="p-8 relative">
            <h2 className="text-2xl font-extrabold text-stone-800 tracking-tight mb-6">Comment ça marche ?</h2>
            
            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0 mt-0.5">1</div>
                <div>
                  <h3 className="font-bold text-stone-800 mb-1">Définissez vos pièces</h3>
                  <p className="text-sm text-stone-500 font-medium">Lumière, température, orientation... Recréez les micro-climats de chez vous.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0 mt-0.5">2</div>
                <div>
                  <h3 className="font-bold text-stone-800 mb-1">Ajoutez vos plantes</h3>
                  <p className="text-sm text-stone-500 font-medium">Prenez-les en photo, notre intelligence artificielle s'occupe de les reconnaître.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0 mt-0.5">3</div>
                <div>
                  <h3 className="font-bold text-stone-800 mb-1">Profitez de vos plantes</h3>
                  <p className="text-sm text-stone-500 font-medium">Recevez des alertes d'arrosage dynamiques et précises selon leur emplacement.</p>
                </div>
              </div>
            </div>

            <Button onClick={() => setStep(3)} className="w-full h-14 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-base font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center justify-center gap-2">
              Commencer <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* ÉTAPE 3 : CRÉER LA PREMIÈRE PIÈCE */}
        {step === 3 && (
          <div className="p-6 relative max-h-[85vh] overflow-y-auto animate-in slide-in-from-right-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shadow-sm border border-emerald-100/50">
                <DoorOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-stone-800 tracking-tight">Votre première pièce</h2>
                <p className="text-xs text-stone-500 mt-0.5 font-medium">Où allez-vous placer votre première plante ?</p>
              </div>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-6">
              {/* NOM */}
              <div className="space-y-2.5">
                <Label className="text-stone-700 font-bold ml-1">Nom de la pièce</Label>
                <Input name="name" required placeholder="Ex: Salon, Véranda..." className="h-12 rounded-2xl bg-white border-stone-200 focus:ring-emerald-500 font-medium shadow-sm" />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <Label className="flex items-center gap-1.5 text-stone-700 font-bold ml-1"><Thermometer className="w-4 h-4 text-rose-500" /> Été</Label>
                  <Input name="temp_summer" type="number" defaultValue="25" className="h-12 rounded-2xl bg-white border-stone-200 font-medium text-center shadow-sm" />
                </div>
                <div className="space-y-2.5">
                  <Label className="flex items-center gap-1.5 text-stone-700 font-bold ml-1"><Thermometer className="w-4 h-4 text-sky-500" /> Hiver</Label>
                  <Input name="temp_winter" type="number" defaultValue="19" className="h-12 rounded-2xl bg-white border-stone-200 font-medium text-center shadow-sm" />
                </div>
              </div>

              <Button type="submit" disabled={isPending} className="w-full h-14 mt-4 rounded-2xl bg-emerald-800 text-white text-base font-bold hover:bg-emerald-900 transition-all shadow-lg shadow-emerald-900/20 active:scale-95">
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Créer cet emplacement"}
              </Button>
            </form>
          </div>
        )}

        {/* ÉTAPE 4 : APPEL À L'ACTION FINAL */}
        {step === 4 && (
          <div className="p-8 text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            
            <h2 className="text-2xl font-extrabold text-stone-800 tracking-tight mb-2">Tout est prêt !</h2>
            <p className="text-sm text-stone-500 font-medium mb-8">
              Votre premier environnement est configuré. Il est temps d'y placer votre première plante pour lancer le suivi.
            </p>

            <Button onClick={closeAndNavigate} className="w-full h-14 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-base font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center justify-center gap-2">
              <Camera className="w-5 h-5" /> Ajouter ma première plante
            </Button>
            
            <button onClick={() => setIsOpen(false)} className="mt-6 text-xs font-bold text-stone-400 hover:text-stone-600 transition-colors uppercase tracking-wider">
              Explorer le tableau de bord
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
