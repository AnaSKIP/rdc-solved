CREATE TABLE IF NOT EXISTS public.odoo_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    operation_type TEXT NOT NULL DEFAULT 'sync',
    status TEXT NOT NULL DEFAULT 'pending',
    total_processed INTEGER DEFAULT 0,
    total_success INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    duplicates_avoided INTEGER DEFAULT 0,
    error_message TEXT,
    start_date_filter TEXT,
    end_date_filter TEXT,
    details JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.odoo_sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_odoo_sync_logs" ON public.odoo_sync_logs;
CREATE POLICY "auth_all_odoo_sync_logs" ON public.odoo_sync_logs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
