"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Sprout, Camera, Home, User } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#FDFCF8]/95 backdrop-blur-xl border-t border-stone-200/60 pb-4 pt-2 px-1 flex justify-evenly items-end shadow-[0_-20px_40px_rgba(0,0,0,0.03)] md:hidden">
      
      {/* 1 - Accueil */}
      <Link href="/dashboard" className={`flex flex-col items-center p-1.5 transition-colors flex-1 ${pathname === '/dashboard' ? 'text-[var(--color-brand)]' : 'text-stone-400 hover:text-stone-600'}`}>
        <LayoutGrid className="w-5 h-5 mb-1" />
        <span className="text-[9px] font-bold uppercase tracking-wider">Accueil</span>
      </Link>

      {/* 2 - Plantes */}
      <Link href="/dashboard/plants" className={`flex flex-col items-center p-1.5 transition-colors flex-1 ${pathname === '/dashboard/plants' ? 'text-[var(--color-brand)]' : 'text-stone-400 hover:text-stone-600'}`}>
        <Sprout className="w-5 h-5 mb-1" />
        <span className="text-[9px] font-bold uppercase tracking-wider">Plantes</span>
      </Link>

      {/* 3 - Ajouter */}
      <div className="flex-1 flex justify-center">
        <Link href="/dashboard/add" className="relative -top-4 flex flex-col items-center transition-transform active:scale-95">
          <div className="bg-[var(--color-brand)] text-white p-3 rounded-full shadow-lg shadow-emerald-900/30">
            <Camera className="w-6 h-6" />
          </div>
        </Link>
      </div>

      {/* 4 - Ma Maison */}
      <Link href="/dashboard/my-home" className={`flex flex-col items-center p-1.5 transition-colors flex-1 ${pathname === '/dashboard/my-home' ? 'text-[var(--color-brand)]' : 'text-stone-400 hover:text-stone-600'}`}>
        <Home className="w-5 h-5 mb-1" />
        <span className="text-[9px] font-bold uppercase tracking-wider">Ma Maison</span>
      </Link>

      {/* 5 - Profil */}
      <Link href="/dashboard/profile" className={`flex flex-col items-center p-1.5 transition-colors flex-1 ${pathname === '/dashboard/profile' ? 'text-[var(--color-brand)]' : 'text-stone-400 hover:text-stone-600'}`}>
        <User className="w-5 h-5 mb-1" />
        <span className="text-[9px] font-bold uppercase tracking-wider">Profil</span>
      </Link>
      
    </div>
  );
}