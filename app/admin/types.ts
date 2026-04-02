export interface EnrichedUser {
  id: string;
  email: string | undefined;
  created_at: string;
  last_sign_in_at: string | null | undefined;
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
}
