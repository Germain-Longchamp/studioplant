"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Leaf, Mail, Lock, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

// 🟢 Utilitaire pour traduire les erreurs Supabase en messages clairs et en français
const getErrorMessage = (error: any) => {
  const msg = error?.message || "";
  
  if (msg.includes("Invalid login credentials")) {
    return "Adresse email ou mot de passe incorrect.";
  }
  if (msg.includes("User already registered")) {
    return "Un compte existe déjà avec cette adresse email.";
  }
  if (msg.includes("Password should be at least")) {
    return "Le mot de passe est trop court (6 caractères minimum).";
  }
  if (msg.includes("Email not confirmed")) {
    return "Veuillez confirmer votre adresse email avant de vous connecter.";
  }
  if (msg.includes("rate limit") || msg.includes("Too many requests")) {
    return "Trop de tentatives. Veuillez patienter quelques instants.";
  }
  
  // Message par défaut si l'erreur est inconnue
  return "Une erreur inattendue est survenue. Veuillez réessayer.";
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSignUp) {
      // --- INSCRIPTION ---
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        toast.error(getErrorMessage(error)); // Affichage de l'erreur traduite
      } else {
        toast.success("Compte créé avec succès ! Bienvenue.");
        router.push("/dashboard");
        router.refresh(); 
      }
    } else {
      // --- CONNEXION ---
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(getErrorMessage(error)); // Affichage de l'erreur traduite
      } else {
        toast.success("Connexion réussie !");
        router.push("/dashboard");
        router.refresh();
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans text-stone-800 flex flex-col justify-center relative overflow-hidden selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* 🟢 FONDS & TEXTURES */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: 'radial-gradient(#a8a29e 2px, transparent 2px)',
          backgroundSize: '32px 32px',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)'
        }}
      />
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-400/20 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-300/20 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* BOUTON RETOUR */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-white border border-stone-200/60 shadow-sm text-stone-500 hover:text-stone-800 hover:bg-stone-50 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>

      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-12">
        
        {/* EN-TÊTE */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100/60 mb-4 rotate-3">
            <Leaf className="w-8 h-8 text-emerald-500 -rotate-3" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-2">
            StudioPlantes
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight mb-2">
            {isSignUp ? "Créer un compte" : "Bon retour"}
          </h1>
          <p className="text-stone-500 font-medium">
            {isSignUp
              ? "Rejoignez la communauté StudioPlantes."
              : "Connectez-vous à votre jungle urbaine."}
          </p>
        </div>
        
        {/* FORMULAIRE */}
        <div className="bg-white/80 backdrop-blur-xl border border-stone-200/50 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl shadow-stone-200/40 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <form onSubmit={handleAuth} className="space-y-5">
            
            <div className="space-y-2.5">
              <Label htmlFor="email" className="flex items-center gap-2 text-stone-700 font-semibold ml-1">
                <Mail className="w-4 h-4 text-emerald-500" /> Adresse email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="prenom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 rounded-2xl bg-[#FDFCF8] border-stone-200 text-stone-800 focus:ring-emerald-500 focus:border-emerald-500 text-base px-5"
              />
            </div>
            
            <div className="space-y-2.5">
              <Label htmlFor="password" className="flex items-center gap-2 text-stone-700 font-semibold ml-1">
                <Lock className="w-4 h-4 text-emerald-500" /> Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-14 rounded-2xl bg-[#FDFCF8] border-stone-200 text-stone-800 focus:ring-emerald-500 focus:border-emerald-500 text-base px-5 tracking-widest placeholder:tracking-normal"
              />
              {!isSignUp && (
                <div className="text-right">
                  <Link href="/auth/forgot-password" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                    Mot de passe oublié ?
                  </Link>
                </div>
              )}
            </div>

            <Button
              type="submit" 
              disabled={isLoading}
              className="w-full h-14 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-lg shadow-xl shadow-emerald-900/20 active:scale-95 transition-all mt-4 group"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : null}
              {isLoading 
                ? "Connexion en cours..." 
                : isSignUp ? "Créer mon compte" : "Me connecter"}
              {!isLoading && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>

          {/* SÉPARATEUR */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200/60"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-stone-400 font-bold uppercase tracking-wider rounded-full">
                Ou
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full h-12 rounded-[1.25rem] text-stone-600 font-bold hover:bg-stone-50 hover:text-stone-900 transition-colors"
          >
            {isSignUp 
              ? "J'ai déjà un compte" 
              : "Je n'ai pas encore de compte"}
          </Button>

        </div>
      </div>
    </div>
  );
}