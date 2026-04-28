CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  -- Agendamento para executar a cada 2 horas a importação de Leads
  PERFORM cron.schedule(
    'odoo-sync-automated-job',
    '0 */2 * * *',
    'SELECT net.http_post(
        url := ''https://hlhtvctpgaxdktttjfxm.supabase.co/functions/v1/odoo-sync-automated'',
        headers := ''{"Content-Type": "application/json"}''::jsonb,
        body := ''{}''::jsonb
    );'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Erro ao configurar pg_cron (provavelmente falta suporte na database local).';
END $$;
