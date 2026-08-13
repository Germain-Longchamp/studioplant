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
}
