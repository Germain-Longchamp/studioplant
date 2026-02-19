import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Leaf, MapPin, Sprout } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
        
        {/* Titre de la page façon iOS / Magazine */}
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
          /* NOUVELLE GRILLE PREMIUM */
          <div className="grid grid-cols-2 gap-4">
            {plants.map((plant) => (
              <Link key={plant.id} href={`/dashboard/plant/${plant.id}`} className="group block h-full">
                <div className="flex flex-col h-full bg-white rounded-[2rem] overflow-hidden shadow-sm border border-stone-100/80 transition-all duration-300 hover:shadow-md hover:border-emerald-100 group-active:scale-[0.98]">
                  
                  {/* Zone Image avec Badge */}
                  <div className="relative aspect-[4/5] w-full bg-stone-100 overflow-hidden">
                    {plant.image_path ? (
                      <Image 
                        src={plant.image_path} 
                        alt={plant.name} 
                        fill 
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-stone-300">
                        <Leaf className="w-8 h-8 opacity-50" />
                      </div>
                    )}
                    
                    {/* Badge Pièce Flottant */}
                    {plant.room && (
                      <div className="absolute top-3 left-3 bg-white/85 backdrop-blur-md px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1 shadow-sm">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span className="truncate max-w-[70px]">{plant.room}</span>
                      </div>
                    )}
                    
                    {/* Dégradé léger en bas de l'image pour lier avec le fond blanc */}
                    <div className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-white to-transparent" />
                  </div>

                  {/* Bloc Texte */}
                  <div className="px-4 pb-5 pt-1 bg-white flex flex-col justify-end flex-1 z-10">
                    <h3 className="font-bold text-stone-800 text-[15px] leading-tight line-clamp-1">
                      {plant.name}
                    </h3>
                    <p className="text-xs text-stone-500 italic mt-1 line-clamp-1 font-medium">
                      {plant.species}
                    </p>
                  </div>

                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* FAB (Floating Action Button) Modernisé */}
      <div className="fixed bottom-6 right-6 md:hidden z-20">
        <Button asChild size="icon" className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 transition-transform active:scale-95">
          <Link href="/dashboard/add">
            <Plus className="w-7 h-7" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
