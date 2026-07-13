-- Add Service Provision Contract URL column to analysts table
ALTER TABLE public.analysts
ADD COLUMN IF NOT EXISTS contrato_prestacao_servicos_url TEXT;
