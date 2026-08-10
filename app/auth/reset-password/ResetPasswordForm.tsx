"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Leaf, Lock, Loader2, ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { updatePasswordAfterRecovery } from "@/server/actions";

export default function ResetPasswordForm({ hasSession }: { hasSession: boolean }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Les deux mots de passe ne correspondent pas.");
      return;
    }

    const formData = new FormData();
    formData.set("password", password);

    startTransition(async () => {
      const result = await updatePasswordAfterRecovery(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Mot de passe mis à jour !");
        router.push("/dashboard");
        router.refresh();
      }
    });
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
            Nouveau mot de passe
          </h1>
          <p className="text-stone-500 font-medium">
            Choisissez un mot de passe pour votre compte.
          </p>
        </div>

        {/* FORMULAIRE */}
        <div className="bg-white/80 backdrop-blur-xl border border-stone-200/50 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl shadow-stone-200/40 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {!hasSession ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-rose-50 rounded-full mb-4">
                <ShieldAlert className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-stone-800 mb-2">Lien invalide ou expiré</h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-6">
                Ce lien de réinitialisation n'est plus valide. Demandez-en un nouveau.
              </p>
              <Button asChild className="w-full h-12 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold">
                <Link href="/auth/forgot-password">Redemander un lien</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2.5">
                <Label htmlFor="password" className="flex items-center gap-2 text-stone-700 font-semibold ml-1">
                  <Lock className="w-4 h-4 text-emerald-500" /> Nouveau mot de passe
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
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-stone-700 font-semibold ml-1">
                  <Lock className="w-4 h-4 text-emerald-500" /> Confirmer le mot de passe
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-14 rounded-2xl bg-[#FDFCF8] border-stone-200 text-stone-800 focus:ring-emerald-500 focus:border-emerald-500 text-base px-5 tracking-widest placeholder:tracking-normal"
                />
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-14 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-lg shadow-xl shadow-emerald-900/20 active:scale-95 transition-all mt-4"
              >
                {isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                {isPending ? "Mise à jour..." : "Mettre à jour le mot de passe"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
