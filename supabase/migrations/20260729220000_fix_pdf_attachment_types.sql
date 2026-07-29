-- Fix existing attachment records where PDFs were saved with file_type = 'file'
UPDATE public.attachments
SET file_type = 'pdf'
WHERE file_type = 'file'
  AND (
    file_name ILIKE '%.pdf'
    OR url ILIKE '%.pdf'
  );
