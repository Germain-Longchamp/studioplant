"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Plus } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#FDFCF8]/90 backdrop-blur-xl border-t border-stone-200/60 pb-6 pt-2 px-8 flex justify-between items-center shadow-[0_-20px_40px_rgba(0,0,0,0.03)] md:hidden">
      
      {/* Bouton Accueil (Tableau de bord) */}
      <Link href="/dashboard" className={`flex flex-col items-center p-2 transition-colors ${pathname === '/dashboard' ? 'text-emerald-800' : 'text-stone-400 hover:text-stone-600'}`}>
        <Home className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Accueil</span>
      </Link>
      
      {/* Bouton Central Ajouter (Surélevé) */}
      <Link href="/dashboard/add" className="relative -top-6 flex flex-col items-center transition-transform active:scale-95">
        <div className="bg-emerald-800 text-white p-3.5 rounded-full shadow-xl shadow-emerald-900/30 border-4 border-[#FDFCF8]">
          <Plus className="w-7 h-7" />
        </div>
      </Link>

      {/* Bouton Index Plantes */}
      <Link href="/dashboard/plants" className={`flex flex-col items-center p-2 transition-colors ${pathname === '/dashboard/plants' ? 'text-emerald-800' : 'text-stone-400 hover:text-stone-600'}`}>
        <LayoutGrid className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Plantes</span>
      </Link>
      
    </div>
  );
}
