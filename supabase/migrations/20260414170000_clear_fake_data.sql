DO $$
BEGIN
  -- Delete all records from claims and leads to remove fake data ("Causador Odoo 83", "ABC-1234", etc)
  DELETE FROM public.claims;
  DELETE FROM public.leads;
END $$;
