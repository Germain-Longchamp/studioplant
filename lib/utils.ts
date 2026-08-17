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

export function getActiveWateringFrequency(plant: any): number {
  const month = new Date().getMonth();

  if (month >= 2 && month <= 4 && plant.watering_freq_spring) return plant.watering_freq_spring;
  if (month >= 5 && month <= 7 && plant.watering_freq_summer) return plant.watering_freq_summer;
  if (month >= 8 && month <= 10 && plant.watering_freq_autumn) return plant.watering_freq_autumn;
  if ((month >= 11 || month <= 1) && plant.watering_freq_winter) return plant.watering_freq_winter;

  return plant.watering_frequency || 7;
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

export function getWateringStatus(lastWateredAt: string, frequency: number, snoozeDays: number = 0) {
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
