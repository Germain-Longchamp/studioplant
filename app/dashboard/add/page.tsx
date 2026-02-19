"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, Image as ImageIcon, Loader2, Sparkles, MapPin, Sun, Sprout } from "lucide-react";
import { toast } from "sonner";
import { addPlantWithAI } from "@/server/actions";

export default function AddPlantPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Nouveaux états
  const [room, setRoom] = useState("");
  const [light, setLight] = useState("");
  const [description, setDescription] = useState("");

  // Petit effet pour empêcher le scroll pendant le chargement
  useEffect(() => {
    if (isAnalyzing) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isAnalyzing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
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
    // On enlève le toast.loading ici car on a maintenant un overlay plein écran

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("room", room);
      formData.append("light", light);
      formData.append("description", description);

      const result = await addPlantWithAI(formData);

      if (result?.error) {
        toast.error(result.error);
        setIsAnalyzing(false);
      }
      // Si succès, la redirection se fait côté serveur, pas besoin de gérer ici.

    } catch (error) {
      toast.error("Une erreur inattendue est survenue.");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20 relative">
      
      {/* === OVERLAY D'ANIMATION DE CHARGEMENT === */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full text-center space-y-6 animate-in fade-in zoom-in duration-300">
            
            {/* Zone de scan de l'image */}
            <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-4 border-green-100 shadow-inner bg-slate-100">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src={previewUrl || ""} alt="Scan" className="w-full h-full object-cover opacity-80 blur-[2px]" />
               {/* Le fameux faisceau laser CSS */}
               <div className="animate-scan"></div>
            </div>

            <div className="space-y-3 flex flex-col items-center">
              {/* Icône qui pousse */}
              <div className="p-3 bg-green-100 rounded-full text-green-600 animate-gentle-pulse">
                <Sprout className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Analyse en cours...</h2>
              <p className="text-sm text-slate-500">
                Gemini observe votre plante et prépare sa fiche d'identité.
              </p>
            </div>

            <div className="flex items-center text-green-600 text-sm font-medium">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connexion au laboratoire...
            </div>
          </div>
        </div>
      )}

      {/* Contenu normal de la page (caché derrière l'overlay si actif) */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="-ml-2" disabled={isAnalyzing}>
            <Link href="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="font-bold text-lg text-green-900">Ajouter une plante</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 mt-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Zone de la photo (inchangée) */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {previewUrl ? (
                <div className="relative aspect-[4/5] w-full bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Aperçu" className="w-full h-full object-cover opacity-90" />
                  {!isAnalyzing && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40">
                    <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 shadow-lg">
                      <Camera className="w-4 h-4" /> Changer la photo
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                  </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[4/5] w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-green-200 bg-green-50/50 hover:bg-green-50 transition-colors">
                  {/* ... contenu de l'état vide (inchangé) ... */}
                  <div className="flex gap-4 mb-4">
                    <div className="p-4 bg-white rounded-full shadow-sm text-green-600"><Camera className="w-8 h-8" /></div>
                    <div className="p-4 bg-white rounded-full shadow-sm text-green-600"><ImageIcon className="w-8 h-8" /></div>
                  </div>
                  <h3 className="font-semibold text-green-900 mb-1">Photo de la plante</h3>
                  <p className="text-sm text-green-700/70 text-center mb-6">Prenez une photo claire pour l'IA.</p>
                  <label className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 shadow-sm transition-all active:scale-95">
                    <Camera className="w-5 h-5" /> Ouvrir l'appareil
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formulaire complémentaire */}
          {previewUrl && (
            <div className="space-y-5 bg-white p-5 rounded-xl border shadow-sm">
              {/* ... inputs select et textarea (inchangés) ... */}
               <div className="space-y-2">
                <Label className="flex items-center gap-2 text-slate-600"><MapPin className="w-4 h-4" /> Dans quelle pièce ?</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={room} onChange={(e) => setRoom(e.target.value)} disabled={isAnalyzing}>
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
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-slate-600"><Sun className="w-4 h-4" /> Luminosité</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={light} onChange={(e) => setLight(e.target.value)} disabled={isAnalyzing}>
                  <option value="">Sélectionner l'exposition...</option>
                  <option value="Plein soleil">☀️ Plein soleil (Fenêtre Sud)</option>
                  <option value="Lumière indirecte vive">🌤️ Lumière indirecte vive</option>
                  <option value="Mi-ombre">⛅ Mi-ombre</option>
                  <option value="Faible luminosité">🌑 Faible luminosité</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Description ou petite note</Label>
                <Textarea placeholder="Ex: Bouture de ma grand-mère..." className="resize-none h-24" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isAnalyzing} />
              </div>

              <Button type="submit" className="w-full py-6 text-lg bg-green-900 hover:bg-green-800 shadow-xl mt-4 transition-all" disabled={isAnalyzing}>
                {/* Le texte du bouton change aussi légèrement */}
                {isAnalyzing ? "Lancement de l'analyse..." : <><Sparkles className="w-5 h-5 mr-2 text-green-300" /> Identifier cette plante</>}
              </Button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}