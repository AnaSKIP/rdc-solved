-- Drop the strict unique constraint on RA alone
DO $$
BEGIN
  ALTER TABLE public.claims DROP CONSTRAINT IF EXISTS claims_ra_key;
  DROP INDEX IF EXISTS claims_ra_key;

  -- Add the new composite unique constraint (RA + Date + Placa)
  -- This allows multiple claims with the same RA, as long as they have different date or placa
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'claims_ra_date_placa_key'
  ) THEN
    ALTER TABLE public.claims ADD CONSTRAINT claims_ra_date_placa_key UNIQUE (ra, date, placa_causador);
  END IF;
END $$;
