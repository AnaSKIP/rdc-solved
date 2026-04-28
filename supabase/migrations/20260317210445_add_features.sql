-- Add new fields to claims for Module 3 and 5
ALTER TABLE public.claims 
ADD COLUMN IF NOT EXISTS placa_onibus text,
ADD COLUMN IF NOT EXISTS prefixo_onibus text,
ADD COLUMN IF NOT EXISTS motorista_onibus text,
ADD COLUMN IF NOT EXISTS placa_causador text,
ADD COLUMN IF NOT EXISTS tipo_veiculo_causador text,
ADD COLUMN IF NOT EXISTS relato_acidente text,
ADD COLUMN IF NOT EXISTS return_scheduled_at timestamptz,
ADD COLUMN IF NOT EXISTS is_validated boolean DEFAULT false;

-- Create internal_messages table for Team Chat Module 4
CREATE TABLE IF NOT EXISTS public.internal_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id uuid,
    sender_email text,
    content text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS for internal_messages
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for internal_messages
CREATE POLICY "Public Access Internal Messages" ON public.internal_messages 
FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated Access Internal Messages" ON public.internal_messages 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

