"use client";

import { useState, useEffect, useTransition } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) view[i] = rawData.charCodeAt(i);
  return view;
}

export default function PushNotificationToggle() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      navigator.serviceWorker.ready.then((registration) =>
        registration.pushManager.getSubscription().then((sub) =>
          setIsSubscribed(!!sub)
        )
      );
    }
  }, []);

  async function handleSubscribe() {
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.error("Notifications refusées par le navigateur.");
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        });

        if (!res.ok) throw new Error("Erreur serveur");

        setIsSubscribed(true);
        toast.success("🌿 Notifications activées ! Vous serez alerté chaque matin.");
      } catch (error) {
        console.error("Subscribe error:", error);
        toast.error("Impossible d'activer les notifications.");
      }
    });
  }

  async function handleUnsubscribe() {
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!subscription) return;

        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });

        setIsSubscribed(false);
        toast.success("Notifications désactivées.");
      } catch (error) {
        console.error("Unsubscribe error:", error);
        toast.error("Impossible de désactiver les notifications.");
      }
    });
  }

  if (!isSupported) return null;

  return (
    <Button
      onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
      disabled={isPending}
      variant={isSubscribed ? "outline" : "default"}
      className={`w-full h-12 font-bold rounded-[1.25rem] transition-all active:scale-95 ${
        isSubscribed
          ? "border-stone-200 text-stone-600"
          : "bg-emerald-600 hover:bg-emerald-700 text-white"
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
