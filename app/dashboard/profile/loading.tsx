// Affiché instantanément pendant le chargement de la page profil.
export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans pb-32 overflow-x-hidden">

      <div className="bg-emerald-900 bg-gradient-to-b from-emerald-800 to-emerald-950 rounded-b-[2.5rem] pb-10 pt-6 px-5 relative shadow-xl shadow-emerald-900/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-md mx-auto relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl w-11 h-11" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
            Mon profil
          </h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-5 mt-6 relative z-20 space-y-6 animate-pulse">
        <div className="h-24 bg-white rounded-[1.5rem] border border-stone-100 shadow-sm" />
        <div className="h-72 bg-white rounded-[1.5rem] border border-stone-100 shadow-sm" />
        <div className="h-14 bg-rose-50/60 rounded-[1.25rem]" />
      </main>
    </div>
  );
}
