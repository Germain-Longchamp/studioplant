"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { updateSecurity } from "@/server/actions";

export default function ProfileForms({ user }: { user: any }) {
  const [isPendingSecurity, startTransitionSecurity] = useTransition();

  const handleSecuritySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransitionSecurity(async () => {
      const result = await updateSecurity(formData);
      if (result?.error) {
        toast.error("Erreur : " + result.error);
      } else {
        toast.success("Informations mises à jour !");
        if (formData.get("email") !== user.email) {
          toast.info("Vérifiez votre boîte mail pour confirmer la nouvelle adresse.");
        }
      }
    });
  };

  return (
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
  );
}
