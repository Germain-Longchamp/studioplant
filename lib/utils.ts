import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// NOUVELLE FONCTION DE CALCUL D'ARROSAGE (Avec gestion des couleurs Vert/Orange/Rouge)
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
  if (diffDays < 0) return { urgent: true, text: `+${Math.abs(diffDays)} J`, color: 'red' };
  
  // ROUGE : Le jour même (Raccourci pour éviter l'overflow)
  if (diffDays === 0) return { urgent: true, text: "Jour J", color: 'red' };
  
  // ORANGE : J-1 (C'est pour demain !)
  if (diffDays === 1) return { urgent: false, text: "-1 J", color: 'orange' };
  
  // VERT : Tout va bien, on a le temps (J-2 et plus)
  return { urgent: false, text: `-${diffDays} J`, color: 'green' };
}
