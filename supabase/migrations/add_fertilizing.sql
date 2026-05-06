ALTER TABLE public.plants
  ADD COLUMN IF NOT EXISTS last_fertilized_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.plants.last_fertilized_at
  IS 'Date du dernier apport d''engrais, null si jamais fertilisée';
