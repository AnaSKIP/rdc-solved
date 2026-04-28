-- Remove duplicate claims based on RA to allow the unique constraint to be created safely
DO $$
BEGIN
  -- We use ctid or row_number to delete all but the oldest occurrence of each RA
  DELETE FROM public.claims WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY ra ORDER BY created_at ASC) as rnum
      FROM public.claims
    ) t WHERE t.rnum > 1
  );

  -- Drop existing constraint if it was created before, to ensure idempotency
  ALTER TABLE public.claims DROP CONSTRAINT IF EXISTS claims_ra_key;
  
  -- Add the unique constraint on RA to serve as our deduplication lock
  ALTER TABLE public.claims ADD CONSTRAINT claims_ra_key UNIQUE (ra);
END $$;
