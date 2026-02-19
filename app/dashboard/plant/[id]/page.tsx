import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Droplets, Sun, MapPin, AlignLeft, Sparkles, Info, LeafyGreen, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import DeleteButton from "./DeleteButton";

export default async function PlantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: plant, error } = await supabase
    .from("plants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !plant) redirect("/dashboard");

  return (
    // On utilise un fond "stone" (pierre) très doux au lieu du gris bleuté
    <div className="min-h-screen bg-stone-50 pb-24 font-sans text-stone-800">
      
      {/* Header avec dégradé subtil */}
      <header className="fixed top-0 w-full z-10 bg-gradient-to-b from-stone-900/60 via-stone-900/20 to-transparent">
        <div className="max-w-md mx-auto px-4 h-20 flex items-center">
          <Button variant="ghost" size="icon" asChild className="text-white bg-black/20 backdrop-blur-md hover:bg-black/40 hover:text-white rounded-full border border-white/10 transition-all">
            <Link href="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        {/* Image hero plus haute et immersive */}
        <div className="relative w-full h-[50vh] bg-stone-200">
          {plant.image_path ? (
            <Image src={plant.image_path} alt={plant.name} fill className="object-cover" priority />
          ) : (
             <div className="flex items-center justify-center h-full"><Info className="w-12 h-12 text-stone-300" /></div>
          )}
          {/* Fondu vers le bas de l'image pour lier avec le contenu */}
          <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-stone-50 to-transparent" />
        </div>

        {/* Contenu principal (remonte sur l'image) */}
        <div className="px-5 relative -mt-12 z-10 space-y-4">
          
          {/* En-tête de la plante (Épuré et élégant) */}
          <div className="mb-8 pt-2">
            <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight leading-none mb-2">
              {plant.name}
            </h1>
            <p className="text-lg text-stone-500 font-medium italic">
              {plant.species}
            </p>
          </div>

          {/* === LES ACCORDÉONS (Utilisation de la balise native <details>) === */}

          {/* 1. Accordéon : Arrosage */}
          <details className="group [&_summary::-webkit-details-marker]:hidden bg-white rounded-[2rem] shadow-sm border border-stone-100/80 overflow-hidden" open>
            <summary className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-stone-50/50 active:bg-stone-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-50 rounded-2xl text-sky-500">
                  <Droplets className="w-5 h-5" />
                </div>
                <span className="text-stone-800 font-semibold text-lg">Besoins en eau</span>
              </div>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-white transition-colors">
                <ChevronDown className="h-5 w-5 text-stone-400 transition-transform duration-300 group-open:-rotate-180" />
              </div>
            </summary>
            <div className="px-5 pb-6 pt-1 text-stone-600 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="pl-[3.25rem]">
                <p className="text-sm font-medium uppercase tracking-wider text-sky-500/80 mb-1">Fréquence recommandée</p>
                <p className="text-stone-800 font-medium text-lg">Tous les {plant.watering_frequency} jours</p>
              </div>
            </div>
          </details>

          {/* 2. Accordéon : Environnement (Emplacement + Lumière combinés) */}
          <details className="group [&_summary::-webkit-details-marker]:hidden bg-white rounded-[2rem] shadow-sm border border-stone-100/80 overflow-hidden">
            <summary className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-stone-50/50 active:bg-stone-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-500">
                  <Sun className="w-5 h-5" />
                </div>
                <span className="text-stone-800 font-semibold text-lg">Environnement</span>
              </div>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-white transition-colors">
                <ChevronDown className="h-5 w-5 text-stone-400 transition-transform duration-300 group-open:-rotate-180" />
              </div>
            </summary>
            <div className="px-5 pb-6 pt-1 space-y-6 text-stone-600 animate-in fade-in slide-in-from-top-4 duration-300">
              
              {/* Emplacement */}
              <div className="pl-[3.25rem] relative">
                <MapPin className="w-4 h-4 absolute left-1 top-1 text-stone-300" />
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Pièce : {plant.room || "Non précisée"}</p>
                {plant.room_advice && (
                  <div className="flex gap-2 items-start mt-2">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-stone-700 leading-relaxed">{plant.room_advice}</p>
                  </div>
                )}
              </div>

              {/* Ligne de séparation subtile */}
              <div className="ml-[3.25rem] h-px bg-stone-100" />

              {/* Lumière */}
              <div className="pl-[3.25rem] relative">
                <Sun className="w-4 h-4 absolute left-1 top-1 text-stone-300" />
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Lumière : {plant.exposure || "Non précisée"}</p>
                {plant.light_advice && (
                  <div className="flex gap-2 items-start mt-2">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-stone-700 leading-relaxed">{plant.light_advice}</p>
                  </div>
                )}
              </div>

            </div>
          </details>

          {/* 3. Accordéon : Guide d'entretien (IA) */}
          <details className="group [&_summary::-webkit-details-marker]:hidden bg-white rounded-[2rem] shadow-sm border border-stone-100/80 overflow-hidden">
            <summary className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-stone-50/50 active:bg-stone-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                  <LeafyGreen className="w-5 h-5" />
                </div>
                <span className="text-stone-800 font-semibold text-lg">Guide d'entretien</span>
              </div>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-white transition-colors">
                <ChevronDown className="h-5 w-5 text-stone-400 transition-transform duration-300 group-open:-rotate-180" />
              </div>
            </summary>
            <div className="px-5 pb-6 pt-1 text-stone-600 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="pl-[3.25rem]">
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                  <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                    {plant.care_notes || "Aucun guide disponible pour le moment."}
                  </p>
                </div>
              </div>
            </div>
          </details>

          {/* 4. Accordéon : Mes Notes (S'affiche uniquement s'il y a une description) */}
          {plant.description && (
            <details className="group [&_summary::-webkit-details-marker]:hidden bg-white rounded-[2rem] shadow-sm border border-stone-100/80 overflow-hidden">
              <summary className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-stone-50/50 active:bg-stone-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-stone-100 rounded-2xl text-stone-600">
                    <AlignLeft className="w-5 h-5" />
                  </div>
                  <span className="text-stone-800 font-semibold text-lg">Mon carnet</span>
                </div>
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-white transition-colors">
                  <ChevronDown className="h-5 w-5 text-stone-400 transition-transform duration-300 group-open:-rotate-180" />
                </div>
              </summary>
              <div className="px-5 pb-6 pt-1 text-stone-600 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="pl-[3.25rem]">
                  <p className="text-sm text-stone-600 italic leading-relaxed whitespace-pre-wrap border-l-2 border-stone-200 pl-4">
                    "{plant.description}"
                  </p>
                </div>
              </div>
            </details>
          )}

          {/* Bouton de suppression (On lui donne aussi des bords très arrondis pour matcher) */}
          <div className="pt-6">
            <DeleteButton plantId={plant.id} imageUrl={plant.image_path} />
          </div>

        </div>
      </main>
    </div>
  );
}
