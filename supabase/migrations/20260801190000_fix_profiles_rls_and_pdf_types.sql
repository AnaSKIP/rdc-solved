-- 1. Create SECURITY DEFINER function to check admin status (breaks RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()),
    false
  );
$$;

-- 2. Drop all existing profiles policies (including recursive ones)
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 3. Create non-recursive policies using is_admin() SECURITY DEFINER function
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admin can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4. Fix PDF attachment types: update records where file_name ends with .pdf but file_type is wrong
UPDATE public.attachments
SET file_type = 'application/pdf'
WHERE file_name ILIKE '%.pdf'
  AND (file_type IS NULL OR file_type NOT IN ('application/pdf', 'application/octet-stream'));

UPDATE public.attachments
SET file_type = 'application/pdf'
WHERE file_name ILIKE '%.pdf'
  AND file_type = 'application/octet-stream';

-- 5. Clean Odoo HTML description from accident dynamic fields
-- Odoo descriptions are HTML-formatted; OCR text is plain text
UPDATE public.claims
SET relato_acidente = NULL
WHERE relato_acidente IS NOT NULL
  AND (relato_acidente LIKE '%<p>%' OR relato_acidente LIKE '%<br%'
       OR relato_acidente LIKE '%<div%' OR relato_acidente LIKE '%<span%'
       OR relato_acidente LIKE '%<strong>%' OR relato_acidente LIKE '%<ul>%');

UPDATE public.caixa_entrada
SET dinamica_acidente = NULL
WHERE dinamica_acidente IS NOT NULL
  AND (dinamica_acidente LIKE '%<p>%' OR dinamica_acidente LIKE '%<br%'
       OR dinamica_acidente LIKE '%<div%' OR dinamica_acidente LIKE '%<span%'
       OR dinamica_acidente LIKE '%<strong>%' OR dinamica_acidente LIKE '%<ul>%');

UPDATE public.caixa_entrada_importacao
SET dinamica_acidente = NULL
WHERE dinamica_acidente IS NOT NULL
  AND (dinamica_acidente LIKE '%<p>%' OR dinamica_acidente LIKE '%<br%'
       OR dinamica_acidente LIKE '%<div%' OR dinamica_acidente LIKE '%<span%'
       OR dinamica_acidente LIKE '%<strong>%' OR dinamica_acidente LIKE '%<ul>%');

-- 6. Populate relato_acidente from OCR text where available
UPDATE public.claims
SET relato_acidente = ce.texto_extraido_ocr
FROM public.caixa_entrada ce
WHERE claims.ra = ce.id_ra
  AND ce.texto_extraido_ocr IS NOT NULL
  AND ce.texto_extraido_ocr != ''
  AND (claims.relato_acidente IS NULL OR claims.relato_acidente = '');

-- 7. Populate dinamica_acidente from OCR text in caixa_entrada
UPDATE public.caixa_entrada
SET dinamica_acidente = texto_extraido_ocr
WHERE texto_extraido_ocr IS NOT NULL
  AND texto_extraido_ocr != ''
  AND (dinamica_acidente IS NULL OR dinamica_acidente = '');
