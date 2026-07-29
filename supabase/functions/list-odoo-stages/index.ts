import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

async function odooJsonRpc(
  cleanUrl: string,
  params: Record<string, unknown>,
  errorContext: string,
): Promise<any> {
  let res: Response
  try {
    res = await fetch(`${cleanUrl}/jsonrpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params }),
    })
  } catch (networkErr: any) {
    throw new Error(
      `${errorContext}: Não foi possível conectar ao servidor Odoo em ${cleanUrl}. Verifique a URL e a conexão de rede. Detalhe: ${networkErr.message}`,
    )
  }
  if (!res.ok) throw new Error(`${errorContext}: HTTP ${res.status} ${res.statusText}`)
  const data = await res.json()
  if (data.error) {
    const errorMsg = data.error?.data?.message || data.error?.message || 'Erro desconhecido do Odoo'
    throw new Error(`${errorContext}: ${errorMsg}`)
  }
  return data.result
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))
    const { url, db, username, apiKey } = body

    if (!url || !db || !username || !apiKey) {
      throw new Error(
        'Credenciais do Odoo incompletas. Verifique URL, Banco de Dados, Usuário e Chave de API.',
      )
    }

    const cleanUrl = url.replace(/\/$/, '')

    const uid = await odooJsonRpc(
      cleanUrl,
      {
        service: 'common',
        method: 'authenticate',
        args: [db, username, apiKey, {}],
      },
      'Falha na autenticação do Odoo',
    )

    if (!uid || uid === false) {
      throw new Error(
        'Autenticação falhou no Odoo: credenciais inválidas. Verifique o usuário e a chave de API.',
      )
    }

    const stages = await odooJsonRpc(
      cleanUrl,
      {
        service: 'object',
        method: 'execute_kw',
        args: [
          db,
          uid,
          apiKey,
          'crm.stage',
          'search_read',
          [[]],
          { fields: ['id', 'name'], order: 'sequence' },
        ],
      },
      'Erro ao buscar estágios no Odoo',
    )

    const normalized = (stages || []).map((s: any) => ({
      id: s.id,
      name: s.name || `Estágio ${s.id}`,
    }))

    return new Response(JSON.stringify({ success: true, stages: normalized }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err: any) {
    console.error('List Odoo Stages Error:', err.message)
    const statusCode = err.message.toLowerCase().includes('autenticação') ? 401 : 500
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
