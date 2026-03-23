"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { deleteUserAccount } from "./actions";

export default function AdminTable({ users }: { users: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (userId: string, email: string) => {
    if (!confirm(`⚠️ ATTENTION ⚠️\n\nEs-tu sûr de vouloir supprimer définitivement ${email} et toutes ses plantes ?`)) {
      return;
    }

    setDeletingId(userId);
    startTransition(async () => {
      const result = await deleteUserAccount(userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`L'utilisateur ${email} a été supprimé.`);
      }
      setDeletingId(null);
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[11px] font-bold">
            <tr>
              <th className="px-6 py-4">Utilisateur</th>
              <th className="px-6 py-4">Date d'inscription</th>
              <th className="px-6 py-4 text-center">Plantes</th>
              <th className="px-6 py-4 text-center">Pièces</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-stone-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-stone-800">{user.email}</div>
                  <div className="text-[10px] text-stone-400 font-mono mt-0.5">{user.id}</div>
                </td>
                <td className="px-6 py-4 text-stone-500 font-medium">
                  {new Date(user.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-100/50">
                    {user.plantsCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-md bg-amber-50 text-amber-700 font-bold border border-amber-100/50">
                    {user.roomsCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(user.id, user.email)}
                    disabled={isPending && deletingId === user.id}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                    title="Supprimer l'utilisateur"
                  >
                    {isPending && deletingId === user.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-stone-500 font-medium">
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}