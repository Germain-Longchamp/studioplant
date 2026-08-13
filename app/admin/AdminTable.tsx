"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle, Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { deleteUserAccount } from "./actions";
import type { EnrichedUser } from "./types";

type SortKey = "created_at" | "last_seen_at" | "plantsCount" | "roomsCount";
type SortDir = "asc" | "desc";
type FilterKey = "all" | "active" | "inactive";

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (column !== sortKey) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
  return sortDir === "asc"
    ? <ArrowUp className="w-3 h-3 ml-1 text-emerald-600" />
    : <ArrowDown className="w-3 h-3 ml-1 text-emerald-600" />;
}

export default function AdminTable({ users }: { users: EnrichedUser[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string } | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const filtered = useMemo(() => {
    return users
      .filter((u) => {
        const matchesSearch = search === "" || (u.email ?? "").toLowerCase().includes(search.toLowerCase());
        const isActive = u.last_seen_at && new Date(u.last_seen_at).getTime() > thirtyDaysAgo;
        const matchesFilter =
          filter === "all" ||
          (filter === "active" && isActive) ||
          (filter === "inactive" && !isActive);
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        let aVal: number;
        let bVal: number;
        if (sortKey === "plantsCount" || sortKey === "roomsCount") {
          aVal = a[sortKey];
          bVal = b[sortKey];
        } else {
          aVal = a[sortKey] ? new Date(a[sortKey] as string).getTime() : 0;
          bVal = b[sortKey] ? new Date(b[sortKey] as string).getTime() : 0;
        }
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      });
  }, [users, search, filter, sortKey, sortDir, thirtyDaysAgo]);

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
      setUserToDelete(null);
    });
  };

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all", label: "Tous" },
    { key: "active", label: "Actifs (30j)" },
    { key: "inactive", label: "Inactifs" },
  ];

  return (
    <>
      {/* BARRE DE RECHERCHE + FILTRES */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par email..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                filter === f.key
                  ? "bg-stone-900 text-white"
                  : "bg-white border border-stone-200 text-stone-500 hover:border-stone-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="px-6 py-4">Utilisateur</th>
                <th
                  className="px-6 py-4 cursor-pointer hover:text-stone-800 select-none"
                  onClick={() => handleSort("created_at")}
                >
                  <span className="inline-flex items-center">
                    Inscription
                    <SortIcon column="created_at" sortKey={sortKey} sortDir={sortDir} />
                  </span>
                </th>
                <th
                  className="px-6 py-4 cursor-pointer hover:text-stone-800 select-none"
                  onClick={() => handleSort("last_seen_at")}
                >
                  <span className="inline-flex items-center">
                    Dernière activité
                    <SortIcon column="last_seen_at" sortKey={sortKey} sortDir={sortDir} />
                  </span>
                </th>
                <th
                  className="px-6 py-4 text-center cursor-pointer hover:text-stone-800 select-none"
                  onClick={() => handleSort("plantsCount")}
                >
                  <span className="inline-flex items-center justify-center">
                    Plantes
                    <SortIcon column="plantsCount" sortKey={sortKey} sortDir={sortDir} />
                  </span>
                </th>
                <th
                  className="px-6 py-4 text-center cursor-pointer hover:text-stone-800 select-none"
                  onClick={() => handleSort("roomsCount")}
                >
                  <span className="inline-flex items-center justify-center">
                    Pièces
                    <SortIcon column="roomsCount" sortKey={sortKey} sortDir={sortDir} />
                  </span>
                </th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((user) => {
                const isActive = user.last_seen_at && new Date(user.last_seen_at).getTime() > thirtyDaysAgo;
                return (
                  <tr
                    key={user.id}
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                    className="hover:bg-stone-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-bold text-stone-800 group-hover:text-emerald-700 transition-colors">
                            {user.email}
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono mt-0.5">{user.id}</div>
                        </div>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Actif" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-500 font-medium">
                      {new Date(user.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-stone-500 font-medium">
                      {user.last_seen_at ? (
                        new Date(user.last_seen_at).toLocaleDateString("fr-FR", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        }).replace(":", "h")
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
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUserToDelete({ id: user.id, email: user.email ?? user.id });
                          }}
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
                        <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-400 transition-colors" />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-400 font-medium">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-stone-100 bg-stone-50/50">
          <p className="text-xs text-stone-400 font-medium">
            {filtered.length} utilisateur{filtered.length !== 1 ? "s" : ""} affiché{filtered.length !== 1 ? "s" : ""}
            {filtered.length !== users.length && ` sur ${users.length}`}
          </p>
        </div>
      </div>

      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Confirmer la suppression</h3>
            </div>
            <p className="text-stone-600 mb-6">
              Es-tu sûr de vouloir supprimer définitivement{" "}
              <strong>{userToDelete.email}</strong> et toutes ses plantes ? Cette action est irréversible.
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
                  "Oui, supprimer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
