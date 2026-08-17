// Affiché instantanément pendant le chargement du tableau de bord.
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans pb-32 overflow-x-hidden relative">

      {/* Bandeau — identique au vrai (titre statique, seule la date est en squelette) */}
      <div className="bg-emerald-900 bg-gradient-to-b from-emerald-800 to-emerald-950 rounded-b-[2.5rem] pb-24 pt-6 px-5 relative shadow-xl shadow-emerald-900/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-md mx-auto relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl w-11 h-11" />
              <span className="text-white font-extrabold text-lg tracking-tight">StudioPlantes</span>
            </div>
            <div className="w-11 h-11 bg-white/10 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
              Tableau de bord
            </h1>
            <div className="h-4 w-48 bg-white/10 rounded-md mt-3 animate-pulse" />
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-5 -mt-14 relative z-20 space-y-10 animate-pulse">

        {/* Widgets écosystème */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-stone-100 aspect-[4/3] flex flex-col justify-between">
            <div className="w-11 h-11 bg-stone-100 rounded-xl" />
            <div className="space-y-1.5">
              <div className="h-7 w-16 bg-stone-100 rounded-md" />
              <div className="h-3 w-20 bg-stone-100 rounded-md" />
            </div>
          </div>
          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-stone-100 aspect-[4/3] flex flex-col justify-between">
            <div className="w-11 h-11 bg-stone-100 rounded-xl" />
            <div className="space-y-1.5">
              <div className="h-7 w-16 bg-stone-100 rounded-md" />
              <div className="h-3 w-20 bg-stone-100 rounded-md" />
            </div>
          </div>
        </section>

        {/* Outils rapides */}
        <section className="space-y-4">
          <div className="h-16 bg-white rounded-[2rem] border border-stone-100 shadow-sm" />
          <div className="h-20 bg-white rounded-[2rem] border border-stone-100 shadow-sm" />
        </section>

      </main>
    </div>
  );
}
