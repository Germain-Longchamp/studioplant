"use client";

import { useState, useEffect, useTransition } from "react";
import { Bell, BellOff, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getPushAvailability,
  getIsSubscribed,
  subscribeToPush,
  unsubscribeFromPush,
  type PushAvailability,
} from "@/lib/push";

export default function PushNotificationToggle() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [availability, setAvailability] = useState<PushAvailability | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setAvailability(getPushAvailability());
    getIsSubscribed().then(setIsSubscribed);
  }, []);

  function handleSubscribe() {
    startTransition(async () => {
      const res = await subscribeToPush();
      if (res.ok) {
        setIsSubscribed(true);
        toast.success("🌿 Notifications activées ! Vous serez alerté chaque matin.");
        return;
      }
      if (res.reason === "denied") {
        setAvailability("denied");
        toast.error("Notifications refusées par le navigateur.");
      } else {
        toast.error("Impossible d'activer les notifications.");
      }
    });
  }

  function handleUnsubscribe() {
    startTransition(async () => {
      try {
        await unsubscribeFromPush();
        setIsSubscribed(false);
        toast.success("Notifications désactivées.");
      } catch {
        toast.error("Impossible de désactiver les notifications.");
      }
    });
  }

  // On attend le premier effet client avant de décider quoi afficher.
  if (availability === null) {
    return (
      <div className="flex items-center justify-center h-12 text-stone-300">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  // Indisponible : on explique la raison au lieu de faire disparaître la section
  // silencieusement (ancien `return null`).
  if (!isSubscribed && availability !== "ready") {
    const message =
      availability === "denied"
        ? "Les notifications sont bloquées dans les réglages de votre navigateur pour ce site. Réactivez-les depuis l'icône à gauche de l'adresse."
        : availability === "ios-not-installed"
        ? "Sur iPhone, ajoutez d'abord StudioPlantes à votre écran d'accueil (menu Partager → « Sur l'écran d'accueil ») pour activer les rappels."
        : "Votre navigateur ne prend pas en charge les notifications push.";

    return (
      <div className="flex items-start gap-2.5 rounded-[1.25rem] bg-stone-100 px-4 py-3 text-xs font-medium text-stone-500">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-stone-400" />
        <span className="leading-relaxed">{message}</span>
      </div>
    );
  }

  return (
    <Button
      onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
      disabled={isPending}
      variant={isSubscribed ? "outline" : "default"}
      className={`w-full h-12 font-bold rounded-[1.25rem] transition-all active:scale-95 ${
        isSubscribed
          ? "border-stone-200 text-stone-600"
          : "bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white shadow-lg shadow-emerald-900/20"
      }`}
    >
      {isPending ? (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      ) : isSubscribed ? (
        <BellOff className="w-5 h-5 mr-2" />
      ) : (
        <Bell className="w-5 h-5 mr-2" />
      )}
      {isPending
        ? "Chargement..."
        : isSubscribed
        ? "Désactiver les rappels"
        : "Activer les rappels d'arrosage"}
    </Button>
  );
}
