"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Plus } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    // On réduit le padding bottom (pb-4 au lieu de pb-6) et on ajuste la hauteur
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#FDFCF8]/90 backdrop-blur-xl border-t border-stone-200/60 pb-4 pt-1.5 px-8 flex justify-between items-center shadow-[0_-20px_40px_rgba(0,0,0,0.03)] md:hidden">
      
      {/* Bouton Accueil */}
      <Link href="/dashboard" className={`flex flex-col items-center p-1.5 transition-colors ${pathname === '/dashboard' ? 'text-emerald-800' : 'text-stone-400 hover:text-stone-600'}`}>
        <Home className="w-5 h-5 mb-0.5" /> {/* Icônes passées de w-6 à w-5 */}
        <span className="text-[9px] font-bold uppercase tracking-wider">Accueil</span>
      </Link>
      
      {/* Bouton Central Ajouter (Moins surélevé et un poil plus petit) */}
      <Link href="/dashboard/add" className="relative -top-4 flex flex-col items-center transition-transform active:scale-95">
        <div className="bg-emerald-800 text-white p-3 rounded-full shadow-lg shadow-emerald-900/30 border-[3px] border-[#FDFCF8]">
          <Plus className="w-6 h-6" />
        </div>
      </Link>

      {/* Bouton Index Plantes */}
      <Link href="/dashboard/plants" className={`flex flex-col items-center p-1.5 transition-colors ${pathname === '/dashboard/plants' ? 'text-emerald-800' : 'text-stone-400 hover:text-stone-600'}`}>
        <LayoutGrid className="w-5 h-5 mb-0.5" />
        <span className="text-[9px] font-bold uppercase tracking-wider">Plantes</span>
      </Link>
      
    </div>
  );
}
