"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Map, Sun, Home as HomeIcon, MapPin, Mail, Lock, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { updateProfileContext, updateSecurity } from "@/server/actions";

export default function ProfileForms({ user, metadata }: { user: any; metadata: any }) {
  const [isPendingContext, startTransitionContext] = useTransition();
  const [isPendingSecurity, startTransitionSecurity] = useTransition();

  const handleContextSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransitionContext(async () => {
      const result = await updateProfileContext(formData);
      if (result?.error) toast.error("Erreur : " + result.error);
      else toast.success("Contexte mis à jour ! 🌱 L'IA s'adaptera.");
    });
  };

  const handleSecuritySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransitionSecurity(async () => {
      const result = await updateSecurity(formData);
      if (result?.error) {
        toast.error("Erreur : " + result.error);
      } else {
        toast.success("Informations mises à jour !");
        // Si changement d'email, Supabase envoie souvent un mail de confirmation
        if (formData.get("email") !== user.email) {
          toast.info("Vérifiez votre boîte mail pour confirmer la nouvelle adresse.");
        }
      }
    });
  };

  return (
    <div className="space-y-8">
      
      {/* BLOC 1 : MON CONTEXTE */}
      <section className="bg-white p-6 rounded-[2rem] shadow-xl shadow-stone-200/40 border border-stone-100/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-800 tracking-tight">Mon environnement</h2>
            <p className="text-xs text-stone-500 mt-0.5">Aide l'IA à te donner de meilleurs conseils.</p>
          </div>
        </div>

        <form onSubmit={handleContextSubmit} className="space-y-5 relative z-10">
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1">
              <HomeIcon className="w-4 h-4 text-emerald-500" /> Habitation
            </Label>
            <select name="home_type" defaultValue={metadata?.home_type || ""} className="flex h-12 w-full rounded-2xl border border-stone-200 bg-[#FDFCF8] px-4 py-2 text-sm text-stone-800 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all">
              <option value="">Sélectionner...</option>
              <option value="Appartement">Appartement</option>
              <option value="Maison">Maison</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1">
              <MapPin className="w-4 h-4 text-emerald-500" /> Ville / Région
            </Label>
            <Input name="city" defaultValue={metadata?.city || ""} placeholder="Ex: Lyon, Centre-ville" className="h-12 rounded-2xl bg-[#FDFCF8] border-stone-200 text-stone-800" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1 text-xs">Orientation</Label>
              <select name="orientation" defaultValue={metadata?.orientation || ""} className="flex h-12 w-full rounded-2xl border border-stone-200 bg-[#FDFCF8] px-4 text-sm text-stone-800 focus:ring-2 focus:ring-emerald-500/50 outline-none">
                <option value="">...</option>
                <option value="Nord">Nord</option>
                <option value="Sud">Sud</option>
                <option value="Est">Est</option>
                <option value="Ouest">Ouest</option>
                <option value="Mixte">Mixte</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1 text-xs">
                <Sun className="w-3.5 h-3.5 text-amber-500" /> Luminosité
              </Label>
              <select name="light_level" defaultValue={metadata?.light_level || ""} className="flex h-12 w-full rounded-2xl border border-stone-200 bg-[#FDFCF8] px-4 text-sm text-stone-800 focus:ring-2 focus:ring-emerald-500/50 outline-none">
                <option value="">...</option>
                <option value="Faible">Faible</option>
                <option value="Moyenne">Moyenne</option>
                <option value="Forte">Forte</option>
              </select>
            </div>
          </div>

          <Button type="submit" disabled={isPendingContext} className="w-full h-12 rounded-[1.25rem] bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-lg shadow-emerald-900/20 active:scale-95 transition-all mt-2">
            {isPendingContext ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2 text-emerald-300" /> Enregistrer le contexte</>}
          </Button>
        </form>
      </section>

      {/* BLOC 2 : SÉCURITÉ */}
      <section className="bg-white p-6 rounded-[2rem] shadow-xl shadow-stone-200/40 border border-stone-100/60 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-2.5 bg-stone-100 rounded-xl text-stone-600">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-800 tracking-tight">Mes informations</h2>
          </div>
        </div>

        <form onSubmit={handleSecuritySubmit} className="space-y-5 relative z-10">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1">
              <Mail className="w-4 h-4 text-stone-400" /> Adresse Email
            </Label>
            <Input type="email" name="email" defaultValue={user.email} className="h-12 rounded-2xl bg-[#FDFCF8] border-stone-200 text-stone-800" />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1">
              <Lock className="w-4 h-4 text-stone-400" /> Nouveau mot de passe
            </Label>
            <Input type="password" name="password" placeholder="Laisser vide pour ne pas changer" className="h-12 rounded-2xl bg-[#FDFCF8] border-stone-200 text-stone-800 placeholder:text-stone-300" />
          </div>

          <Button type="submit" disabled={isPendingSecurity} variant="outline" className="w-full h-12 rounded-[1.25rem] border-stone-200 text-stone-700 hover:bg-stone-50 font-bold active:scale-95 transition-all mt-2">
            {isPendingSecurity ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2 text-stone-400" /> Mettre à jour</>}
          </Button>
        </form>
      </section>

    </div>
  );
}
