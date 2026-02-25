import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Leaf, Sparkles, Droplets, Camera, Stethoscope, ArrowRight, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans text-stone-800 overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* EFFETS DE LUMIÈRE EN FOND (Gradients) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-400/20 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-amber-200/20 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* HEADER SIMPLE */}
      <header className="absolute top-0 w-full px-6 py-6 flex items-center justify-between z-50 max-w-5xl left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2 text-emerald-800 font-bold text-xl tracking-tight">
          <Leaf className="w-6 h-6 text-emerald-500" />
          StudioPlant
        </div>
        <Button variant="ghost" className="font-semibold text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full" asChild>
          <Link href="/auth/login">Connexion</Link>
        </Button>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-24 md:pt-48 md:pb-32">
        
        {/* HERO SECTION */}
        <section className="text-center max-w-3xl mx-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wide mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> Propulsé par l'IA
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-stone-900 tracking-tight leading-[1.1] mb-6 drop-shadow-sm">
            Ne laissez plus vos plantes <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">mourir de soif.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-stone-500 mb-10 max-w-2xl leading-relaxed font-medium">
            Prenez une photo. L'IA identifie votre plante, s'adapte à votre intérieur et crée son calendrier d'arrosage sur-mesure. C'est aussi simple que ça.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-lg shadow-xl shadow-emerald-900/20 transition-all active:scale-95" asChild>
              <Link href="/auth/login">
                Créer ma jungle <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-full bg-white border-stone-200 text-stone-700 font-bold text-lg hover:bg-stone-50 transition-all active:scale-95" asChild>
              <Link href="#features">
                Découvrir
              </Link>
            </Button>
          </div>
        </section>

        {/* BENTO GRID (FEATURES) */}
        <section id="features" className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 fill-mode-both">
          
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-colors group-hover:bg-sky-100"></div>
            <div className="w-14 h-14 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mb-6 relative z-10">
              <Camera className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-3 relative z-10">Reconnaissance IA</h3>
            <p className="text-stone-500 leading-relaxed font-medium relative z-10">
              Scannez n'importe quelle plante en un clic. L'IA retrouve son nom et ses besoins spécifiques instantanément.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-colors group-hover:bg-emerald-100"></div>
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 relative z-10">
              <Droplets className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-3 relative z-10">Arrosage millimétré</h3>
            <p className="text-stone-500 leading-relaxed font-medium relative z-10">
              Fini les oublis et les noyades. Suivez en temps réel les besoins en eau de votre jungle urbaine.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100 relative overflow-hidden group md:col-span-1 sm:col-span-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-colors group-hover:bg-rose-100"></div>
            <div className="w-14 h-14 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center mb-6 relative z-10">
              <Stethoscope className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-3 relative z-10">Docteur Plante</h3>
            <p className="text-stone-500 leading-relaxed font-medium relative z-10">
              Une feuille jaune ? Une tache suspecte ? Prenez une photo et obtenez un diagnostic médical et un plan de sauvetage.
            </p>
          </div>

        </section>

        {/* BOTTOM CTA */}
        <section className="mt-32 bg-emerald-950 rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl shadow-emerald-900/20">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-emerald-500/20 blur-[100px] rounded-full"></div>
          
          <div className="relative z-10 max-w-xl mx-auto">
            <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
              Prêt à avoir la main verte ?
            </h2>
            <p className="text-emerald-100/80 mb-10 text-lg font-medium">
              Rejoignez StudioPlant et transformez votre intérieur en un véritable écosystème végétal.
            </p>
            <Button size="lg" className="w-full sm:w-auto h-14 px-10 rounded-full bg-white text-emerald-950 hover:bg-stone-100 font-extrabold text-lg transition-all active:scale-95 shadow-xl" asChild>
              <Link href="/auth/login">
                Démarrer gratuitement
              </Link>
            </Button>
          </div>
        </section>

      </main>

      {/* FOOTER SIMPLE */}
      <footer className="border-t border-stone-200/50 mt-12 py-8 text-center text-stone-400 text-sm font-medium">
        <p>© {new Date().getFullYear()} StudioPlant. Conçu avec amour et beaucoup d'eau.</p>
      </footer>
    </div>
  );
}
