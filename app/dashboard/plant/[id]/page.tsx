import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Droplets, Sun, AlignLeft, Sparkles, Info, LeafyGreen, ChevronDown } from "lucide-react";
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
        {/* Image hero */}
        <div className="relative w-full h-[50vh] bg-stone-200">
          {plant.image_path ? (
            <Image src={plant.image_path} alt={plant.name} fill className="object-cover" priority />
          ) : (
             <div className="flex items-center justify-center h-full"><Info className="w-12 h-12 text-stone-300" /></div>
          )}
          <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-stone-50 to-transparent" />
        </div>

        {/* Contenu principal */}
        <div className="px-5 relative -mt-12 z-10 space-y-4">
          
          {/* En-tête de la plante */}
          <div className="mb-8 pt-2">
            <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight leading-none mb-2">
              {plant.name}
            </h1>
            <p className="text-lg text-stone-500 font-medium italic">
              {plant.species}
            </p>
          </div>

          {/* === 1. ACCORDÉON : ARROSAGE === */}
          <details className="group [&_summary::-webkit-details-marker]:hidden bg-white rounded-[2rem] shadow-sm border border-stone-100/80 overflow-hidden" open>
            <summary className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-stone-50/50 active:bg-stone-100">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="p-3 bg-sky-50 rounded-2xl text-sky-500 shrink-0">
                  <Droplets className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left overflow-hidden pr-2">
                  <span className="text-stone-800 font-semibold text-lg">Arrosage</span>
                  {/* Info utilisateur visible avant ouverture */}
                  <span className="text-stone-500 text-sm truncate">Tous les {plant.watering_frequency} jours</span>
                </div>
              </div>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-white transition-colors shrink-0">
                <ChevronDown className="h-5 w-5 text-stone-400 transition-transform duration-300 group-open:-rotate-180" />
              </div>
            </summary>
            {/* Contenu pleine largeur centré */}
            <div className="px-5 pb-5 pt-1 text-stone-600 animate-in fade-in duration-300">
              <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-100 flex items-start gap-3">
                <Info className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                <p className="text-sm text-stone-700 leading-relaxed">
                  Avant d'arroser, touchez la terre : si elle est encore humide sur les premiers centimètres, patientez un peu.
                </p>
              </div>
            </div>
          </details>

          {/* === 2. ACCORDÉON : ENVIRONNEMENT === */}
          <details className="group [&_summary::-webkit-details-marker]:hidden bg-white rounded-[2rem] shadow-sm border border-stone-100/80 overflow-hidden">
            <summary className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-stone-50/50 active:bg-stone-100">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-500 shrink-0">
                  <Sun className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left overflow-hidden pr-2">
                  <span className="text-stone-800 font-semibold text-lg">Environnement</span>
                  {/* Info utilisateur visible avant ouverture */}
                  <span className="text-stone-500 text-sm truncate">
                    {plant.room || "Pièce inconnue"} • {plant.exposure || "Lumière non précisée"}
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-white transition-colors shrink-0">
                <ChevronDown className="h-5 w-5 text-stone-400 transition-transform duration-300 group-open:-rotate-180" />
              </div>
            </summary>
            {/* Contenu pleine largeur avec les sous-cartes d'avis IA */}
            <div className="px-5 pb-6 pt-1 space-y-3 text-stone-600 animate-in fade-in duration-300">
              {plant.room_advice && (
                <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                  <h4 className="text-purple-800 font-semibold text-sm mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Avis sur la pièce
                  </h4>
                  <p className="text-sm text-stone-700 leading-relaxed">{plant.room_advice}</p>
                </div>
              )}
              {plant.light_advice && (
                <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                  <h4 className="text-amber-800 font-semibold text-sm mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Avis sur la lumière
                  </h4>
                  <p className="text-sm text-stone-700 leading-relaxed">{plant.light_advice}</p>
                </div>
              )}
            </div>
          </details>

          {/* === 3. ACCORDÉON : GUIDE D'ENTRETIEN (IA seule) === */}
          <details className="group [&_summary::-webkit-details-marker]:hidden bg-white rounded-[2rem] shadow-sm border border-stone-100/80 overflow-hidden">
            <summary className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-stone-50/50 active:bg-stone-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shrink-0">
                  <LeafyGreen className="w-5 h-5" />
                </div>
                <span className="text-stone-800 font-semibold text-lg">Guide d'entretien</span>
              </div>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-white transition-colors shrink-0">
                <ChevronDown className="h-5 w-5 text-stone-400 transition-transform duration-300 group-open:-rotate-180" />
              </div>
            </summary>
            <div className="px-5 pb-6 pt-1 text-stone-600 animate-in fade-in duration-300">
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                  {plant.care_notes || "Aucun guide disponible pour le moment."}
                </p>
              </div>
            </div>
          </details>

          {/* === 4. ACCORDÉON : MON CARNET (S'affiche uniquement s'il y a une description) === */}
          {plant.description && (
            <details className="group [&_summary::-webkit-details-marker]:hidden bg-white rounded-[2rem] shadow-sm border border-stone-100/80 overflow-hidden">
              <summary className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-stone-50/50 active:bg-stone-100">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="p-3 bg-stone-100 rounded-2xl text-stone-600 shrink-0">
                    <AlignLeft className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col text-left overflow-hidden pr-2">
                    <span className="text-stone-800 font-semibold text-lg">Mon carnet</span>
                    {/* Info utilisateur coupée sur 1 ligne (truncate) visible avant ouverture */}
                    <span className="text-stone-500 text-sm truncate">{plant.description}</span>
                  </div>
                </div>
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-white transition-colors shrink-0">
                  <ChevronDown className="h-5 w-5 text-stone-400 transition-transform duration-300 group-open:-rotate-180" />
                </div>
              </summary>
              <div className="px-5 pb-6 pt-1 text-stone-600 animate-in fade-in duration-300">
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                    {plant.description}
                  </p>
                </div>
              </div>
            </details>
          )}

          <div className="pt-6">
            <DeleteButton plantId={plant.id} imageUrl={plant.image_path} />
          </div>

        </div>
      </main>
    </div>
  );
}
