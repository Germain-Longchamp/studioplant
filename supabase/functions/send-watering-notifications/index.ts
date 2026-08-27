import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT");

// Timeout appliqué à chaque envoi individuel : un endpoint qui traîne (FCM, APNs...)
// ne doit jamais faire échouer tout le batch ni risquer de dépasser le timeout de la fonction.
const SEND_TIMEOUT_MS = 8000;

async function sendWithTimeout(subscription: any, payload: string) {
  return await Promise.race([
    webpush.sendNotification(subscription, payload),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("send-timeout")), SEND_TIMEOUT_MS)
    ),
  ]);
}

Deno.serve(async (req) => {
  // Validation défensive des secrets VAPID — avant, un secret manquant faisait planter
  // setVapidDetails() au chargement du module (hors try/catch), donc en cold start,
  // ce qui produisait un échec silencieux sans log exploitable (boot error / 500 muet).
  // On vérifie maintenant explicitement et on répond proprement avec un message clair.
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    console.error("Missing VAPID secret(s)", {
      hasPublic: !!VAPID_PUBLIC_KEY,
      hasPrivate: !!VAPID_PRIVATE_KEY,
      hasSubject: !!VAPID_SUBJECT,
    });
    return new Response(
      JSON.stringify({
        error: "VAPID secret(s) missing — check `supabase secrets list` for this project.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  } catch (error) {
    console.error("Invalid VAPID configuration:", error);
    return new Response(
      JSON.stringify({ error: "Invalid VAPID configuration." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Récupérer toutes les plantes
  const { data: plants, error: plantsError } = await supabase
    .from("plants")
    .select("id, name, user_id, last_watered_at, watering_frequency, watering_freq_spring, watering_freq_summer, watering_freq_autumn, watering_freq_winter, snooze_days, reminders_paused, is_deceased")
    .eq("is_deceased", false);

  if (plantsError) {
    console.error("Error fetching plants:", plantsError);
    return new Response("Error fetching plants", { status: 500 });
  }

  // 2. Calcul des urgences avec fréquences saisonnières
  const month = new Date().getMonth();
  const urgentByUser: Record<string, string[]> = {};

  for (const plant of plants || []) {
    // Rappels en pause : on ignore complètement cette plante, elle ne doit jamais
    // déclencher de notification tant que l'utilisateur ne l'a pas réactivée.
    if (plant.reminders_paused) continue;

    const snoozeDays = plant.snooze_days || 0;

    // Même logique que getActiveWateringFrequency côté client
    let freq = plant.watering_frequency || 7;
    if (month >= 2 && month <= 4 && plant.watering_freq_spring) freq = plant.watering_freq_spring;
    else if (month >= 5 && month <= 7 && plant.watering_freq_summer) freq = plant.watering_freq_summer;
    else if (month >= 8 && month <= 10 && plant.watering_freq_autumn) freq = plant.watering_freq_autumn;
    else if ((month >= 11 || month <= 1) && plant.watering_freq_winter) freq = plant.watering_freq_winter;

    const lastDate = new Date(plant.last_watered_at);
    const nextWatering = new Date(lastDate);
    nextWatering.setDate(lastDate.getDate() + freq + snoozeDays);
    nextWatering.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil(
      (nextWatering.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 0) {
      if (!urgentByUser[plant.user_id]) urgentByUser[plant.user_id] = [];
      urgentByUser[plant.user_id].push(plant.name);
    }
  }

  const userIds = Object.keys(urgentByUser);
  if (userIds.length === 0) {
    console.log("No urgent plants today.");
    return new Response("No notifications to send", { status: 200 });
  }

  // 3. Récupérer les subscriptions des utilisateurs concernés
  const { data: subscriptions, error: subError } = await supabase
    .from("push_subscriptions")
    .select("*")
    .in("user_id", userIds);

  if (subError) {
    console.error("Error fetching subscriptions:", subError);
    return new Response("Error fetching subscriptions", { status: 500 });
  }

  // 4. Envoyer les notifications
  let sent = 0;
  let failed = 0;
  const expiredEndpoints: string[] = [];

  for (const sub of subscriptions || []) {
    const plantNames = urgentByUser[sub.user_id];
    if (!plantNames) continue;

    const count = plantNames.length;
    const plantList =
      count <= 3
        ? plantNames.join(", ")
        : `${plantNames.slice(0, 2).join(", ")} et ${count - 2} autre${count - 2 > 1 ? "s" : ""}`;

    const payload = JSON.stringify({
      title: `🌿 ${count} plante${count > 1 ? "s" : ""} à arroser`,
      body: `${plantList} ${count > 1 ? "attendent" : "attend"} leur arrosage aujourd'hui.`,
      url: "/dashboard/plants?filter=to-water",
    });

    try {
      await sendWithTimeout(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      sent++;
    } catch (error: any) {
      console.error(`Failed for user ${sub.user_id}:`, error?.statusCode ?? error?.message ?? error);
      failed++;
      if (error?.statusCode === 410) expiredEndpoints.push(sub.endpoint);
    }
  }

  // 5. Nettoyer les subscriptions expirées
  if (expiredEndpoints.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);
    console.log(`Cleaned ${expiredEndpoints.length} expired subscriptions.`);
  }

  console.log(`Done. Sent: ${sent}, Failed: ${failed}`);
  return new Response(
    JSON.stringify({ sent, failed, usersNotified: userIds.length }),
    { headers: { "Content-Type": "application/json" } }
  );
});
