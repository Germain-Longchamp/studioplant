import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Droplets, Sun, MapPin, AlignLeft, Sparkles, Info, LeafyGreen } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="fixed top-0 w-full z-10 bg-gradient-to-b from-black/50 to-transparent">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center">
          <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/20 hover:text-white rounded-full">
            <Link href="/dashboard">
              <ArrowLeft className="w-6 h-6" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        <div className="relative w-full h-[45vh] bg-slate-200">
          {plant.image_path ? (
            <Image src={plant.image_path} alt={plant.name} fill className="object-cover" priority />
          ) : (
             <div className="flex items-center justify-center h-full"><Info className="w-12 h-12 text-slate-400" /></div>
          )}
        </div>

        <div className="px-4 py-6 -mt-6 relative bg-slate-50 rounded-t-3xl shadow-sm">
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">{plant.name}</h1>
            <p className="text-lg text-slate-500 italic">{plant.species}</p>
          </div>

          {/* BLOC 1 : Arrosage (Mini carte) */}
          <div className="bg-blue-50 p-4 rounded-2xl flex flex-col gap-2 mb-6 border border-blue-100/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-blue-600/80 font-medium uppercase tracking-wider">Fréquence d'arrosage</p>
                <p className="font-semibold text-blue-900">Tous les {plant.watering_frequency} jours</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {/* BLOC 2 : Emplacement (Utilisateur + IA) */}
            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-full text-purple-600 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-purple-600/80 font-medium uppercase tracking-wider">Pièce actuelle</p>
                  <p className="font-semibold text-purple-900">{plant.room || "Non précisée"}</p>
                </div>
              </div>
              {plant.room_advice && (
                <div className="mt-3 pt-3 border-t border-purple-200/50 flex gap-2 items-start">
                  <Sparkles className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-purple-800/90 leading-snug">{plant.room_advice}</p>
                </div>
              )}
            </div>

            {/* BLOC 3 : Luminosité (Utilisateur + IA) */}
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 rounded-full text-amber-600 shrink-0">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-amber-600/80 font-medium uppercase tracking-wider">Lumière actuelle</p>
                  <p className="font-semibold text-amber-900 leading-tight">{plant.exposure || "Non précisée"}</p>
                </div>
              </div>
              {plant.light_advice && (
                <div className="mt-3 pt-3 border-t border-amber-200/50 flex gap-2 items-start">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800/90 leading-snug">{plant.light_advice}</p>
                </div>
              )}
            </div>
          </div>

          {/* BLOC 4 : Entretien Détaillé (100% IA) */}
          <div className="bg-green-50/50 border border-green-100 p-5 rounded-2xl mb-6">
            <div className="flex items-center gap-2 mb-3">
              <LeafyGreen className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Guide d'entretien</h3>
            </div>
            <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">
              {plant.care_notes || "Aucun guide disponible pour le moment."}
            </p>
          </div>

          {/* BLOC 5 : Mes notes personnelles */}
          {plant.description && (
            <div className="bg-white border border-slate-100 shadow-sm p-5 rounded-2xl mb-6">
              <div className="flex items-center gap-2 mb-3">
                <AlignLeft className="w-5 h-5 text-slate-500" />
                <h3 className="font-semibold text-slate-800">Mes notes</h3>
              </div>
              <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
                {plant.description}
              </p>
            </div>
          )}

          <DeleteButton plantId={plant.id} imageUrl={plant.image_path} />

        </div>
      </main>
    </div>
  );
}
