import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, supabaseKey)

    const { data: pendingRas, error: fetchError } = await admin
      .from('caixa_entrada_importacao')
      .select('*')
      .eq('status_transferencia', 'PENDENTE')
      .order('data_criacao', { ascending: true })

    if (fetchError) throw fetchError
    if (!pendingRas || pendingRas.length === 0) {
      return new Response(JSON.stringify({ success: true, transferred: 0, skipped: 0, total: 0 }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const raList = pendingRas.map((r) => r.id_ra)
    const [{ data: existingClaims }, { data: caixaData }] = await Promise.all([
      admin.from('claims').select('ra').in('ra', raList),
      admin.from('caixa_entrada').select('id_ra, texto_extraido_ocr').in('id_ra', raList),
    ])

    const existingSet = new Set((existingClaims || []).map((c) => c.ra))
    const ocrMap = new Map<string, string>()
    ;(caixaData || []).forEach((c) => {
      if (c.texto_extraido_ocr) ocrMap.set(c.id_ra, c.texto_extraido_ocr)
    })

    let transferred = 0,
      skipped = 0
    const errors: string[] = []

    for (const ra of pendingRas) {
      if (existingSet.has(ra.id_ra)) {
        skipped++
        await admin
          .from('caixa_entrada_importacao')
          .update({
            status_transferencia: 'TRANSFERIDO',
            data_transferencia: new Date().toISOString(),
          })
          .eq('id_ra', ra.id_ra)
        continue
      }

      const ocrText = ocrMap.get(ra.id_ra) || null

      const { error: insertError } = await admin.from('claims').insert({
        ra: ra.id_ra,
        stage: 'Sem acordo',
        status: 'pending',
        date: new Date().toISOString(),
        client_id: ra.cliente_cnpj || ra.cliente_nome || null,
        causer_name: ra.causador_nome || null,
        causer_document: ra.causador_cpf || null,
        causer_whatsapp: ra.causador_whatsapp || null,
        causer_endereco: ra.causador_endereco || null,
        causer_modelo: ra.modelo_causador || null,
        causer_ano: ra.ano_causador || null,
        placa_onibus: ra.placa_onibus || null,
        prefixo_onibus: ra.prefixo_onibus || null,
        placa_causador: ra.placa_causador || null,
        phone: ra.causador_telefone || null,
        relato_acidente: ocrText,
        is_enriched: false,
        is_validated: false,
        company_cnpj: ra.cliente_cnpj || null,
        financial_total_value: ra.valor_dano_estimado || 0,
        proprietario_veiculo_causador: ra.proprietario_veiculo_causador || null,
        proprietario_telefone: ra.proprietario_telefone || null,
      })

      if (insertError) {
        errors.push(`${ra.id_ra}: ${insertError.message}`)
      } else {
        transferred++
        await admin
          .from('caixa_entrada_importacao')
          .update({
            status_transferencia: 'TRANSFERIDO',
            data_transferencia: new Date().toISOString(),
          })
          .eq('id_ra', ra.id_ra)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        transferred,
        skipped,
        total: pendingRas.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
