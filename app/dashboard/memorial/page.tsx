import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, HeartCrack, Leaf } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { getDeceasedPlants, getUrgentWateringCount } from "@/server/actions";

export default async function MemorialPage() {
  const [deceasedPlants, urgentCount] = await Promise.all([
    getDeceasedPlants(),
    getUrgentWateringCount(),
  ]);

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans pb-32 overflow-x-hidden">

      {/* HEADER SOBRE */}
      <div className="bg-stone-800 bg-gradient-to-b from-stone-800 to-stone-900 rounded-b-[2.5rem] pb-10 pt-6 px-5 relative shadow-xl shadow-stone-900/20 overflow-hidden">
        <div className="max-w-md mx-auto relative z-10">
          <header className="flex items-center gap-4 mb-8">
            <Link
              href="/dashboard/profile"
              aria-label="Retour au profil"
              className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl text-stone-300 hover:text-white hover:bg-white/15 transition-colors active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl">
              <HeartCrack className="w-6 h-6 text-stone-300" />
            </div>
          </header>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
              Jardin des souvenirs
            </h1>
            <p className="text-stone-400 text-sm font-medium mt-1.5">
              {deceasedPlants.length > 0
                ? `${deceasedPlants.length} plante${deceasedPlants.length > 1 ? "s" : ""} qui ont marqué votre jungle`
                : "Un espace pour se souvenir"}
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-5 mt-6 relative z-20 space-y-3">
        {deceasedPlants.length === 0 ? (
          <div className="bg-white rounded-[1.5rem] border border-stone-100 shadow-sm p-8 text-center">
            <div className="w-14 h-14 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-6 h-6 text-stone-300" />
            </div>
            <p className="text-stone-500 text-sm font-medium leading-relaxed">
              Aucune plante ici pour l'instant. Tant mieux !
            </p>
          </div>
        ) : (
          deceasedPlants.map((plant) => {
            const deceasedAtFormatted = plant.deceased_at
              ? new Date(plant.deceased_at).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "long", year: "numeric",
                })
              : null;

            return (
              <Link
                key={plant.id}
                href={`/dashboard/plant/${plant.id}`}
                className="flex items-center gap-4 bg-white rounded-2xl overflow-hidden shadow-sm shadow-stone-200/60 border border-stone-100/80 px-4 py-3 transition-all duration-200 hover:shadow-md active:scale-[0.99]"
              >
                <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-stone-100">
                  {plant.image_path ? (
                    <Image
                      src={plant.image_path}
                      alt={plant.name ?? "Plante"}
                      fill
                      className="object-cover grayscale"
                      sizes="56px"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <Leaf className="w-5 h-5 text-stone-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-stone-800 text-sm leading-tight truncate">
                    {plant.name ?? "Sans nom"}
                  </h3>
                  {plant.species && (
                    <p className="text-[11px] text-stone-400 italic truncate mt-0.5">{plant.species}</p>
                  )}
                  <p className="text-[10px] text-stone-400 font-medium mt-1">
                    {deceasedAtFormatted ? `Depuis le ${deceasedAtFormatted}` : ""}
                    {plant.deceased_reason ? ` · ${plant.deceased_reason}` : ""}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </main>

      <BottomNav urgentCount={urgentCount} />
    </div>
  );
}
