"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Leaf, Sparkles, Droplets, Camera, Stethoscope, ArrowRight, ShieldCheck, Star, Users, Timer } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current || !imageWrapperRef.current) return;

    let ctx = gsap.context(() => {
      
      // 1. ANIMATION : Commence tout de suite, réagit au moindre scroll
      gsap.fromTo(imageWrapperRef.current, 
        {
          scale: 0.6,    
          opacity: 0,    
          y: 200,        
          rotationX: 20, 
        },
        {
          scale: 1,      
          opacity: 1,    
          y: 0,          
          rotationX: 0,  
          ease: "power2.out", 
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 90%", // Démarre quand le haut du bloc touche le bas de l'écran
            end: "top 20%",   // Se termine très vite
            scrub: 0.1,       // Hyper réactif au doigt/molette
          }
        }
      );

      // 2. PIN : Bloque l'image au centre pendant une courte durée
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top 15%", // Déclenche le blocage quand l'image est bien centrée
        end: "+=400px",   // Maintient le blocage sur une courte distance (400px)
        pin: true,
      });

    }, containerRef);

    return () => ctx.revert(); 
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans text-stone-800 overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900 relative">
      
      {/* 🟢 FONDS & TEXTURES CORRIGÉS (z-0 au lieu de -z-10 pour être sûr de les voir) */}
      
      {/* Grille de points texturée avec dégradé transparent */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: 'radial-gradient(#a8a29e 2px, transparent 2px)',
          backgroundSize: '32px 32px',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)'
        }}
      />
      
      {/* Halos de couleur en arrière-plan */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-400/20 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-[10%] right-[-10%] w-[400px] h-[400px] bg-amber-300/20 blur-[120px] rounded-full pointer-events-none z-0" />


      {/* 🟢 HEADER */}
      <header className="absolute top-0 w-full px-6 py-6 flex items-center justify-between z-50 max-w-5xl left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2 text-emerald-800 font-bold text-xl tracking-tight">
          <Leaf className="w-6 h-6 text-emerald-500" />
          StudioPlant
        </div>
        <Button 
          className="font-bold bg-white text-stone-700 border border-stone-200/60 shadow-sm hover:shadow-md hover:bg-stone-50 hover:text-emerald-700 rounded-full px-6 h-10 transition-all active:scale-95" 
          asChild
        >
          <Link href="/auth/login">Connexion</Link>
        </Button>
      </header>

      {/* 🟢 CONTENU PRINCIPAL (Mis en z-10 pour passer au-dessus de la texture de fond) */}
      <main className="relative z-10">
        
        <section className="max-w-5xl mx-auto px-6 pt-32 pb-0 text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wide mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Propulsé par l'IA
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-stone-900 tracking-tight leading-[1.1] mb-6 drop-shadow-sm">
            Ne laissez plus vos plantes <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">mourir de soif.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-stone-600 mb-10 max-w-2xl leading-relaxed font-medium">
            Prenez une photo. L'IA identifie votre plante, s'adapte à votre intérieur et crée son calendrier d'arrosage sur-mesure. C'est aussi simple que ça.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-lg shadow-xl shadow-emerald-900/20 transition-all active:scale-95" asChild>
              <Link href="/auth/login">
                Créer ma jungle <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-full bg-white/80 backdrop-blur-sm border-stone-200 text-stone-700 font-bold text-lg hover:bg-white transition-all active:scale-95 shadow-sm" asChild>
              <Link href="#features">
                Découvrir
              </Link>
            </Button>
          </div>
        </section>

        {/* 🟢 BLOC GSAP (Taille fixée à 90vh pour prendre l'écran sans créer de vide) */}
        <div ref={containerRef} className="relative w-full h-[90vh] flex items-center justify-center mt-12">
           <div className="w-full h-full flex items-center justify-center overflow-hidden perspective-[1200px]">
              
              <div ref={imageWrapperRef} className="relative w-[95%] max-w-[420px] sm:max-w-[550px] md:max-w-[700px] h-[80vh] sm:h-[90vh] will-change-transform">
                 <Image 
                    src="/app-mockup.png"
                    alt="Aperçu de l'application StudioPlant"
                    fill
                    className="object-contain drop-shadow-2xl"
                    priority
                 />
              </div>

           </div>
        </div>

        {/* 🟢 SUITE DU SITE (Fond blanc pur pour cacher l'image quand on scroll par dessus) */}
        <div className="max-w-5xl mx-auto px-6 pb-24 md:pb-32 relative z-20 bg-[#FDFCF8] pt-12 md:pt-24 mt-[-1px]">

          <section>
            <div className="bg-white/60 backdrop-blur-xl border border-stone-200/50 rounded-3xl p-8 shadow-sm relative z-20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-stone-200/60">
                <div className="flex flex-col items-center text-center pt-4 md:pt-0">
                  <div className="flex items-center justify-center w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full mb-3">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-3xl font-black text-stone-800 mb-1">98%</h4>
                  <p className="text-sm font-medium text-stone-500">De survie après 1 an pour<br/>les utilisateurs actifs</p>
                </div>
                <div className="flex flex-col items-center text-center pt-8 md:pt-0">
                  <div className="flex items-center justify-center w-10 h-10 bg-amber-50 text-amber-500 rounded-full mb-3">
                    <Timer className="w-5 h-5" />
                  </div>
                  <h4 className="text-3xl font-black text-stone-800 mb-1">2 sec</h4>
                  <p className="text-sm font-medium text-stone-500">Le temps moyen pour identifier<br/>votre nouvelle plante</p>
                </div>
                <div className="flex flex-col items-center text-center pt-8 md:pt-0">
                  <div className="flex items-center justify-center w-10 h-10 bg-sky-50 text-sky-500 rounded-full mb-3">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="text-3xl font-black text-stone-800 mb-1">10k+</h4>
                  <p className="text-sm font-medium text-stone-500">Diagnostics médicaux réalisés<br/>par notre IA botanique</p>
                </div>
              </div>
            </div>
          </section>

          <section id="features" className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-20">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/40 border border-stone-100/60 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-colors group-hover:bg-sky-100"></div>
              <div className="w-14 h-14 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                <Camera className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-3 relative z-10">Reconnaissance IA</h3>
              <p className="text-stone-500 leading-relaxed font-medium relative z-10">
                Scannez n'importe quelle plante en un clic. L'IA retrouve son nom et ses besoins spécifiques instantanément.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/40 border border-stone-100/60 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-colors group-hover:bg-emerald-100"></div>
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                <Droplets className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-3 relative z-10">Arrosage millimétré</h3>
              <p className="text-stone-500 leading-relaxed font-medium relative z-10">
                Fini les oublis et les noyades. Suivez en temps réel les besoins en eau de votre jungle urbaine.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/40 border border-stone-100/60 relative overflow-hidden group md:col-span-1 sm:col-span-2">
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

          <section className="mt-32 max-w-3xl mx-auto text-center px-4 relative z-20">
            <div className="flex items-center justify-center gap-1 mb-6 text-amber-400">
              <Star className="w-6 h-6 fill-current" />
              <Star className="w-6 h-6 fill-current" />
              <Star className="w-6 h-6 fill-current" />
              <Star className="w-6 h-6 fill-current" />
              <Star className="w-6 h-6 fill-current" />
            </div>
            <blockquote className="text-2xl md:text-3xl font-semibold text-stone-800 leading-tight mb-6">
              "Je tuais même mes cactus. Depuis que j'utilise StudioPlant, mon appartement ressemble enfin à une vraie jungle urbaine."
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 font-bold text-sm">S</div>
              <div className="text-left">
                <p className="text-sm font-bold text-stone-800">Sarah M.</p>
                <p className="text-xs text-stone-500 font-medium">Débutante repentie</p>
              </div>
            </div>
          </section>

          <section className="mt-24 bg-emerald-950 rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl shadow-emerald-900/20 z-20">
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-emerald-500/20 blur-[100px] rounded-full"></div>
            
            <div className="relative z-10 max-w-xl mx-auto">
              <Leaf className="w-12 h-12 text-emerald-400 mx-auto mb-6" />
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
                Prêt à avoir la main verte ?
              </h2>
              <p className="text-emerald-100/80 mb-10 text-lg font-medium">
                Rejoignez l'application et transformez votre intérieur en un véritable écosystème végétal.
              </p>
              <Button size="lg" className="w-full sm:w-auto h-14 px-10 rounded-full bg-white text-emerald-950 hover:bg-stone-100 hover:scale-105 font-extrabold text-lg transition-all active:scale-95 shadow-xl" asChild>
                <Link href="/auth/login">
                  Démarrer gratuitement
                </Link>
              </Button>
            </div>
          </section>

        </div>
      </main>

      <footer className="border-t border-stone-200/50 py-8 text-center text-stone-400 text-sm font-medium relative z-20 bg-[#FDFCF8]">
        <p>© {new Date().getFullYear()} StudioPlant. Conçu avec amour et beaucoup d'eau.</p>
      </footer>
    </div>
  );
}
