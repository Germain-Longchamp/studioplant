// Affiché instantanément par Next.js pendant que la page (fiche plante) charge ses
// données côté serveur, au lieu d'un écran figé/blanc pendant la navigation.
// Les dimensions reprennent celles du vrai contenu pour éviter tout saut de mise en page.
export default function PlantDetailLoading() {
  return (
    <div className="min-h-screen bg-[#F4F7F4] pb-32 font-sans animate-pulse">
      <main className="max-w-md mx-auto">

        {/* Hero photo */}
        <div className="relative w-full h-[85vw] max-h-[380px] bg-stone-200" />

        {/* Carte identité */}
        <div className="relative z-10 -mt-6 px-4">
          <div className="bg-white rounded-[1.5rem] shadow-[0_-6px_16px_rgba(0,0,0,0.05)] px-5 pt-4 pb-3.5">
            <div className="h-6 w-2/3 bg-stone-200 rounded-md" />
            <div className="h-3 w-1/3 bg-stone-100 rounded-md mt-2" />
          </div>
        </div>

        <div className="px-4 pt-3 space-y-3">
          {/* Carte arrosage */}
          <div className="bg-white rounded-[1.5rem] border border-stone-100 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 bg-stone-100 rounded-md" />
              <div className="h-4 w-16 bg-stone-100 rounded-md" />
            </div>
            <div className="flex gap-2">
              <div className="h-12 flex-1 bg-stone-100 rounded-[1.25rem]" />
              <div className="h-12 flex-1 bg-stone-100 rounded-[1.25rem]" />
            </div>
          </div>

          {/* Guide d'entretien */}
          <div className="bg-white rounded-[1.5rem] border border-stone-100 shadow-sm h-16" />

          {/* Journal de croissance */}
          <div className="bg-white rounded-[1.5rem] border border-stone-100 shadow-sm h-24" />

          {/* Docteur Plante */}
          <div className="bg-white rounded-[1.5rem] border border-stone-100 shadow-sm h-24" />
        </div>
      </main>
    </div>
  );
}
