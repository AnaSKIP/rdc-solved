-- Add new fields to claims for Vistorias and Juridico modules
ALTER TABLE public.claims 
ADD COLUMN IF NOT EXISTS vistoria_date timestamptz,
ADD COLUMN IF NOT EXISTS vistoria_link text,
ADD COLUMN IF NOT EXISTS judicial_process_number text,
ADD COLUMN IF NOT EXISTS judicial_status text;

-- Create financial_transactions table for the Finance module
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL CHECK (type IN ('income', 'expense', 'provision')),
    category text NOT NULL,
    amount numeric NOT NULL DEFAULT 0,
    description text,
    due_date timestamptz,
    status text DEFAULT 'pending',
    claim_id uuid REFERENCES public.claims(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS for financial_transactions
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for financial_transactions
DROP POLICY IF EXISTS "Public Access Financial" ON public.financial_transactions;
CREATE POLICY "Public Access Financial" ON public.financial_transactions 
FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Access Financial" ON public.financial_transactions;
CREATE POLICY "Authenticated Access Financial" ON public.financial_transactions 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert some seed data for the financial dashboard provisions
INSERT INTO public.financial_transactions (type, category, amount, description, due_date, status) VALUES
  ('provision', 'COMISSAO', 14500.00, 'Provisão de Comissões - Mês Seguinte', now() + interval '15 days', 'pending'),
  ('provision', 'IMPOSTOS', 4200.00, 'Provisão DAS/Impostos', now() + interval '20 days', 'pending'),
  ('expense', 'FIXA', 2500.00, 'Aluguel e Condomínio', now() + interval '5 days', 'pending'),
  ('income', 'RECEITA', 45000.00, 'Acordos Fechados - Semana Atual', now() + interval '2 days', 'pending')
ON CONFLICT DO NOTHING;
