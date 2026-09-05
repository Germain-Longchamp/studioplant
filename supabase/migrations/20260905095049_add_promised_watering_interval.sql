-- US-002 : intervalle d'arrosage promis, figé au lieu d'être recalculé à la volée.
-- Réemploi de la colonne watering_frequency (déjà un embryon d'"intervalle figé",
-- juste jamais rafraîchi à l'arrosage) sous un nom explicite plutôt qu'une nouvelle
-- colonne : un champ qui change de sens sous le même nom est précisément la classe
-- de bug qu'on corrige. L'ancienne colonne watering_frequency est conservée pour
-- l'instant (lecture seule, plus aucune écriture applicative après ce déploiement) ;
-- elle sera supprimée dans une migration ultérieure une fois le déploiement
-- confirmé sain.
--
-- Appliquée en production le 2026-09-05 via le MCP Supabase (apply_migration) ;
-- ce fichier documente à l'identique ce qui a été exécuté, pour qu'elle soit
-- relisible en code review et rejouable depuis un clone.

ALTER TABLE public.plants
  ADD COLUMN promised_watering_interval_days integer;

COMMENT ON COLUMN public.plants.promised_watering_interval_days IS
  'Intervalle (en jours) promis à la plante depuis son dernier arrosage (ou sa création) : fige la cadence en vigueur au lieu de la recalculer à la volée à chaque affichage. Mis à jour UNIQUEMENT à la création de la plante, à chaque arrosage, et lors d''un réglage manuel de la cadence (US-002). Remplace l''usage de watering_frequency, conservée en lecture seule le temps de la bascule.';

-- Reprise : chaque plante reçoit comme intervalle promis la cadence de la saison
-- ACTIVE au moment de la migration (et non une copie brute de l'ancienne colonne,
-- souvent obsolète pour les plantes déjà saisonnalisées) — exactement la même
-- logique que getActiveWateringFrequency() côté application, figée à cet instant.
-- C'est ce qui garantit qu'aucune échéance affichée ne bouge à la mise en production :
-- due_date_avant (recalcul dynamique) = due_date_après (intervalle figé), puisque
-- l'intervalle figé EST la fréquence active à l'instant T de la migration.
-- Contrôlé après coup : 109/109 plantes, 0 divergence
-- (cf. docs/sql/us002-reprise-verification.sql, non commité).
UPDATE public.plants
SET promised_watering_interval_days = COALESCE(
  CASE
    WHEN extract(month FROM (now() AT TIME ZONE 'utc'))::int BETWEEN 3 AND 5  THEN NULLIF(watering_freq_spring, 0)
    WHEN extract(month FROM (now() AT TIME ZONE 'utc'))::int BETWEEN 6 AND 8  THEN NULLIF(watering_freq_summer, 0)
    WHEN extract(month FROM (now() AT TIME ZONE 'utc'))::int BETWEEN 9 AND 11 THEN NULLIF(watering_freq_autumn, 0)
    ELSE NULLIF(watering_freq_winter, 0)
  END,
  NULLIF(watering_frequency, 0),
  7
)
WHERE promised_watering_interval_days IS NULL;

ALTER TABLE public.plants
  ALTER COLUMN promised_watering_interval_days SET DEFAULT 7;

ALTER TABLE public.plants
  ALTER COLUMN promised_watering_interval_days SET NOT NULL;

-- Autorité unique de calcul de l'échéance, lue par les trois runtimes (app Next.js,
-- edge function Deno, back-office) au lieu que chacun la recalcule dans son langage.
-- security_invoker = true est OBLIGATOIRE : sans lui, Postgres exécute la vue avec
-- les droits de son propriétaire et CONTOURNE la RLS de `plants` — la vue montrerait
-- alors les plantes de tout le monde à n'importe quel utilisateur authentifié.
-- Vérifié après coup en simulant un JWT authenticated ET le rôle anon (0 fuite).
CREATE VIEW public.plants_watering_status
WITH (security_invoker = true) AS
SELECT
  p.*,
  CASE
    WHEN p.last_watered_at IS NULL THEN NULL
    ELSE (
      (p.last_watered_at AT TIME ZONE 'utc')::date
      + ((p.promised_watering_interval_days + COALESCE(p.snooze_days, 0)) * INTERVAL '1 day')
    )::date
  END AS due_date,
  CASE
    WHEN p.last_watered_at IS NULL THEN false
    WHEN COALESCE(p.is_deceased, false) THEN false
    WHEN COALESCE(p.reminders_paused, false) THEN false
    ELSE (
      (p.last_watered_at AT TIME ZONE 'utc')::date
      + ((p.promised_watering_interval_days + COALESCE(p.snooze_days, 0)) * INTERVAL '1 day')
    )::date <= (now() AT TIME ZONE 'utc')::date
  END AS is_urgent
FROM public.plants p;

GRANT SELECT ON public.plants_watering_status TO anon, authenticated, service_role;

-- Recharge le cache de schéma PostgREST pour exposer immédiatement la nouvelle
-- colonne et la nouvelle vue sans attendre le prochain cycle de rafraîchissement.
NOTIFY pgrst, 'reload schema';
