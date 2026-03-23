"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { deleteUserAccount } from "./actions";

export default function AdminTable({ users }: { users: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // 🟢 1. NOUVEL ÉTAT : Stocke l'utilisateur qu'on s'apprête à supprimer
  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string } | null>(null);

  // 🟢 2. NOUVELLE FONCTION : Déclenchée au clic sur "Oui, supprimer" dans la popup
  const confirmDelete = () => {
    if (!userToDelete) return;

    setDeletingId(userToDelete.id);
    startTransition(async () => {
      const result = await deleteUserAccount(userToDelete.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`L'utilisateur ${userToDelete.email} a été supprimé.`);
      }
      setDeletingId(null);
      setUserToDelete(null); // On ferme la popup après l'action
    });
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            {/* ... (Le thead reste exactement identique) ... */}
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="px-6 py-4">Utilisateur</th>
                <th className="px-6 py-4">Date d'inscription</th>
                <th className="px-6 py-4">Dernière connexion</th>
                <th className="px-6 py-4 text-center">Plantes</th>
                <th className="px-6 py-4 text-center">Pièces</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-stone-50/50 transition-colors">
                  {/* ... (Tes autres td restent identiques) ... */}
                  <td className="px-6 py-4">
                    <div className="font-bold text-stone-800">{user.email}</div>
                    <div className="text-[10px] text-stone-400 font-mono mt-0.5">{user.id}</div>
                  </td>
                  <td className="px-6 py-4 text-stone-500 font-medium">
                    {new Date(user.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 text-stone-500 font-medium">
                    {user.last_sign_in_at ? (
                      new Date(user.last_sign_in_at).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      }).replace(':', 'h')
                    ) : (
                      <span className="text-stone-300 italic">Jamais</span>
                    )}
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
                      // 🟢 3. AU CLIC : On ouvre la popup en stockant l'utilisateur
                      onClick={() => setUserToDelete({ id: user.id, email: user.email })}
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
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-500 font-medium">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🟢 4. LA POPUP EN TAILWIND (Affichée uniquement si userToDelete n'est pas null) */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Confirmer la suppression</h3>
            </div>
            
            <p className="text-stone-600 mb-6">
              Es-tu sûr de vouloir supprimer définitivement <strong>{userToDelete.email}</strong> et toutes ses plantes ? Cette action est irréversible.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={isPending}
                className="px-4 py-2 rounded-lg font-medium text-stone-600 hover:bg-stone-100 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  'Oui, supprimer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
