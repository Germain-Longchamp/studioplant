import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// NOUVELLE FONCTION DE CALCUL D'ARROSAGE (Textes courts)
export function getWateringStatus(lastWateredAt: string, frequency: number, snoozeDays: number = 0) {
  const lastDate = new Date(lastWateredAt);
  const nextDate = new Date(lastDate);
  nextDate.setDate(lastDate.getDate() + frequency + snoozeDays);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  nextDate.setHours(0, 0, 0, 0);
  
  const diffTime = nextDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Textes beaucoup plus courts pour s'adapter à l'icône calendrier
  if (diffDays < 0) return { urgent: true, text: `Retard ${Math.abs(diffDays)}j`, state: 'late' };
  if (diffDays === 0) return { urgent: true, text: "Aujourd'hui", state: 'today' };
  return { urgent: false, text: `${diffDays} jour${diffDays > 1 ? 's' : ''}`, state: 'ok' };
}
