"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Camera, Image as ImageIcon, Loader2, Sparkles, MapPin, Sun, Sprout, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { addPlantWithAI } from "@/server/actions";

export default function AddPlantPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [room, setRoom] = useState("");
  const [light, setLight] = useState("");
  // Nouvel état pour la date, initialisé à aujourd'hui (format YYYY-MM-DD requis pour l'input date)
  const [lastWateredAt, setLastWateredAt] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isAnalyzing) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isAnalyzing]);

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.currentTarget.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Veuillez d'abord sélectionner une image.");
      return;
    }

    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("room", room);
      formData.append("light", light);
      formData.append("lastWateredAt", lastWateredAt); // 👈 On envoie la date au lieu de la description

      const result = await addPlantWithAI(formData);

      if (result?.error) {
        toast.error(result.error);
        setIsAnalyzing(false);
      }
    } catch (error) {
      toast.error("Une erreur inattendue est survenue.");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans pb-24 relative">
      
      {/* OVERLAY D'ANIMATION DE CHARGEMENT */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-md flex flex-col items-center justify-center p-4 transition-all duration-500">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center max-w-sm w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="relative w-32 h-32 rounded-3xl overflow-hidden border-4 border-emerald-50 shadow-inner bg-stone-100">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src={previewUrl || ""} alt="Scan" className="w-full h-full object-cover opacity-80 blur-[2px]" />
               <div className="animate-scan"></div>
            </div>
            <div className="space-y-3 flex flex-col items-center">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 animate-gentle-pulse">
                <Sprout className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">Analyse en cours</h2>
              <p className="text-sm text-stone-500 font-medium px-4">
                Gemini observe votre plante et prépare son carnet de santé.
              </p>
            </div>
            <div className="flex items-center text-emerald-600 text-sm font-semibold bg-emerald-50 px-4 py-2 rounded-full">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connexion au laboratoire...
            </div>
          </div>
        </div>
      )}

      {/* HEADER MINIMALISTE */}
      <header className="max-w-md mx-auto px-4 pt-6 pb-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="text-stone-400 hover:text-stone-900 hover:bg-stone-200/50 rounded-full" disabled={isAnalyzing}>
          <Link href="/dashboard">
            <ArrowLeft className="w-6 h-6" />
          </Link>
        </Button>
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
          Nouvelle plante
        </h1>
      </header>

      <main className="max-w-md mx-auto px-5 mt-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* ZONE DE LA PHOTO */}
          <div className="relative">
            {previewUrl ? (
              <div className="relative aspect-[4/5] w-full bg-stone-900 rounded-[2rem] overflow-hidden shadow-sm border border-stone-200/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Aperçu" className="w-full h-full object-cover opacity-90" />
                {!isAnalyzing && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-stone-900/40 backdrop-blur-sm">
                  <label className="cursor-pointer bg-white text-stone-900 px-5 py-3 rounded-full font-semibold text-sm flex items-center gap-2 shadow-xl hover:scale-105 transition-transform">
                    <Camera className="w-4 h-4" /> Changer la photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} onClick={handleInputClick} />
                  </label>
                </div>
                )}
              </div>
            ) : (
              <div className="aspect-[4/5] w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-200 bg-white rounded-[2rem] transition-colors">
                <div className="flex gap-4 mb-6">
                  <div className="p-4 bg-stone-50 rounded-2xl text-stone-400 shadow-sm"><Camera className="w-8 h-8" /></div>
                </div>
                <h3 className="font-bold text-stone-800 text-lg mb-1">Photo de la plante</h3>
                <p className="text-sm text-stone-500 text-center mb-8 font-medium">
                  Prenez une belle photo claire pour que l'IA puisse l'identifier.
                </p>
                
                <div className="flex flex-col gap-3 w-full max-w-[250px]">
                  <label className="cursor-pointer w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-full font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95">
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

          {/* FORMULAIRE DÉTAILS */}
          {previewUrl && (
            <div className="space-y-6 bg-white p-6 rounded-[2rem] border border-stone-100/80 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
               
               {/* 1. PIÈCE */}
               <div className="space-y-2.5">
                <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1">
                  <MapPin className="w-4 h-4 text-purple-500" /> Dans quelle pièce ?
                </Label>
                <select 
                  className="flex h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 transition-all" 
                  value={room} 
                  onChange={(e) => setRoom(e.target.value)} 
                  disabled={isAnalyzing}
                >
                  <option value="">Sélectionner une pièce...</option>
                  <option value="Salon">Salon</option>
                  <option value="Chambre">Chambre</option>
                  <option value="Cuisine">Cuisine</option>
                  <option value="Salle de bain">Salle de bain</option>
                  <option value="Bureau">Bureau</option>
                  <option value="Véranda">Véranda</option>
                  <option value="Patio / Balcon">Patio / Balcon</option>
                  <option value="Jardin">Jardin</option>
                </select>
              </div>

              {/* 2. LUMINOSITÉ */}
              <div className="space-y-2.5">
                <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1">
                  <Sun className="w-4 h-4 text-amber-500" /> Luminosité
                </Label>
                <select 
                  className="flex h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 transition-all" 
                  value={light} 
                  onChange={(e) => setLight(e.target.value)} 
                  disabled={isAnalyzing}
                >
                  <option value="">Sélectionner l'exposition...</option>
                  <option value="Plein soleil">☀️ Plein soleil (Fenêtre Sud)</option>
                  <option value="Lumière indirecte vive">🌤️ Lumière indirecte vive</option>
                  <option value="Mi-ombre">⛅ Mi-ombre</option>
                  <option value="Faible luminosité">🌑 Faible luminosité</option>
                </select>
              </div>

              {/* 3. NOUVEAU : DATE DE DERNIER ARROSAGE */}
              <div className="space-y-2.5">
                <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1">
                  <CalendarClock className="w-4 h-4 text-sky-500" /> Dernier arrosage
                </Label>
                <input 
                  type="date"
                  className="flex h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 transition-all" 
                  value={lastWateredAt} 
                  onChange={(e) => setLastWateredAt(e.target.value)} 
                  disabled={isAnalyzing} 
                  max={new Date().toISOString().split('T')[0]} // Empêche de choisir une date dans le futur
                />
              </div>

              <Button 
                type="submit" 
                className="w-full py-6 mt-6 rounded-full text-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all active:scale-95" 
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  "Lancement de l'analyse..."
                ) : (
                  <><Sparkles className="w-5 h-5 mr-2 text-emerald-200" /> Identifier cette plante</>
                )}
              </Button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
