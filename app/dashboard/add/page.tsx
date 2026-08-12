"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Camera, Image as ImageIcon, Loader2, Sparkles, MapPin, Sun, Sprout, CalendarClock, Leaf, SunDim, CloudSun, Cloud, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { saveOptimisticPlant, analyzePlantForForm, getUserRooms } from "@/server/actions";

// Typage mis à jour pour inclure le tableau de recommandations
type PreliminaryData = {
  name: string;
  species: string;
  recommended_rooms: Array<{ room_name: string; reason: string }>;
};

export default function AddPlantPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [loadingState, setLoadingState] = useState<"idle" | "analyzing" | "saving">("idle");
  const [preliminaryData, setPreliminaryData] = useState<PreliminaryData | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [room, setRoom] = useState("");
  const [light, setLight] = useState("");
  const [lastWateredAt, setLastWateredAt] = useState(new Date().toISOString().split('T')[0]);

  const [userRooms, setUserRooms] = useState<any[]>([]);

  useEffect(() => {
    getUserRooms().then(data => setUserRooms(data));
  }, []);

  useEffect(() => {
    if (loadingState !== "idle") {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [loadingState]);

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.currentTarget.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setStep(1);
      setPreliminaryData(null);
    }
  };

  const handleAnalyzePhoto = async () => {
    if (!file) return;
    setLoadingState("analyzing");
    
    const formData = new FormData();
    formData.append("image", file);

    try {
      const result = await analyzePlantForForm(formData);
      if (result?.error) {
        toast.error(result.error);
        setLoadingState("idle");
      } else if (result?.success && result.data) {
        const data = result.data as PreliminaryData;
        setPreliminaryData(data);
        
        // S'il y a des recommandations valides, on auto-sélectionne la première
        if (data.recommended_rooms && data.recommended_rooms.length > 0) {
          const firstRec = data.recommended_rooms[0];
          if (userRooms.some(r => r.name === firstRec.room_name)) {
            setRoom(firstRec.room_name);
          }
        }
        
        setStep(2);
        setLoadingState("idle");
      }
    } catch (err) {
      toast.error("Erreur de connexion lors de l'analyse.");
      setLoadingState("idle");
    }
  };

  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !room || !light) {
      toast.error("Veuillez sélectionner un emplacement et une luminosité.");
      return;
    }

    setLoadingState("saving");
    const formData = new FormData();
    formData.append("image", file);
    formData.append("room", room);
    formData.append("light", light);
    formData.append("lastWateredAt", lastWateredAt);
    
    if (preliminaryData) {
      formData.append("prefilled_name", preliminaryData.name);
      formData.append("prefilled_species", preliminaryData.species);
    }

    try {
      const result = await saveOptimisticPlant(formData);
      if (result?.error) {
        toast.error(result.error);
        setLoadingState("idle");
      } else if (result?.success && result.plantId) {
        toast.success("Plante ajoutée avec succès ! 🌱");
        router.push(`/dashboard/plant/${result.plantId}`);
      } else {
        router.push(`/dashboard`);
      }
    } catch (error) {
      toast.error("Une erreur de communication est survenue.");
      setLoadingState("idle");
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else router.push("/dashboard");
  };

  const lightOptions = [
    { value: "Plein soleil", label: "Plein soleil", desc: "Fenêtre Sud", icon: Sun },
    { value: "Lumière indirecte vive", label: "Lumière vive", desc: "Sans soleil direct", icon: SunDim },
    { value: "Mi-ombre", label: "Mi-ombre", desc: "Un peu reculé", icon: CloudSun },
    { value: "Faible luminosité", label: "Faible", desc: "Coin sombre", icon: Cloud },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans pb-24 relative overflow-x-hidden">
      
      {/* OVERLAY D'ANIMATION DE CHARGEMENT DYNAMIQUE */}
      {loadingState !== "idle" && (
        <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-md flex flex-col items-center justify-center p-4 transition-all duration-500">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center max-w-sm w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-100 rounded-full blur-2xl opacity-50"></div>
            
            <div className="relative w-32 h-32 rounded-3xl overflow-hidden border-4 border-emerald-50 shadow-inner bg-stone-100">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src={previewUrl || ""} alt="Scan" className="w-full h-full object-cover opacity-80 blur-[2px]" />
               <div className="animate-scan"></div>
            </div>
            <div className="space-y-3 flex flex-col items-center relative z-10">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-700 animate-gentle-pulse">
                <Sprout className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">
                {loadingState === "analyzing" ? "Identification..." : "Ajout à votre jungle..."}
              </h2>
              <p className="text-sm text-stone-500 font-medium px-4">
                {loadingState === "analyzing"
                  ? "Notre expert analyse la photo afin de la reconnaître."
                  : "Enregistrement de votre plante en cours."}
              </p>
            </div>
            <div className="flex items-center text-emerald-700 text-sm font-semibold bg-emerald-50 px-4 py-2 rounded-full relative z-10">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {loadingState === "analyzing" ? "Connexion à la base de données" : "Enregistrement en cours"}
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <div className="bg-emerald-900 bg-gradient-to-b from-emerald-800 to-emerald-950 rounded-b-[2.5rem] pb-24 pt-6 px-5 relative shadow-xl shadow-emerald-900/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl -translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-md mx-auto relative z-10">
          <header className="flex items-center gap-3 mb-8">
            <Button variant="ghost" size="icon" onClick={handleBack} className="text-emerald-200 hover:text-white hover:bg-white/10 rounded-full transition-colors" disabled={loadingState !== "idle"}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
              {step === 1 ? "Nouvelle plante" : "Configuration"}
            </h1>
          </header>
        </div>
      </div>

      <main className="max-w-md mx-auto px-5 -mt-14 relative z-20">
        
        {/* ÉTAPE 1 : PRISE DE PHOTO */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="relative">
              {previewUrl ? (
                <div className="relative aspect-[4/5] w-full bg-stone-900 rounded-[2rem] overflow-hidden shadow-xl shadow-stone-200/50 border border-white/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Aperçu" className="w-full h-full object-cover opacity-90" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-stone-900/50 backdrop-blur-sm gap-4">
                    <label className="cursor-pointer bg-white text-stone-900 px-6 py-3 rounded-full font-semibold text-sm flex items-center gap-2 shadow-xl hover:scale-105 transition-transform">
                      <Camera className="w-4 h-4" /> Refaire la photo
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} onClick={handleInputClick} />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="aspect-[4/5] w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-emerald-200/60 bg-white rounded-[2rem] transition-colors shadow-lg shadow-stone-200/40 relative overflow-hidden">
                  <div className="absolute -right-6 -bottom-6 text-emerald-50">
                    <Leaf className="w-40 h-40 rotate-12" />
                  </div>
                  <div className="flex gap-4 mb-6 relative z-10">
                    <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-700 shadow-sm"><Camera className="w-8 h-8" /></div>
                  </div>
                  <h3 className="font-bold text-stone-800 text-lg mb-1 relative z-10">Photo de la plante</h3>
                  <p className="text-sm text-stone-500 text-center mb-8 font-medium relative z-10">
                    Prenez une belle photo claire pour que notre expert l'identifie.
                  </p>
                  
                  <div className="flex flex-col gap-3 w-full max-w-[250px] relative z-10">
                    <label className="cursor-pointer w-full bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white px-6 py-3.5 rounded-full font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all active:scale-95 border border-emerald-700">
                      <Camera className="w-5 h-5" /> Prendre une photo
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} onClick={handleInputClick} />
                    </label>

                    <label className="cursor-pointer w-full bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 px-6 py-3.5 rounded-full font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95">
                      <ImageIcon className="w-5 h-5 text-stone-400" /> Choisir une image
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} onClick={handleInputClick} />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {previewUrl && (
              <Button 
                onClick={handleAnalyzePhoto}
                className="w-full h-14 rounded-2xl text-lg font-bold bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white shadow-lg shadow-emerald-900/20 transition-all active:scale-95 border border-emerald-700"
              >
                <Sparkles className="w-5 h-5 mr-2 text-emerald-300" /> Identifier la plante
              </Button>
            )}
          </div>
        )}

        {/* ÉTAPE 2 : FORMULAIRE DÉTAILS */}
        {step === 2 && preliminaryData && (
          <form onSubmit={handleSubmitFinal} className="space-y-6">
            
            {/* Bandeau Plante Identifiée */}
            <div className="bg-white rounded-[2rem] p-4 flex items-center gap-4 shadow-lg shadow-stone-200/40 border border-stone-100/80 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="w-16 h-16 rounded-[1.25rem] overflow-hidden shrink-0 border border-stone-100">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src={previewUrl!} className="w-full h-full object-cover" alt="Plante" />
               </div>
               <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase tracking-wider mb-0.5">
                   <CheckCircle2 className="w-3.5 h-3.5" /> Identifiée
                 </div>
                 <h3 className="font-extrabold text-stone-800 text-lg leading-tight truncate">{preliminaryData.name}</h3>
                 <p className="text-sm font-medium text-stone-500 italic truncate">{preliminaryData.species}</p>
               </div>
            </div>

            <div className="space-y-7 bg-white p-5 sm:p-6 rounded-[2rem] border border-stone-100/80 shadow-xl shadow-stone-200/40 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100">
               
               {/* 1. PIÈCE (Boutons Pilules dynamiques avec Recommandations Multiples) */}
               <div className="space-y-3">
                <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1">
                  <MapPin className="w-4 h-4 text-emerald-600" /> Dans quelle pièce ?
                </Label>
                
                <div className="flex flex-wrap gap-2">
                  {userRooms.length > 0 ? (
                    userRooms.map((r: any) => {
                      // On cherche si cette pièce fait partie des recommandations de l'IA
                      const recommendationInfo = preliminaryData.recommended_rooms?.find(rec => rec.room_name === r.name);
                      const isRecommended = !!recommendationInfo;
                      const isSelected = room === r.name;
                      
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRoom(r.name)}
                          className={`relative px-4 py-2.5 rounded-xl text-sm font-bold transition-all border active:scale-95 flex items-center gap-2 ${
                            isSelected 
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
                              : isRecommended 
                                ? 'border-emerald-300 bg-emerald-50/30 text-stone-700 shadow-sm'
                                : 'border-stone-200 bg-[#FDFCF8] text-stone-600 hover:border-stone-300'
                          }`}
                        >
                          {r.name}
                          {isRecommended && !isSelected && <Sprout className="w-4 h-4 text-emerald-600" />}
                        </button>
                      )
                    })
                  ) : (
                    ['Salon', 'Chambre', 'Cuisine', 'Salle de bain', 'Bureau'].map(name => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setRoom(name)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border active:scale-95 ${
                          room === name 
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
                            : 'border-stone-200 bg-[#FDFCF8] text-stone-600 hover:border-stone-300'
                        }`}
                      >
                        {name}
                      </button>
                    ))
                  )}
                </div>

                {/* Affichage de la justification de l'expert pour la pièce sélectionnée (si elle a été recommandée) */}
                {room && preliminaryData.recommended_rooms?.some(rec => rec.room_name === room) && (
                  <div className="mt-2 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl animate-in fade-in duration-300">
                    <p className="text-[12px] text-emerald-800 font-medium leading-relaxed flex items-start gap-2">
                      <Sprout className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        <strong className="block mb-0.5">Notre expert vous conseille cet emplacement :</strong>
                        {preliminaryData.recommended_rooms.find(rec => rec.room_name === room)?.reason}
                      </span>
                    </p>
                  </div>
                )}
                
                {/* Petit texte global si des pièces sont recommandées mais non sélectionnées */}
                {(!room || !preliminaryData.recommended_rooms?.some(rec => rec.room_name === room)) && preliminaryData.recommended_rooms?.length > 0 && userRooms.length > 0 && (
                  <p className="text-[11px] text-stone-500 font-medium ml-2 mt-2 flex items-center gap-1.5">
                    <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                    {preliminaryData.recommended_rooms.length > 1 
                      ? "Plusieurs pièces correspondent parfaitement à cette plante." 
                      : "Une de vos pièces correspond parfaitement à cette plante."}
                  </p>
                )}

                {userRooms.length === 0 && (
                  <p className="text-[11px] text-stone-500 font-bold ml-2 mt-2 flex items-center gap-1">
                    <Sprout className="w-3 h-3" /> Astuce : Créez des pièces dans "Ma Maison" pour que l'expert vous guide.
                  </p>
                )}
              </div>

              {/* 2. LUMINOSITÉ LOCALE */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1">
                  <Sun className="w-4 h-4 text-amber-500" /> Luminosité locale
                </Label>
                
                <div className="grid grid-cols-2 gap-2">
                  {lightOptions.map((opt) => {
                    const isSelected = light === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setLight(opt.value)}
                        className={`flex flex-col items-start text-left p-3.5 rounded-[1.25rem] border transition-all active:scale-95 ${
                          isSelected
                            ? 'border-amber-400 bg-amber-50 shadow-sm'
                            : 'border-stone-200 bg-[#FDFCF8] hover:border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        <opt.icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-amber-500' : 'text-stone-400'}`} />
                        <span className={`text-sm font-bold ${isSelected ? 'text-amber-900' : 'text-stone-700'}`}>
                          {opt.label}
                        </span>
                        <span className={`text-[10px] font-medium mt-0.5 ${isSelected ? 'text-amber-700' : 'text-stone-500'}`}>
                          {opt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. DATE DE DERNIER ARROSAGE */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1">
                  <CalendarClock className="w-4 h-4 text-blue-500" /> Dernier arrosage
                </Label>
                <input 
                  type="date"
                  className="flex h-14 w-full rounded-2xl border border-stone-200 bg-[#FDFCF8] px-4 py-2 text-sm font-bold text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 transition-all" 
                  value={lastWateredAt} 
                  onChange={(e) => setLastWateredAt(e.target.value)} 
                  disabled={loadingState !== "idle"} 
                  max={new Date().toISOString().split('T')[0]} 
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 mt-8 rounded-2xl text-lg font-bold bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white shadow-lg shadow-emerald-900/20 transition-all active:scale-95 border border-emerald-700"
                disabled={loadingState !== "idle"}
              >
                Ajouter à ma jungle
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
