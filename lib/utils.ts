import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
