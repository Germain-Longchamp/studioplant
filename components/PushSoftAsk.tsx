"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2, Droplets, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getPushAvailability,
  getIsSubscribed,
  subscribeToPush,
  type PushAvailability,
} from "@/lib/push";
import { dismissPushSoftAsk } from "@/server/actions";

// Clé de "report" (fermeture sans choisir) : volontairement en sessionStorage —
// la proposition doit pouvoir réapparaître à la session suivante (arbitrage produit).
// Le refus explicite, lui, est durable (user_metadata, cf. dismissPushSoftAsk).
const SNOOZE_KEY = "push_softask_snoozed";

type Phase = "checking" | "ask" | "activating" | "hidden";

export default function PushSoftAsk({
  isOnlyPlant,
  declined,
}: {
  /** L'utilisateur possède exactement une plante suivie (sa première). */
  isOnlyPlant: boolean;
  /** Refus explicite déjà enregistré dans user_metadata. */
  declined: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [availability, setAvailability] = useState<PushAvailability>("unsupported");

  useEffect(() => {
    let cancelled = false;

    if (!isOnlyPlant || declined) {
      setPhase("hidden");
      return;
    }
    if (typeof window !== "undefined" && sessionStorage.getItem(SNOOZE_KEY)) {
      setPhase("hidden");
      return;
    }

    const avail = getPushAvailability();
    if (avail === "unsupported") {
      setPhase("hidden");
      return;
    }

    getIsSubscribed().then((subscribed) => {
      if (cancelled) return;
      if (subscribed) {
        setPhase("hidden");
        return;
      }
      setAvailability(avail);
      setPhase("ask");
    });

    return () => {
      cancelled = true;
    };
  }, [isOnlyPlant, declined]);

  function snoozeAndClose() {
    try {
      sessionStorage.setItem(SNOOZE_KEY, "1");
    } catch {
      /* sessionStorage indisponible : tant pis, la modale se ferme quand même */
    }
    setPhase("hidden");
  }

  async function declineForGood() {
    setPhase("hidden");
    const res = await dismissPushSoftAsk();
    if (res?.error) {
      // Échec silencieux acceptable : au pire la proposition réapparaît une fois.
      console.error("dismissPushSoftAsk:", res.error);
    }
  }

  async function handleActivate() {
    setPhase("activating");
    const res = await subscribeToPush();
    if (res.ok) {
      toast.success("🌿 Rappels activés ! Vous serez alerté chaque matin.");
      setPhase("hidden");
      return;
    }
    if (res.reason === "denied") {
      setAvailability("denied");
      setPhase("ask");
      return;
    }
    // subscribe-failed ou server-error : état potentiellement incohérent
    // (permission accordée mais pas d'abonnement en base).
    toast.error(
      "L'activation a échoué. Vous pourrez réessayer depuis votre profil."
    );
    setPhase("hidden");
  }

  if (phase === "checking" || phase === "hidden") return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={snoozeAndClose}
    >
      <div
        className="relative w-full max-w-sm bg-[#FDFCF8] rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête coloré du domaine (arrosage) */}
        <div className="bg-emerald-900 bg-gradient-to-br from-emerald-800 to-emerald-950 p-6 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/30 rounded-full blur-3xl" />
          <button
            onClick={snoozeAndClose}
            aria-label="Plus tard"
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="relative z-10 flex flex-col items-center pt-2">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[1.25rem] flex items-center justify-center border border-white/20 shadow-xl mb-4">
              <Bell className="w-8 h-8 text-emerald-300" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
              Ne l'oubliez plus
            </h2>
          </div>
        </div>

        {/* Corps */}
        <div className="p-6 space-y-6">
          {availability === "ready" && (
            <>
              <p className="text-sm font-medium text-stone-600 leading-relaxed text-center">
                Recevez un rappel chaque matin quand votre plante a besoin d'eau —
                adapté à son emplacement et à la saison.
              </p>
              <Button
                onClick={handleActivate}
                disabled={phase === "activating"}
                className="w-full h-14 rounded-2xl text-lg font-bold bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
              >
                {phase === "activating" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Droplets className="w-5 h-5 mr-2 text-emerald-300" />
                    Activer les rappels d'arrosage
                  </>
                )}
              </Button>
            </>
          )}

          {availability === "denied" && (
            <p className="text-sm font-medium text-stone-600 leading-relaxed text-center">
              Les notifications sont bloquées pour StudioPlantes dans votre
              navigateur. Pour les réactiver, ouvrez les réglages du site
              (icône à gauche de l'adresse) et autorisez les notifications.
            </p>
          )}

          {availability === "ios-not-installed" && (
            <div className="text-sm font-medium text-stone-600 leading-relaxed text-center space-y-3">
              <p>
                Sur iPhone, les rappels nécessitent d'ajouter StudioPlantes à
                votre écran d'accueil.
              </p>
              <p className="flex items-center justify-center gap-1.5 text-stone-500">
                Appuyez sur <Share className="w-4 h-4 inline" /> puis
                « Sur l'écran d'accueil ».
              </p>
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={snoozeAndClose}
              className="text-xs font-bold text-stone-400 hover:text-stone-600 transition-colors uppercase tracking-wider"
            >
              Plus tard
            </button>
            <button
              onClick={declineForGood}
              className="text-[11px] font-medium text-stone-300 hover:text-stone-500 transition-colors"
            >
              Ne plus me proposer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
