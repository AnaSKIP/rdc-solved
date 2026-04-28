UPDATE public.claims
SET analyst_id = 'OD-201'
WHERE analyst_id IN ('Douglas Martins', 'OD-102', 'Douglas');

UPDATE public.claims
SET analyst_id = 'OD-202'
WHERE analyst_id IN ('Ana Oliveira', 'OD-109', 'Ana');

UPDATE public.claims
SET analyst_id = 'OD-203'
WHERE analyst_id IN ('Roberto Almeida', 'OD-107', 'Roberto');

-- Clear out any other old hardcoded ones that don't match our new OD pattern
UPDATE public.claims
SET analyst_id = NULL
WHERE analyst_id NOT IN ('OD-201', 'OD-202', 'OD-203')
  AND analyst_id LIKE 'OD-10%';
