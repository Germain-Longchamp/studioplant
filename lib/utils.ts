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
  if (diffDays < 0) return { urgent: true, text: `+${Math.abs(diffDays)} J`, color: 'red', buttonText: `Arroser (retard ${Math.abs(diffDays)} j)` };
  
  // ROUGE : Le jour même
  if (diffDays === 0) return { urgent: true, text: "Jour J", color: 'red', buttonText: "Arroser" };
  
  // GRIS (Non urgent) : À venir
  if (diffDays === 1) return { urgent: false, text: "-1 J", color: 'orange', buttonText: "Arroser dans 1 jour" };
  
  return { urgent: false, text: `-${diffDays} J`, color: 'green', buttonText: `Arroser dans ${diffDays} jours` };
}
