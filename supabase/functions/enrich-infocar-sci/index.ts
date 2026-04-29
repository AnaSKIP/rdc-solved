import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { placa } = await req.json()
    if (!placa) throw new Error('Placa é obrigatória para a consulta Infocar.')

    const infocarToken = Deno.env.get('INFOCAR_TOKEN')
    const sciToken = Deno.env.get('SCI_TOKEN')

    // Protocolo de Transparência Rigorosa
    if (!infocarToken || !sciToken) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            'Nenhum retorno recebido da API. Ação não confirmada (Credenciais de integração não configuradas).',
          data: null,
        }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    // --- CÓDIGO DE INTEGRAÇÃO REAL ---
    try {
      const infocarRes = await fetch(`https://api.infocar.com.br/v1/placa/${placa}`, {
        headers: { Authorization: `Bearer ${infocarToken}` },
      })
      if (!infocarRes.ok) throw new Error('Falha na comunicação com Infocar.')
      const infocarData = await infocarRes.json()

      const sciRes = await fetch(`https://api.sci.com.br/v1/cpf/${infocarData.cpf}`, {
        headers: { Authorization: `Bearer ${sciToken}` },
      })
      if (!sciRes.ok) throw new Error('Falha na comunicação com SCI.')
      const sciData = await sciRes.json()

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Ação executada. Retorno recebido das bases de dados reais.',
          data: {
            causerName: infocarData.nome || null,
            causerDocument: infocarData.cpf_cnpj || infocarData.cpf || null,
            causerPhone: sciData.telefone_principal || sciData.telefone || null,
            causerEndereco: sciData.endereco_completo || sciData.endereco || null,
            proprietarioNome: infocarData.proprietario_nome || infocarData.nome || null,
            proprietarioTelefone: sciData.telefones
              ? sciData.telefones.join(', ')
              : sciData.telefone || null,
          },
        }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    } catch (e: any) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Nenhum retorno recebido. Ação falhou: ${e.message}`,
          data: null,
        }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
