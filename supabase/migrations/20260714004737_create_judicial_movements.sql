CREATE TABLE IF NOT EXISTS public.judicial_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id uuid REFERENCES public.claims(id) ON DELETE CASCADE NOT NULL,
    description text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.judicial_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated Select Judicial Movements" ON public.judicial_movements;
CREATE POLICY "Authenticated Select Judicial Movements" ON public.judicial_movements
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated Insert Judicial Movements" ON public.judicial_movements;
CREATE POLICY "Authenticated Insert Judicial Movements" ON public.judicial_movements
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Update Judicial Movements" ON public.judicial_movements;
CREATE POLICY "Authenticated Update Judicial Movements" ON public.judicial_movements
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Delete Judicial Movements" ON public.judicial_movements;
CREATE POLICY "Authenticated Delete Judicial Movements" ON public.judicial_movements
    FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_judicial_movements_claim_id ON public.judicial_movements (claim_id);
CREATE INDEX IF NOT EXISTS idx_judicial_movements_created_at ON public.judicial_movements (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_claims_judicial_process_number ON public.claims (judicial_process_number) WHERE judicial_process_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_claims_judicial_status ON public.claims (judicial_status) WHERE judicial_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_claims_stage_judicial ON public.claims (stage) WHERE stage = 'Judicial';
