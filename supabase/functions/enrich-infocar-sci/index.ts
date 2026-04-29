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

    // Protocolo Anti-Alucinação: Não geramos dados simulados se a API não estiver conectada.
    // Retornamos estritamente vazio ou enviamos um aviso claro para o frontend.
    if (!infocarToken || !sciToken) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            'Aviso: Chaves de API (Infocar/SCI) ausentes no servidor. Apenas dados encontrados nos anexos reais (B.O./Relatórios) serão processados e exibidos.',
          data: null,
        }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    // --- CÓDIGO DE INTEGRAÇÃO REAL (Aguardando tokens válidos em Produção) ---
    /*
    const infocarRes = await fetch(`https://api.infocar.com.br/v1/placa/${placa}`, { headers: { Authorization: `Bearer ${infocarToken}` }})
    const infocarData = await infocarRes.json()
    
    const sciRes = await fetch(`https://api.sci.com.br/v1/cpf/${infocarData.cpf}`, { headers: { Authorization: `Bearer ${sciToken}` }})
    const sciData = await sciRes.json()

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Consulta realizada nas bases com sucesso.',
      data: {
        causerName: infocarData.nome,
        causerDocument: infocarData.cpf_cnpj || infocarData.cpf,
        causerPhone: sciData.telefone_principal || sciData.telefone,
        causerEndereco: sciData.endereco_completo || sciData.endereco,
        proprietarioNome: infocarData.proprietario_nome || infocarData.nome,
        // Caso o SCI retorne um array de telefones, eles são formatados como uma string única para exibição global
        proprietarioTelefone: sciData.telefones ? sciData.telefones.join(', ') : sciData.telefone
      } 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
    */

    return new Response(
      JSON.stringify({ success: true, message: 'Aguardando implementação da integração real.' }),
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
