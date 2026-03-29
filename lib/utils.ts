import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getActiveWateringFrequency(plant: any): number {
  const month = new Date().getMonth();

  if (month >= 2 && month <= 4 && plant.watering_freq_spring) return plant.watering_freq_spring;
  if (month >= 5 && month <= 7 && plant.watering_freq_summer) return plant.watering_freq_summer;
  if (month >= 8 && month <= 10 && plant.watering_freq_autumn) return plant.watering_freq_autumn;
  if ((month >= 11 || month <= 1) && plant.watering_freq_winter) return plant.watering_freq_winter;

  return plant.watering_frequency || 7;
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
