# Brief — BottomNav consolidation (merge "Plantes" + "Arrosages", add "Profil")

## Context

`BottomNav.tsx` currently has 5 entries: Accueil, Plantes, Ajouter (FAB), Ma Maison, Arrosages.
"Plantes" (`/dashboard/plants`) and "Arrosages" (`/dashboard/plants?filter=to-water`) route to the **same page/component** (`PlantsClient`), just with a different initial filter — the page already has a filter pill bar to switch between them. This is redundant UX.

## Goal

Replace the 5 nav entries with: **Accueil · Profil · [Ajouter] · Ma Maison · Plantes**, where "Plantes" carries a red badge showing the count of plants needing watering. This keeps the nav balanced 2-2 around the central FAB and gives global access to the profile page (currently only reachable from a header icon on the dashboard, which stays as-is — do not remove it).

The `/dashboard/plants?filter=to-water` deep link itself is **not removed** — it's still used by the "À arroser" widget on the dashboard home page and by the plant detail page's back-navigation (`from=to-water`). Only the redundant direct BottomNav entry to it is removed.

---

## Task 1 — Rewrite `components/BottomNav.tsx`

Replace the entire file with:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Sprout, Camera, Home, User } from "lucide-react";

export default function BottomNav({ urgentCount = 0 }: { urgentCount?: number }) {
  const pathname = usePathname();
  const badgeLabel = urgentCount > 9 ? "9+" : String(urgentCount);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#FDFCF8]/95 backdrop-blur-xl border-t border-stone-200/60 pb-4 pt-2 px-1 flex justify-evenly items-end shadow-[0_-20px_40px_rgba(0,0,0,0.03)] md:hidden">

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

      {/* 3 - Ajouter (FAB) */}
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
  );
}
```

Notes:
- The `Suspense` / `useSearchParams` machinery is intentionally removed — it existed only to detect the `?filter=to-water` tab, which no longer has its own nav entry. Active-tab highlighting is now purely `pathname`-based.
- The `Droplets` icon import is dropped (no longer used in this file).

---

## Task 2 — Add `getUrgentWateringCount()` to `server/actions.ts`

`BottomNav` is rendered independently on 5 different pages with no shared data layer, so each caller needs to supply `urgentCount` as a prop. Add this new server function (place it near `getUserRooms`, same file):

Add to the top-level imports (this import does not currently exist in the file):
```ts
import { getWateringStatus, getActiveWateringFrequency } from "@/lib/utils";
```

Add the new function:
```ts
export async function getUrgentWateringCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
      .from("plants")
      .select("last_watered_at, watering_frequency, watering_freq_spring, watering_freq_summer, watering_freq_autumn, watering_freq_winter, snooze_days");

    if (error) throw error;

    return (data || []).filter((plant) => {
      const status = getWateringStatus(
        plant.last_watered_at,
        getActiveWateringFrequency(plant),
        plant.snooze_days || 0
      );
      return status.urgent;
    }).length;
  } catch (error) {
    console.error("Erreur getUrgentWateringCount:", error);
    return 0;
  }
}
```

RLS on `plants` already scopes rows to `auth.uid()`, so no explicit `.eq("user_id", user.id)` filter is needed — consistent with how `plants` is already queried elsewhere in this codebase (e.g. `app/dashboard/plants/page.tsx`).

---

## Task 3 — Wire `urgentCount` into the 5 pages that render `BottomNav`

Two pages already compute an urgent count locally — reuse it instead of querying twice. Three pages don't have plant data at all — call the new server function.

### 3a. `app/dashboard/page.tsx` (already computes `urgentCount`)

Find:
```tsx
      <BottomNav />
```
Replace with:
```tsx
      <BottomNav urgentCount={urgentCount} />
```
(The `urgentCount` variable already exists at the top of the component — no other change needed here.)

### 3b. `app/dashboard/plants/PlantsClient.tsx` (already computes `urgentCount`)

Find:
```tsx
      <BottomNav />
```
Replace with:
```tsx
      <BottomNav urgentCount={urgentCount} />
```

### 3c. `app/dashboard/plant/[id]/page.tsx` (needs the new fetch)

Find the import:
```tsx
import { getPlantDiagnostics, getGrowthPhotos } from "@/server/actions";
```
Replace with:
```tsx
import { getPlantDiagnostics, getGrowthPhotos, getUrgentWateringCount } from "@/server/actions";
```

Find:
```tsx
  const [initialDiagnoses, growthResult] = await Promise.all([
    getPlantDiagnostics(plant.id),
    getGrowthPhotos(plant.id),
  ]);
```
Replace with:
```tsx
  const [initialDiagnoses, growthResult, urgentCount] = await Promise.all([
    getPlantDiagnostics(plant.id),
    getGrowthPhotos(plant.id),
    getUrgentWateringCount(),
  ]);
```

Find:
```tsx
      <BottomNav />
```
Replace with:
```tsx
      <BottomNav urgentCount={urgentCount} />
```

### 3d. `app/dashboard/my-home/page.tsx` (needs the new fetch)

Find:
```tsx
import { getEquipmentRecommendations, getUserRooms } from "@/server/actions"; 
```
Replace with:
```tsx
import { getEquipmentRecommendations, getUserRooms, getUrgentWateringCount } from "@/server/actions"; 
```

Find:
```tsx
  const savedRecommendations = await getEquipmentRecommendations();
  const rooms = await getUserRooms(); // On charge les pièces
```
Replace with:
```tsx
  const [savedRecommendations, rooms, urgentCount] = await Promise.all([
    getEquipmentRecommendations(),
    getUserRooms(), // On charge les pièces
    getUrgentWateringCount(),
  ]);
```

Find:
```tsx
      <BottomNav />
```
Replace with:
```tsx
      <BottomNav urgentCount={urgentCount} />
```

### 3e. `app/dashboard/profile/page.tsx` (needs the new fetch)

Find:
```tsx
import { logOut } from "@/server/actions";
```
Replace with:
```tsx
import { logOut, getUrgentWateringCount } from "@/server/actions";
```

Find:
```tsx
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
```
Replace with:
```tsx
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const urgentCount = await getUrgentWateringCount();

  return (
```

Find:
```tsx
      <BottomNav />
```
Replace with:
```tsx
      <BottomNav urgentCount={urgentCount} />
```

---

## File action table

| File | Action |
|---|---|
| `components/BottomNav.tsx` | Modify (full rewrite) |
| `server/actions.ts` | Modify (add import + new function) |
| `app/dashboard/page.tsx` | Modify (1 line) |
| `app/dashboard/plants/PlantsClient.tsx` | Modify (1 line) |
| `app/dashboard/plant/[id]/page.tsx` | Modify (import + Promise.all + 1 line) |
| `app/dashboard/my-home/page.tsx` | Modify (import + fetch block + 1 line) |
| `app/dashboard/profile/page.tsx` | Modify (import + 1 new line + 1 line) |

## Out of scope

- The header profile icon on `app/dashboard/page.tsx` (top-right, links to `/dashboard/profile`) is **kept as-is**, per explicit decision — do not remove it even though it now duplicates the new "Profil" nav entry.
- No change to `/dashboard/plants?filter=to-water` deep-linking, the filter pill bar in `PlantsClient.tsx`, or the "À arroser" widget on the dashboard home page.
- No change to `app/dashboard/add/page.tsx` (it doesn't render `BottomNav` today and shouldn't start).
- The `plant_diagnoses` RLS security issue is a separate, already-flagged item — not part of this brief.

## Validation checklist

- [ ] `npm run build` passes with no TypeScript errors.
- [ ] BottomNav shows exactly 5 items in the order Accueil / Profil / Ajouter / Ma Maison / Plantes, on all 5 pages that render it.
- [ ] The nav is visually balanced (2 icons left of the FAB, 2 right).
- [ ] Red badge appears on "Plantes" only when at least one plant is due for watering, with the correct count (test by temporarily backdating a plant's `last_watered_at` or setting `snooze_days` to a large negative-equivalent scenario).
- [ ] Badge shows "9+" when urgent count exceeds 9.
- [ ] Tapping "Plantes" always opens the unfiltered "Toutes" view (unless arrived at `/dashboard/plants` via `?filter=to-water` from elsewhere, e.g. the dashboard home widget or plant detail back button, in which case the existing filter behavior is preserved).
- [ ] Active-tab highlighting still works correctly for all 5 entries.
- [ ] No console errors from the removed `Suspense`/`useSearchParams` in `BottomNav.tsx`.
- [ ] Dashboard header profile icon (`app/dashboard/page.tsx`) still present and functional.
