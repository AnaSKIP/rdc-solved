-- Add email column to analysts table for system access credential
ALTER TABLE public.analysts
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add unique constraint on email (idempotent)
-- PostgreSQL allows multiple NULLs in a UNIQUE column, so existing rows are safe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'analysts_email_key'
    AND conrelid = 'public.analysts'::regclass
  ) THEN
    ALTER TABLE public.analysts ADD CONSTRAINT analysts_email_key UNIQUE (email);
  END IF;
END $$;
