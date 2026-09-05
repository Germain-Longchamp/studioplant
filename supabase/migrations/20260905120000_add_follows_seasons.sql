-- US-004 : séparer "j'ai choisi une valeur" de "je ne veux pas suivre les saisons",
-- deux notions que watering_frequency_custom confondait. Nouvelle colonne au nom
-- explicite plutôt qu'une réutilisation inversée de l'ancienne (même principe qu'en
-- US-002 avec promised_watering_interval_days). L'ancienne colonne
-- watering_frequency_custom est conservée le temps de la bascule (rollback = revert
-- du déploiement Vercel), supprimée dans une migration ultérieure.
--
-- Reprise NEUTRE par construction : on n'ajoute qu'un booléen, aucun champ de
-- cadence n'est touché. Les 32 plantes actuellement figées ont leurs 4 valeurs
-- saisonnières égales entre elles ET égales à promised_watering_interval_days →
-- leur cadence effective est strictement inchangée.
--
-- Appliquée en production le 2026-09-05 par Germain via l'éditeur SQL Supabase
-- (l'outil apply_migration ayant été bloqué côté agent). Vérifiée après coup :
-- follows_seasons NOT NULL DEFAULT true, 32/109 à false, 0 incohérence avec
-- l'ancien watering_frequency_custom comparé ligne à ligne.

ALTER TABLE public.plants
  ADD COLUMN IF NOT EXISTS follows_seasons boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.plants.follows_seasons IS
  'Vrai (défaut) : la plante suit les 4 cadences saisonnières ; un réglage manuel décale les 4 proportionnellement et la génération IA les régénère. Faux : cadence constante toute l''année (= promised_watering_interval_days), exclue des propositions de changement de saison (US-003), un réglage manuel s''applique tel quel. Réversible via l''UI. Remplace watering_frequency_custom.';

UPDATE public.plants
SET follows_seasons = false
WHERE COALESCE(watering_frequency_custom, false) = true;
