// Affiché instantanément pendant le chargement du Jardin des souvenirs.
export default function MemorialLoading() {
  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans pb-32 overflow-x-hidden">

      <div className="bg-stone-800 bg-gradient-to-b from-stone-800 to-stone-900 rounded-b-[2.5rem] pb-10 pt-6 px-5 relative shadow-xl shadow-stone-900/20 overflow-hidden">
        <div className="max-w-md mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl w-11 h-11" />
            <div className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl w-11 h-11" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
            Jardin des souvenirs
          </h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-5 mt-6 relative z-20 space-y-3 animate-pulse">
        <div className="h-[72px] bg-white rounded-2xl border border-stone-100 shadow-sm" />
        <div className="h-[72px] bg-white rounded-2xl border border-stone-100 shadow-sm" />
        <div className="h-[72px] bg-white rounded-2xl border border-stone-100 shadow-sm" />
      </main>
    </div>
  );
}
