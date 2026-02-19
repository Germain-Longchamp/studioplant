import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Leaf, MapPin, Sprout, Droplets } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getWateringStatus } from "@/lib/utils";
import { waterPlant } from "@/server/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Récupération des plantes
  const { data: plants } = await supabase
    .from("plants")
    .select("*")
    .order("created_at", { ascending: false });

  const signOut = async () => {
    "use server";
    const supabaseAuth = await createClient();
    await supabaseAuth.auth.signOut();
    redirect("/auth/login");
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans pb-24">
      
      {/* Header Minimaliste */}
      <header className="max-w-md mx-auto px-4 pt-6 pb-2 flex items-center justify-between">
        <div className="p-2.5 bg-white shadow-sm border border-stone-100 rounded-2xl">
          <Leaf className="w-6 h-6 text-emerald-600" />
        </div>
        <form action={signOut}>
          <Button variant="ghost" size="icon" type="submit" className="text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-full">
            <LogOut className="w-5 h-5" />
          </Button>
        </form>
      </header>

      <main className="max-w-md mx-auto px-5 mt-4 space-y-8">
        
        {/* Titre de la page */}
        <div>
          <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight leading-none mb-2">
            Mon Jardin
          </h1>
          <p className="text-lg text-stone-500 font-medium">
            {plants && plants.length > 0 
              ? `Vous avez ${plants.length} plante${plants.length > 1 ? 's' : ''}.` 
              : "Votre espace est encore vide."}
          </p>
        </div>

        {/* État vide */}
        {!plants || plants.length === 0 ? (
          <div className="bg-white rounded-[2rem] border-2 border-dashed border-stone-200 p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
            <div className="p-4 bg-stone-50 rounded-full">
              <Sprout className="w-8 h-8 text-stone-400" />
            </div>
            <div>
              <h3 className="font-bold text-stone-800 text-lg">Aucune plante</h3>
              <p className="text-sm text-stone-500 mt-1">Commencez à créer votre jungle urbaine.</p>
            </div>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 py-6 mt-4 shadow-md transition-all active:scale-95">
              <Link href="/dashboard/add">
                <Plus className="w-5 h-5 mr-2" /> Ajouter une plante
              </Link>
            </Button>
          </div>
        ) : (
          /* NOUVELLE VUE LISTE PLEINE LARGEUR */
          <div className="flex flex-col gap-4">
            {plants.map((plant) => {
              const snoozeDays = plant.snooze_days || 0;
              const history = plant.watering_history || [];
              const status = getWateringStatus(plant.last_watered_at, plant.watering_frequency, snoozeDays);

              return (
                <div key={plant.id} className="group relative flex flex-row bg-white rounded-[1.75rem] overflow-hidden shadow-sm border border-stone-100/80 transition-all duration-300 hover:shadow-md hover:border-emerald-100">
                  
                  {/* Lien magique sur toute la carte */}
                  <Link href={`/dashboard/plant/${plant.id}`} className="absolute inset-0 z-10" />
                  
                  {/* Zone Image : À gauche, occupe environ 35% de la carte */}
                  <div className="relative w-[35%] min-w-[120px] max-w-[140px] bg-stone-100 shrink-0 border-r border-stone-100/50">
                    {plant.image_path ? (
                      <Image 
                        src={plant.image_path} 
                        alt={plant.name} 
                        fill 
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-stone-300">
                        <Leaf className="w-8 h-8 opacity-50" />
                      </div>
                    )}
                  </div>

                  {/* Bloc Contenu : À droite, prend le reste de la place */}
                  <div className="flex flex-col flex-1 p-4">
                    
                    {/* Partie Haute : Titre + Sous-titre + Pièce */}
                    <div className="flex-1">
                      <h3 className="font-bold text-stone-800 text-lg leading-tight line-clamp-1 pr-2">
                        {plant.name}
                      </h3>
                      <p className="text-sm text-stone-500 italic mt-0.5 line-clamp-1">
                        {plant.species}
                      </p>
                      
                      {/* Badge Pièce */}
                      {plant.room && (
                        <div className="inline-flex items-center gap-1 mt-2.5 bg-stone-50 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-stone-500 border border-stone-200/60">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          {plant.room}
                        </div>
                      )}
                    </div>

                    {/* Partie Basse : Statut et Bouton Arroser */}
                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between relative z-20">
                      
                      {/* Statut ("Dans X jours") */}
                      <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${status.urgent ? 'text-rose-600' : 'text-stone-400'}`}>
                        {status.urgent && <Droplets className="w-3 h-3 animate-pulse" />}
                        {status.text}
                      </div>

                      {/* Bouton Arroser */}
                      <form action={waterPlant.bind(null, plant.id, history)}>
                        <Button 
                          type="submit" 
                          size="sm"
                          variant={status.urgent ? "destructive" : "outline"}
                          className={`h-8 rounded-xl px-3.5 text-xs font-bold transition-all active:scale-95 ${status.urgent ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-800'}`}
                        >
                          <Droplets className={`w-3.5 h-3.5 mr-1.5 ${status.urgent ? 'text-rose-100' : 'text-stone-400'}`} />
                          Arroser
                        </Button>
                      </form>

                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FAB */}
      <div className="fixed bottom-6 right-6 md:hidden z-30">
        <Button asChild size="icon" className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 transition-transform active:scale-95">
          <Link href="/dashboard/add">
            <Plus className="w-7 h-7" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
