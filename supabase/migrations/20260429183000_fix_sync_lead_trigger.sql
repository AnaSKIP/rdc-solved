-- Fix the trigger that inserts NEW.empresa into causer_name
CREATE OR REPLACE FUNCTION public.sync_lead_to_claim()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_client_id uuid;
BEGIN
  -- Attempt to find the client_id if a client with that name exists
  SELECT id INTO v_client_id FROM public.clients WHERE "RAZÃO SOCIAL" ILIKE '%' || NEW.empresa || '%' LIMIT 1;

  INSERT INTO public.claims (
    ra,
    client_id,
    financial_total_value,
    stage,
    date,
    analyst_id,
    causer_name
  ) VALUES (
    COALESCE(NEW.ra, 'RA-' || substr(gen_random_uuid()::text, 1, 6)),
    v_client_id::text,
    NEW.valor,
    COALESCE(NEW.status, 'Atribuir'),
    COALESCE(NEW.data_entrada, NOW()),
    NEW.analista_id,
    NULL -- We map NEW.empresa to nothing for causer_name, keeping it clean for proper extraction
  );
  RETURN NEW;
END;
$function$;

-- Clean up existing claims where causer_name is identical to the client's name due to the bug
DO $$
BEGIN
  UPDATE public.claims c
  SET causer_name = NULL
  FROM public.clients cl
  WHERE c.causer_name = cl."RAZÃO SOCIAL"
    AND c.causer_name IS NOT NULL;
END $$;
