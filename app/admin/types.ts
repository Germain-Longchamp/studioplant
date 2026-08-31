export interface EnrichedUser {
  id: string;
  email: string | undefined;
  created_at: string;
  last_sign_in_at: string | null | undefined;
  /** Dernière activité réelle (chargement d'une page /dashboard) — voir public.user_activity.
   *  Plus fiable que last_sign_in_at qui ne bouge pas tant que la session reste valide. */
  last_seen_at: string | null;
  plantsCount: number;
  roomsCount: number;
}

export interface AdminLog {
  id: string;
  created_at: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
}

export interface RetentionMetrics {
  DAU: number;
  WAU: number;
  MAU: number;
  stickinessRatio: number;
  totalUsers: number;
  activationRate: number;
  newActivationRate: number;
  ghostUsers: number;
  powerUsers: number;
  wateringEngagementRate: number;
  plantsPerActiveUser: number;
  cohortData: { name: string; retention: number; total: number }[];
  // Sprint 4 — watering usage
  activeWatererRate: number;
  abandonedRate: number;
  abandonedCount: number;
  avgAdherenceRatio: number | null;
  plantsWithHistoryCount: number;
  usersWithPlantsCount: number;
  // US-000 — leviers de rétention
  // Chaque taux est `null` quand le dénominateur est 0 (afficher « — », jamais « 0 % »).
  retentionLevers: {
    /** Utilisateurs avec ≥1 abonnement push / utilisateurs avec ≥1 plante. */
    optInRate: number | null;
    optInNum: number;
    optInDenom: number;
    /** Plantes suivies (non décédées, rappels non en pause) dont la date d'arrosage
     *  théorique est STRICTEMENT dépassée (`<`, minuit UTC) / plantes suivies.
     *  Écart délibéré avec getWateringStatus().urgent (`<=`) : mesure la négligence, pas l'échéance. */
    neglectedRate: number | null;
    neglectedNum: number;
    neglectedDenom: number;
    /** Utilisateurs avec ≥2 pièces / utilisateurs avec ≥1 plante. */
    configuredHomesRate: number | null;
    configuredHomesNum: number;
    configuredHomesDenom: number;
  };
}
