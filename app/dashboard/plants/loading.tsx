// Affiché instantanément par Next.js pendant que la liste des plantes charge côté
// serveur. Reprend le bandeau réel (pas de saut visuel à l'arrivée des données) et
// simule quelques cartes de la liste en attendant.
export default function PlantsLoading() {
  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans pb-32 overflow-x-hidden">

      {/* Bandeau — identique au vrai, pas de squelette ici pour éviter le clignotement du titre */}
      <div className="bg-emerald-900 bg-gradient-to-b from-emerald-800 to-emerald-950 rounded-b-[2.5rem] pb-10 pt-6 px-5 relative shadow-xl shadow-emerald-900/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-md mx-auto relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl w-11 h-11" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
              Ma Jungle
            </h1>
            <div className="h-4 w-40 bg-white/10 rounded-md mt-3 animate-pulse" />
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-5 mt-6 relative z-20 space-y-3 animate-pulse">
        {/* Barre de filtres */}
        <div className="h-7 w-full bg-stone-100 rounded-full" />

        {/* Cartes plante */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-stone-100/80 shadow-sm shadow-stone-200/60 flex items-stretch h-24 overflow-hidden"
          >
            <div className="w-24 shrink-0 bg-stone-100" />
            <div className="flex-1 p-4 space-y-2">
              <div className="h-4 w-2/3 bg-stone-100 rounded-md" />
              <div className="h-3 w-1/3 bg-stone-100 rounded-md" />
              <div className="h-8 w-full bg-stone-50 rounded-xl mt-2" />
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
