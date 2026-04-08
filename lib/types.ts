export interface GrowthPhoto {
  id: string;
  plant_id: string;
  user_id: string;
  image_path: string; // URL publique Supabase Storage
  note: string | null;
  taken_at: string; // ISO 8601
  created_at: string;
}
