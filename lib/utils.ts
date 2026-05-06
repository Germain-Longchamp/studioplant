import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
