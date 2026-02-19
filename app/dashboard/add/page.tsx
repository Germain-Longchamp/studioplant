"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Camera, Image as ImageIcon, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { addPlantWithAI } from "@/server/actions"; // On importe notre Server Action

export default function AddPlantPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 1. Gère la sélection de l'image et crée un aperçu
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Création d'une URL locale temporaire pour afficher l'image instantanément
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  // 2. Gère l'envoi au serveur
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Veuillez d'abord sélectionner une image.");
      return;
    }

    setIsAnalyzing(true);
    const toastId = toast.loading("Gemini analyse votre plante... 🌱");

    try {
      // Préparation des données pour la Server Action
      const formData = new FormData();
      formData.append("image", file);

      // Appel de la Server Action créée précédemment
      const result = await addPlantWithAI(formData);

      if (result?.error) {
        toast.error(result.error, { id: toastId });
        setIsAnalyzing(false);
      }
      // Note : Si tout se passe bien, la Server Action fait un redirect() 
      // vers le dashboard, donc pas besoin de toast.success ici.

    } catch (error) {
      toast.error("Une erreur inattendue est survenue.", { id: toastId });
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Header avec bouton retour */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="-ml-2">
            <Link href="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="font-bold text-lg text-green-900">Ajouter une plante</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 mt-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Zone de la photo */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {previewUrl ? (
                <div className="relative aspect-[4/5] w-full bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={previewUrl} 
                    alt="Aperçu de la plante" 
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40">
                    <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 shadow-lg">
                      <Camera className="w-4 h-4" />
                      Changer la photo
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="aspect-[4/5] w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-green-200 bg-green-50/50 hover:bg-green-50 transition-colors">
                  <div className="flex gap-4 mb-4">
                    <div className="p-4 bg-white rounded-full shadow-sm text-green-600">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div className="p-4 bg-white rounded-full shadow-sm text-green-600">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-green-900 mb-1">Photo de la plante</h3>
                  <p className="text-sm text-green-700/70 text-center mb-6">
                    Prenez une photo claire pour que l'IA puisse l'identifier.
                  </p>
                  
                  {/* Le vrai bouton qui déclenche l'input file caché */}
                  <label className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 shadow-sm transition-all active:scale-95">
                    <Camera className="w-5 h-5" />
                    Ouvrir l'appareil
                    <input 
                      type="file" 
                      accept="image/*" 
                      // capture="environment" // Décommente cette ligne si tu veux forcer la caméra arrière sur mobile par défaut
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bouton de soumission */}
          {previewUrl && (
            <Button 
              type="submit" 
              className="w-full py-6 text-lg bg-green-900 hover:bg-green-800 shadow-xl"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyse par l'IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2 text-green-300" />
                  Identifier cette plante
                </>
              )}
            </Button>
          )}

        </form>
      </main>
    </div>
  );
}