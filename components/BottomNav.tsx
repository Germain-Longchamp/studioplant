"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Sprout, Camera, Home, User } from "lucide-react";

export default function BottomNav({ urgentCount = 0 }: { urgentCount?: number }) {
  const pathname = usePathname();
  const badgeLabel = urgentCount > 9 ? "9+" : String(urgentCount);

  return (
    // Barre flottante, détachée du bord (bottom-5 left-4 right-4) plutôt que collée
    // en pleine largeur — effet glassmorphism : fond translucide + flou + liseré clair.
    <div className="fixed bottom-5 left-4 right-4 z-50 md:hidden">
      <div className="flex justify-evenly items-end bg-white/75 backdrop-blur-xl border border-white/60 rounded-[2rem] pt-2 pb-2.5 px-1 shadow-xl shadow-stone-200/40">

        {/* 1 - Accueil */}
        <Link href="/dashboard" className={`flex flex-col items-center p-1.5 transition-colors flex-1 ${pathname === '/dashboard' ? 'text-[var(--color-brand)]' : 'text-stone-400 hover:text-stone-600'}`}>
          <LayoutGrid className="w-5 h-5 mb-1" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Accueil</span>
        </Link>

        {/* 2 - Profil */}
        <Link href="/dashboard/profile" className={`flex flex-col items-center p-1.5 transition-colors flex-1 ${pathname === '/dashboard/profile' ? 'text-[var(--color-brand)]' : 'text-stone-400 hover:text-stone-600'}`}>
          <User className="w-5 h-5 mb-1" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Profil</span>
        </Link>

        {/* 3 - Ajouter (FAB) — reste la seule action flottante, remontée au-dessus de la barre */}
        <div className="flex-1 flex justify-center">
          <Link href="/dashboard/add" className="relative -top-5 flex flex-col items-center transition-transform active:scale-95">
            <div className="bg-[var(--color-brand)] text-white p-3 rounded-full shadow-lg shadow-emerald-900/30 ring-4 ring-white/70">
              <Camera className="w-6 h-6" />
            </div>
          </Link>
        </div>

        {/* 4 - Ma Maison */}
        <Link href="/dashboard/my-home" className={`flex flex-col items-center p-1.5 transition-colors flex-1 ${pathname === '/dashboard/my-home' ? 'text-[var(--color-brand)]' : 'text-stone-400 hover:text-stone-600'}`}>
          <Home className="w-5 h-5 mb-1" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Ma Maison</span>
        </Link>

        {/* 5 - Plantes (avec badge d'arrosages en attente) */}
        <Link href="/dashboard/plants" className={`flex flex-col items-center p-1.5 transition-colors flex-1 ${pathname === '/dashboard/plants' ? 'text-[var(--color-brand)]' : 'text-stone-400 hover:text-stone-600'}`}>
          <div className="relative">
            <Sprout className="w-5 h-5 mb-1" />
            {urgentCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[15px] h-[15px] px-1 rounded-full bg-rose-500 text-white text-[8px] font-extrabold leading-none shadow-sm">
                {badgeLabel}
              </span>
            )}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider">Plantes</span>
        </Link>

      </div>
    </div>
  );
}
