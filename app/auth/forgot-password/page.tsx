"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Mail, Loader2, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // On ignore volontairement le résultat : Supabase ne révèle jamais si l'email
    // existe ou non, et on ne veut pas nous-mêmes exposer cette information.
    // Le lien envoyé par email est entièrement construit par le template "Reset Password"
    // côté Supabase (voir /auth/confirm) — pas besoin de redirectTo ici.
    await supabase.auth.resetPasswordForEmail(email);

    setSent(true);
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
        href="/auth/login"
        className="absolute top-6 left-6 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-white border border-stone-200/60 shadow-sm text-stone-500 hover:text-stone-800 hover:bg-stone-50 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>

      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-12">

        {/* EN-TÊTE */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100/60 mb-6 rotate-3">
            <Leaf className="w-8 h-8 text-emerald-500 -rotate-3" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight mb-2">
            Mot de passe oublié
          </h1>
          <p className="text-stone-500 font-medium">
            Indiquez votre email, on vous envoie un lien pour le réinitialiser.
          </p>
        </div>

        {/* FORMULAIRE */}
        <div className="bg-white/80 backdrop-blur-xl border border-stone-200/50 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl shadow-stone-200/40 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {sent ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 rounded-full mb-4">
                <Send className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-stone-800 mb-2">Email envoyé</h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                Si un compte existe avec l'adresse <strong>{email}</strong>, vous allez recevoir un lien pour choisir un nouveau mot de passe. Pensez à vérifier vos spams.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-lg shadow-xl shadow-emerald-900/20 active:scale-95 transition-all mt-4"
              >
                {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                {isLoading ? "Envoi en cours..." : "Envoyer le lien"}
              </Button>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/auth/login" className="text-sm font-semibold text-stone-500 hover:text-stone-800">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
