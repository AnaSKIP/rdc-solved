# RDC Sinistro Cobrança

Projeto de sistema de cobrança de sinistros via WhatsApp, integrado ao Odoo, com leitura de documentos e enriquecimento de dados do causador.

## Configuração do Twilio WhatsApp API

Para que o envio de mensagens pelo WhatsApp funcione, é necessário configurar as seguintes variáveis de ambiente (Secrets) no painel do Supabase, em `Settings > API > Edge Function Secrets` ou utilizando a Supabase CLI (`supabase secrets set NOME=valor`):

- `TWILIO_ACCOUNT_SID`: Seu Account SID do Twilio.
- `TWILIO_AUTH_TOKEN`: Seu Auth Token do Twilio.
- `TWILIO_WHATSAPP_NUMBER`: Seu número de telefone do Twilio configurado para o WhatsApp Sandbox ou Produção, preferencialmente no formato `+1234567890` ou `whatsapp:+1234567890`.

Sem essas variáveis, a Edge Function `send-whatsapp` não conseguirá autenticar com a API da Twilio e disparar mensagens para os clientes.
