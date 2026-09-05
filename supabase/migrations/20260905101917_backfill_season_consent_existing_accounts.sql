-- US-003 : reprise de données sur les comptes EXISTANTS uniquement (pas les
-- comptes qui seront créés après ce déploiement — voir la note dans
-- getEffectiveSeason()/getSeasonConsentStatus() côté application, qui initialise
-- silencieusement les nouveaux comptes sur la vraie saison astronomique, sans
-- jamais leur proposer l'écran de consentement).
--
-- La saison effective de départ pour un compte existant est celle que les
-- ANCIENNES bornes calendaires (1er du mois) appliquaient silencieusement
-- jusqu'ici — "autumn", puisque le produit y est passé le 1er septembre 2026.
-- C'est la valeur neutre qui ne fait bouger AUCUNE cadence au déploiement, et
-- c'est elle qui fait apparaître le premier écran de consentement : "voulez-vous
-- revenir aux cadences d'été (bornes astronomiques) ?".
--
-- Idempotent : ne touche que les comptes n'ayant pas encore de season_consent.
-- Appliquée en production le 2026-09-05 via le MCP Supabase (apply_migration) ;
-- vérifiée après coup : 8/8 comptes ont désormais season_consent, tous avec
-- effectiveSeason='autumn' et effectiveYear=2026.
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
  'season_consent', jsonb_build_object(
    'effectiveSeason', 'autumn',
    'effectiveYear', 2026,
    'lastAskedSeason', 'autumn',
    'lastAskedYear', 2026
  )
)
WHERE NOT (raw_user_meta_data ? 'season_consent');
