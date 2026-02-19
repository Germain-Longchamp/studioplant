import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// NOUVELLE FONCTION DE CALCUL D'ARROSAGE
export function getWateringStatus(lastWateredAt: string, frequency: number, snoozeDays: number = 0) {
  const lastDate = new Date(lastWateredAt);
  const nextDate = new Date(lastDate);
  // Date du prochain arrosage = Dernier arrosage + Fréquence IA + Jours décalés
  nextDate.setDate(lastDate.getDate() + frequency + snoozeDays);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  nextDate.setHours(0, 0, 0, 0);
  
  const diffTime = nextDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { urgent: true, text: `En retard de ${Math.abs(diffDays)}j`, state: 'late' };
  if (diffDays === 0) return { urgent: true, text: "À arroser aujourd'hui", state: 'today' };
  return { urgent: false, text: `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`, state: 'ok' };
}
