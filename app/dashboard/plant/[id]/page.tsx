import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Droplets, Sun, MapPin, AlignLeft, Sparkles, Info } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import DeleteButton from "./DeleteButton"; // 👈 L'import de ton bouton de suppression

export default async function PlantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Récupérer la plante spécifique selon l'ID
  const { data: plant, error } = await supabase
    .from("plants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !plant) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header transparent */}
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
        {/* Grande zone image */}
        <div className="relative w-full h-[45vh] bg-slate-200">
          {plant.image_path ? (
            <Image 
              src={plant.image_path} 
              alt={plant.name} 
              fill 
              className="object-cover"
              priority
            />
          ) : (
             <div className="flex items-center justify-center h-full">
               <Info className="w-12 h-12 text-slate-400" />
             </div>
          )}
        </div>

        {/* Contenu textuel */}
        <div className="px-4 py-6 -mt-6 relative bg-slate-50 rounded-t-3xl shadow-sm">
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">{plant.name}</h1>
            <p className="text-lg text-slate-500 italic">{plant.species}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Carte Arrosage (IA) */}
            <div className="bg-blue-50 p-4 rounded-2xl flex flex-col gap-2">
              <div className="p-2 bg-blue-100 w-fit rounded-full text-blue-600">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-blue-600/80 font-medium uppercase tracking-wider">Arrosage</p>
                <p className="font-semibold text-blue-900">Tous les {plant.watering_frequency} jours</p>
              </div>
            </div>

            {/* Carte Exposition (Saisie Utilisateur) */}
            <div className="bg-amber-50 p-4 rounded-2xl flex flex-col gap-2">
              <div className="p-2 bg-amber-100 w-fit rounded-full text-amber-600">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-amber-600/80 font-medium uppercase tracking-wider">Lumière</p>
                <p className="font-semibold text-amber-900 text-sm leading-tight">
                  {plant.exposure || "Non spécifié"}
                </p>
              </div>
            </div>
          </div>

          {/* Emplacement / Pièce (Saisie Utilisateur) */}
          {plant.room && (
            <div className="bg-purple-50 p-4 rounded-2xl flex items-center gap-4 mb-6">
              <div className="p-3 bg-purple-100 rounded-full text-purple-600 shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-purple-600/80 font-medium uppercase tracking-wider">Emplacement</p>
                <p className="font-semibold text-purple-900">{plant.room}</p>
              </div>
            </div>
          )}

          {/* Conseil de l'IA */}
          <div className="bg-green-50/50 border border-green-100 p-5 rounded-2xl mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Conseil de l'IA</h3>
            </div>
            <p className="text-slate-700 leading-relaxed text-sm">
              {plant.care_notes || "Aucun conseil particulier pour le moment."}
            </p>
          </div>

          {/* Mes notes / Description (Saisie Utilisateur) */}
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

          {/* 🔴 LE BOUTON DE SUPPRESSION 🔴 */}
          <DeleteButton plantId={plant.id} imageUrl={plant.image_path} />

        </div>
      </main>
    </div>
  );
}