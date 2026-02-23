"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Map, Sun, Home as HomeIcon, MapPin, Mail, Lock, Loader2, Sparkles, CheckCircle2, Building2, Compass } from "lucide-react";
import { toast } from "sonner";
import { updateProfileContext, updateSecurity } from "@/server/actions";

export default function ProfileForms({ user, metadata }: { user: any; metadata: any }) {
  const [isPendingContext, startTransitionContext] = useTransition();
  const [isPendingSecurity, startTransitionSecurity] = useTransition();

  // Nouveaux états pour gérer les boutons personnalisés
  const [homeType, setHomeType] = useState(metadata?.home_type || "");
  const [orientations, setOrientations] = useState<string[]>(
    metadata?.orientation ? metadata.orientation.split('-') : []
  );

  // Fonction pour gérer la sélection multiple (jusqu'à 2) de l'orientation
  const toggleOrientation = (dir: string) => {
    if (orientations.includes(dir)) {
      setOrientations(orientations.filter(d => d !== dir)); // Retire si déjà sélectionné
    } else {
      if (orientations.length < 2) {
        setOrientations([...orientations, dir]); // Ajoute si on a moins de 2 choix
      } else {
        // Si on en a déjà 2 et qu'on clique sur un 3ème, on remplace le dernier
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
      else toast.success("Contexte mis à jour ! 🌱 L'IA s'adaptera.");
    });
  };

  const handleSecuritySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransitionSecurity(async () => {
      const result = await updateSecurity(formData);
      if (result?.error) {
        toast.error("Erreur : " + result.error);
      } else {
        toast.success("Informations mises à jour !");
        if (formData.get("email") !== user.email) {
          toast.info("Vérifiez votre boîte mail pour confirmer la nouvelle adresse.");
        }
      }
    });
  };

  return (
    <div className="space-y-8">
      
      {/* BLOC 1 : MON CONTEXTE */}
      <section className="bg-white p-6 rounded-[2rem] shadow-xl shadow-stone-200/40 border border-stone-100/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <Map className="w-5 h-5" />
          </div>
          <div>
            {/* TEXTES MIS À JOUR */}
            <h2 className="text-xl font-bold text-stone-800 tracking-tight">Environnement</h2>
            <p className="text-xs text-stone-500 mt-0.5">Aide à te donner de meilleurs conseils pour entretenir ta jungle.</p>
          </div>
        </div>

        <form onSubmit={handleContextSubmit} className="space-y-6 relative z-10">
          
          {/* NOUVEAU CHOIX ESTHÉTIQUE : HABITATION */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1">
              <HomeIcon className="w-4 h-4 text-emerald-500" /> Habitation
            </Label>
            
            {/* Input caché pour le serveur */}
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
            {/* NOUVEAU CHOIX MULTIPLE : ORIENTATION */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1 text-sm">
                <Compass className="w-4 h-4 text-emerald-500" /> Orientation
              </Label>
              
              {/* Le serveur recevra une chaîne combinée (ex: "Sud-Est") */}
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

          <Button type="submit" disabled={isPendingContext} className="w-full h-12 rounded-[1.25rem] bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-lg shadow-emerald-900/20 active:scale-95 transition-all mt-4">
            {isPendingContext ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2 text-emerald-300" /> Enregistrer le contexte</>}
          </Button>
        </form>
      </section>

      {/* BLOC 2 : SÉCURITÉ (Conservé à l'identique) */}
      <section className="bg-white p-6 rounded-[2rem] shadow-xl shadow-stone-200/40 border border-stone-100/60 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-2.5 bg-stone-100 rounded-xl text-stone-600">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-800 tracking-tight">Mes informations</h2>
          </div>
        </div>

        <form onSubmit={handleSecuritySubmit} className="space-y-5 relative z-10">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1">
              <Mail className="w-4 h-4 text-stone-400" /> Adresse Email
            </Label>
            <Input type="email" name="email" defaultValue={user.email} className="h-12 rounded-2xl bg-[#FDFCF8] border-stone-200 text-stone-800" />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1">
              <Lock className="w-4 h-4 text-stone-400" /> Nouveau mot de passe
            </Label>
            <Input type="password" name="password" placeholder="Laisser vide pour ne pas changer" className="h-12 rounded-2xl bg-[#FDFCF8] border-stone-200 text-stone-800 placeholder:text-stone-300" />
          </div>

          <Button type="submit" disabled={isPendingSecurity} variant="outline" className="w-full h-12 rounded-[1.25rem] border-stone-200 text-stone-700 hover:bg-stone-50 font-bold active:scale-95 transition-all mt-2">
            {isPendingSecurity ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2 text-stone-400" /> Mettre à jour</>}
          </Button>
        </form>
      </section>

    </div>
  );
}
