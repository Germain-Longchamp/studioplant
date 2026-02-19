import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, Plus, Leaf } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-full">
              <Leaf className="w-5 h-5 text-green-700" />
            </div>
            <h1 className="font-bold text-lg text-green-900">Mon Jardin</h1>
          </div>
          <form action={signOut}>
            <Button variant="ghost" size="icon" type="submit">
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </Button>
          </form>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6 mt-2">
        {!plants || plants.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="p-4 bg-muted rounded-full">
                <Leaf className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">Aucune plante</h3>
                <p className="text-sm text-muted-foreground">Commencez à créer votre jardin.</p>
              </div>
              <Button asChild className="bg-green-600 hover:bg-green-700 mt-4">
                <Link href="/dashboard/add">
                  <Plus className="w-4 h-4 mr-2" /> Ajouter une plante
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          // LA NOUVELLE GRILLE À 2 COLONNES
          <div className="grid grid-cols-2 gap-3">
            {plants.map((plant) => (
              <Link key={plant.id} href={`/dashboard/plant/${plant.id}`}>
                <Card className="overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md transition-all cursor-pointer group border-transparent hover:border-green-100">
                  
                  {/* Image carrée prenant toute la largeur de la carte */}
                  <div className="relative aspect-square w-full bg-slate-100 border-b border-slate-100">
                    {plant.image_path ? (
                      <Image 
                        src={plant.image_path} 
                        alt={plant.name} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-slate-300">
                        <Leaf className="w-8 h-8 opacity-50" />
                      </div>
                    )}
                  </div>

                  {/* Bloc de texte net et concis */}
                  <div className="p-3 bg-white flex flex-col justify-center flex-1">
                    <h3 className="font-semibold text-sm text-slate-800 line-clamp-1">
                      {plant.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {plant.species}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6 md:hidden">
        <Button asChild size="icon" className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 shadow-lg">
          <Link href="/dashboard/add">
            <Plus className="w-6 h-6" />
          </Link>
        </Button>
      </div>
    </div>
  );
}