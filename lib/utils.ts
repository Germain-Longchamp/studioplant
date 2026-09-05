import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Compresse/redimensionne une photo côté client avant upload (appareil photo mobile
// = souvent 5-15 Mo selon le téléphone). Sans ça, un fichier trop lourd dépasse la
// limite de la Server Action (bodySizeLimit) et échoue silencieusement côté client
// avec une simple "erreur de connexion", sans jamais atteindre le serveur.
// Client-only (utilise Image/canvas) — ne pas appeler côté serveur.
export async function compressImage(file: File, maxDimension = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  return new Promise((resolve) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };

    // En cas d'échec de lecture de l'image, on retombe sur le fichier original
    // plutôt que de bloquer l'utilisateur.
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

export function cleanAIText(text: string): string {
  if (!text) return text;
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")   // **bold**
    .replace(/\*(.*?)\*/g, "$1")        // *italic*
    .replace(/^#{1,6}\s+/gm, "")       // ## headers
    .replace(/^[-*•]\s+/gm, "")        // - bullet points
    .replace(/`([^`]*)`/g, "$1")        // `code`
    .replace(/\n{3,}/g, "\n\n")         // triple+ newlines → double
    .trim();
}

export type Season = "spring" | "summer" | "autumn" | "winter";

export const SEASON_LABEL_FR: Record<Season, string> = {
  spring: "printemps",
  summer: "été",
  autumn: "automne",
  winter: "hiver",
};

// US-003 : bornes ASTRONOMIQUES fixes (équinoxes/solstices), et non plus le 1er du
// mois calendaire. Dates fixes plutôt qu'un calcul astronomique exact : l'écart
// d'une année sur l'autre est d'un jour au plus, sans portée agronomique.
// C'est la vraie saison du jour — indépendante de tout consentement utilisateur.
// À ne PAS confondre avec getEffectiveSeason() : celle-ci ne pilote aucun intervalle
// promis, elle sert uniquement aux affichages qui doivent dire la vérité
// calendaire (bandeau d'accueil, contexte du Docteur Plante).
export function getAstronomicalSeason(date: Date = new Date()): Season {
  const md = date.getUTCMonth() * 100 + date.getUTCDate(); // ex: 22 sept. → 822
  if (md < 220) return "winter";   // avant le 20 mars
  if (md < 521) return "spring";   // avant le 21 juin
  if (md < 822) return "summer";   // avant le 22 septembre
  if (md < 1121) return "autumn";  // avant le 21 décembre
  return "winter";
}

// Fréquence de CETTE plante pour une saison donnée (repli sur l'intervalle promis
// actuel, puis 7, si la valeur saisonnière est nulle/absente — mêmes règles qu'avant).
export function getSeasonFrequency(plant: any, season: Season): number {
  const bySeasonField: Record<Season, number | null | undefined> = {
    spring: plant.watering_freq_spring,
    summer: plant.watering_freq_summer,
    autumn: plant.watering_freq_autumn,
    winter: plant.watering_freq_winter,
  };
  return bySeasonField[season] || plant.promised_watering_interval_days || 7;
}

// La saison EFFECTIVE du compte (US-003) : celle que les 3 sites d'écriture
// d'US-002 (création, arrosage, réglage manuel) utilisent pour calculer le
// PROCHAIN intervalle promis — par opposition à la vraie saison du calendrier.
// Un utilisateur qui a refusé un changement de saison reste sur son ancienne
// saison effective jusqu'à ce qu'il accepte explicitement (cf. server/actions.ts,
// applySeasonConsent / declineSeasonConsent). Repli sur la saison astronomique
// si le compte n'a encore aucun enregistrement (nouveau compte post-US-003, ou
// écriture jamais initialisée) : rien à protéger dans ce cas, aucune ancienne
// promesse n'existe dont il faudrait le prémunir.
export function getEffectiveSeason(user: { user_metadata?: Record<string, unknown> } | null | undefined): Season {
  const stored = (user?.user_metadata?.season_consent as { effectiveSeason?: string } | undefined)?.effectiveSeason;
  if (stored === "spring" || stored === "summer" || stored === "autumn" || stored === "winter") {
    return stored;
  }
  return getAstronomicalSeason();
}

export function formatRelativeDays(isoDate: string): string {
  const date = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "aujourd'hui";
  if (diffDays === 1) return 'hier';
  return `il y a ${diffDays}j`;
}

export function getFertilizingStatus(lastFertilizedAt: string | null) {
  if (!lastFertilizedAt) {
    return { text: 'Jamais fertilisée', color: 'neutral' };
  }

  const date = new Date(lastFertilizedAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0)  return { text: "Engrais : aujourd'hui", color: 'green' };
  if (diffDays < 14)  return { text: `Engrais : il y a ${diffDays}j`, color: 'green' };
  if (diffDays < 30)  return { text: `Engrais : il y a ${diffDays}j`, color: 'orange' };
  return               { text: `Engrais : il y a ${diffDays}j`, color: 'red' };
}

export function getWateringStatus(lastWateredAt: string, frequency: number, snoozeDays: number = 0, paused: boolean = false) {
  // Rappels en pause (ex: plantes qui tolèrent très mal l'arrosage régulier, type ZZ) :
  // on court-circuite tout le calcul d'urgence, la plante ne doit jamais redevenir
  // "à arroser" ni compter dans les badges/notifications tant qu'elle est en pause.
  if (paused) {
    return { urgent: false, text: "En pause", color: 'neutral' as const };
  }

  const lastDate = new Date(lastWateredAt);
  const nextDate = new Date(lastDate);
  nextDate.setDate(lastDate.getDate() + frequency + snoozeDays);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  nextDate.setHours(0, 0, 0, 0);
  
  const diffTime = nextDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // ROUGE : En retard
  if (diffDays < 0) return { urgent: true, text: `Retard ${Math.abs(diffDays)}j`, color: 'red' };
  
  // ROUGE : Le jour même
  if (diffDays === 0) return { urgent: true, text: "Aujourd'hui", color: 'red' };
  
  // ORANGE : J-1
  if (diffDays === 1) return { urgent: false, text: "Demain", color: 'orange' };
  
  // VERT : Tout va bien
  return { urgent: false, text: `Dans ${diffDays}j`, color: 'green' };
}
