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
  
  // En retard (diffDays est négatif) -> Affiche "+X J" et passe en urgent (rouge)
  if (diffDays < 0) return { urgent: true, text: `+${Math.abs(diffDays)} J`, state: 'late' };
  
  // Le jour J -> Affiche "Aujourd'hui" (reste en urgent/rouge pour attirer l'attention)
  if (diffDays === 0) return { urgent: true, text: "Aujourd'hui", state: 'today' };
  
  // Dans le futur -> Affiche "-X J" et reste normal (gris)
  return { urgent: false, text: `-${diffDays} J`, state: 'ok' };
}
