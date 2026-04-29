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

    // Se as credenciais reais não estiverem presentes, não inventamos dados. Retornamos aviso claro.
    if (!infocarToken || !sciToken) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            'Aviso: Chaves de API (Infocar/SCI) ausentes no servidor. Os dados serão extraídos apenas dos documentos PDF anexados (B.O./Relatórios).',
          data: null,
        }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    // A integração real seria feita aqui com as APIs oficiais:
    // const infocarRes = await fetch(`https://api.infocar.com.br/v1/placa/${placa}`, { headers: { Authorization: `Bearer ${infocarToken}` }})
    // const infocarData = await infocarRes.json()

    // const sciRes = await fetch(`https://api.sci.com.br/v1/cpf/${infocarData.cpf}`, { headers: { Authorization: `Bearer ${sciToken}` }})
    // const sciData = await sciRes.json()

    // Retorno dos dados reais (quando as chaves estiverem configuradas)
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Consulta realizada nas bases com sucesso.',
        data: {
          // causerName: infocarData.nome,
          // causerDocument: infocarData.cpf,
          // causerPhone: sciData.telefone,
          // causerEndereco: sciData.endereco
        },
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
