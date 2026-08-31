// Helpers navigateur pour les notifications push web.
// Importé UNIQUEMENT par des composants client (PushNotificationToggle, PushSoftAsk) :
// ces fonctions touchent window / navigator / Notification et n'ont aucun sens côté serveur.

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

export type PushAvailability =
  | "ready" //             push utilisable — on peut demander la permission
  | "denied" //            permission déjà refusée au niveau du navigateur
  | "ios-not-installed" // iOS Safari sans PWA ajoutée à l'écran d'accueil
  | "unsupported"; //      navigateur sans Service Worker / PushManager

// Aucune API fiable pour « c'est un iPhone » : on combine userAgent et le cas
// iPadOS 13+ qui se fait passer pour un Mac de bureau.
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

// La PWA tourne-t-elle en mode « installée » (écran d'accueil / standalone) ?
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// Détermine ce qu'on peut proposer à l'utilisateur, sans jamais déclencher de prompt.
export function getPushAvailability(): PushAvailability {
  if (typeof window === "undefined") return "unsupported";

  // On teste aussi `Notification` : certains WebView / contextes non sécurisés
  // exposent serviceWorker + PushManager mais pas Notification. Le déréférencer
  // sans garde lèverait une ReferenceError dans un composant client → écran blanc.
  const hasApi =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;
  if (hasApi) {
    return Notification.permission === "denied" ? "denied" : "ready";
  }
  // Pas d'API push : sur iOS non installé, c'est récupérable via « Ajouter à l'écran d'accueil ».
  if (isIOS() && !isStandalone()) return "ios-not-installed";
  return "unsupported";
}

export async function getIsSubscribed(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) view[i] = rawData.charCodeAt(i);
  return view;
}

export type SubscribeResult =
  | { ok: true }
  | { ok: false; reason: "denied" | "subscribe-failed" | "server-error" };

// Demande la permission (si nécessaire) puis enregistre l'abonnement en base.
// Ne rappelle PAS requestPermission() si la permission est déjà « denied » : cela
// renverrait « denied » instantanément sans rien afficher, façon bug.
export async function subscribeToPush(): Promise<SubscribeResult> {
  if (Notification.permission === "denied") return { ok: false, reason: "denied" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "denied" };

  let subscription: PushSubscription;
  try {
    const reg = await navigator.serviceWorker.ready;
    subscription =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));
  } catch {
    return { ok: false, reason: "subscribe-failed" };
  }

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });
  if (!res.ok) return { ok: false, reason: "server-error" };
  return { ok: true };
}

export async function unsubscribeFromPush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
}
