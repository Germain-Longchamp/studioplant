export interface EnrichedUser {
  id: string;
  email: string | undefined;
  created_at: string;
  last_sign_in_at: string | null | undefined;
  plantsCount: number;
  roomsCount: number;
}
