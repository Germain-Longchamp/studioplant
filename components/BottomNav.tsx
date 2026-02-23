"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Plus, User, LogOut } from "lucide-react";
import { logOut } from "@/server/actions"; // Import de la fonction

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#FDFCF8]/95 backdrop-blur-xl border-t border-stone-200/60 pb-4 pt-2 px-1 flex justify-evenly items-end shadow-[0_-20px_40px_rgba(0,0,0,0.03)] md:hidden">
      
      {/* 1 - Accueil */}
      <Link href="/dashboard" className={`flex flex-col items-center p-1.5 transition-colors flex-1 ${pathname === '/dashboard' ? 'text-emerald-800' : 'text-stone-400 hover:text-stone-600'}`}>
        <Home className="w-5 h-5 mb-1" />
        <span className="text-[9px] font-bold uppercase tracking-wider">Accueil</span>
      </Link>

      {/* 2 - Plantes */}
      <Link href="/dashboard/plants" className={`flex flex-col items-center p-1.5 transition-colors flex-1 ${pathname === '/dashboard/plants' ? 'text-emerald-800' : 'text-stone-400 hover:text-stone-600'}`}>
        <LayoutGrid className="w-5 h-5 mb-1" />
        <span className="text-[9px] font-bold uppercase tracking-wider">Plantes</span>
      </Link>
      
      {/* 3 - Ajouter (Central surélevé) */}
      <div className="flex-1 flex justify-center">
        <Link href="/dashboard/add" className="relative -top-4 flex flex-col items-center transition-transform active:scale-95">
          <div className="bg-emerald-800 text-white p-3 rounded-full shadow-lg shadow-emerald-900/30 border-[3px] border-[#FDFCF8]">
            <Plus className="w-6 h-6" />
          </div>
        </Link>
      </div>

      {/* 4 - Profil */}
      <Link href="/dashboard/profile" className={`flex flex-col items-center p-1.5 transition-colors flex-1 ${pathname === '/dashboard/profile' ? 'text-emerald-800' : 'text-stone-400 hover:text-stone-600'}`}>
        <User className="w-5 h-5 mb-1" />
        <span className="text-[9px] font-bold uppercase tracking-wider">Profil</span>
      </Link>

      {/* 5 - Déconnexion (Géré via un form direct) */}
      <form action={logOut} className="flex-1">
        <button type="submit" className="w-full flex flex-col items-center p-1.5 transition-colors text-stone-400 hover:text-rose-500">
          <LogOut className="w-5 h-5 mb-1" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Quitter</span>
        </button>
      </form>
      
    </div>
  );
}
