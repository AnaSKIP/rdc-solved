import { supabase } from '@/lib/supabase/client'

export interface ETLReport {
  totalProcessed: number
  totalSuccess: number
  totalErrors: number
  successRate: number
  errorsByCategory: {
    extraction: number
    transformation: number
    load: number
    duplicates: number
  }
  errorsList: { ra: string; type: string; details: string }[]
  executionTime: string
  completionDate: string
}

export const runETL = async (onProgress: (msg: string) => void): Promise<ETLReport> => {
  const startTime = Date.now()
  let totalProcessed = 0
  let totalSuccess = 0
  let totalErrors = 0
  const errorsByCategory = { extraction: 0, transformation: 0, load: 0, duplicates: 0 }
  const errorsList: any[] = []
  let currentBatch = 1
  const batchSize = 50

  onProgress('Iniciando processo ETL...')

  while (true) {
    onProgress(`Buscando lote ${currentBatch}...`)

    const { data: rasExtraidos, error: extractError } = await supabase
      .from('caixa_entrada_importacao')
      .select('*')
      .in('status_atual', ['REPESCAGEM', 'SEM ACORDO'])
      .eq('status_validacao', 'VÁLIDO')
      .neq('status_transferencia', 'TRANSFERIDO')
      .lte('data_importacao', new Date().toISOString())
      .order('data_criacao', { ascending: true })
      .limit(batchSize)

    if (extractError) {
      errorsByCategory.extraction++
      break
    }

    if (!rasExtraidos || rasExtraidos.length === 0) {
      onProgress('Nenhum RA pendente encontrado. Finalizando ETL.')
      break
    }

    onProgress(`Lote ${currentBatch}: Processando ${rasExtraidos.length} RAs...`)

    for (const ra of rasExtraidos) {
      totalProcessed++
      try {
        if (isMockedRA(ra)) {
          errorsByCategory.transformation++
          errorsList.push({
            ra: ra.id_ra,
            type: 'DADO_MOCKADO',
            details: 'Registro ignorado por conter dados fictícios ou placeholders',
          })
          await logAction(
            'TRANSFORMAÇÃO',
            ra.id_ra,
            currentBatch,
            'IGNORADO',
            null,
            'Dado mockado detectado',
          )
          totalErrors++
          continue
        }

        const raTransformado = transformRA(ra)
        if (!raTransformado) {
          errorsByCategory.transformation++
          errorsList.push({
            ra: ra.id_ra,
            type: 'TRANSFORMAÇÃO',
            details: 'Falha na normalização dos dados',
          })
          await logAction(
            'TRANSFORMAÇÃO',
            ra.id_ra,
            currentBatch,
            'ERRO',
            null,
            'Falha na normalização',
          )
          totalErrors++
          continue
        }

        const { count, error: countError } = await supabase
          .from('caixa_entrada')
          .select('*', { count: 'exact', head: true })
          .eq('id_ra', raTransformado.id_ra)

        if (countError) throw countError

        if (count && count > 0) {
          errorsByCategory.duplicates++
          errorsList.push({
            ra: ra.id_ra,
            type: 'DUPLICIDADE',
            details: 'RA já existe na caixa de entrada',
          })
          await logAction('CARGA', ra.id_ra, currentBatch, 'ERRO', null, 'RA já existe')
          totalErrors++
          continue
        }

        const idTransferencia = crypto.randomUUID()

        const { error: insertError } = await supabase.from('caixa_entrada').insert({
          id_ra: raTransformado.id_ra,
          cliente_nome: raTransformado.cliente_nome,
          cliente_cnpj: raTransformado.cliente_cnpj,
          placa_onibus: raTransformado.placa_onibus,
          prefixo_onibus: raTransformado.prefixo_onibus,
          causador_nome: raTransformado.causador_nome,
          causador_cpf: raTransformado.causador_cpf,
          causador_telefone: raTransformado.causador_telefone,
          causador_whatsapp: raTransformado.causador_whatsapp,
          causador_endereco: raTransformado.causador_endereco,
          proprietario_veiculo_causador: raTransformado.proprietario_veiculo_causador,
          placa_causador: raTransformado.placa_causador,
          modelo_causador: raTransformado.modelo_causador,
          ano_causador: raTransformado.ano_causador,
          cor_causador: raTransformado.cor_causador,
          data_acidente: raTransformado.data_acidente,
          hora_acidente: raTransformado.hora_acidente,
          local_acidente: raTransformado.local_acidente,
          dinamica_acidente: raTransformado.dinamica_acidente,
          valor_dano_estimado: raTransformado.valor_dano_estimado,
          status_processamento: 'AGUARDANDO PROCESSAMENTO',
          status_conformidade: 'PENDENTE',
          documentos_anexados: ra.documentos_anexados,
          data_criacao: ra.data_criacao,
          id_transferencia: idTransferencia,
          data_transferencia: new Date().toISOString(),
          lote_numero: currentBatch,
        })

        if (insertError) {
          errorsByCategory.load++
          errorsList.push({ ra: ra.id_ra, type: 'CARGA', details: insertError.message })
          await logAction('CARGA', ra.id_ra, currentBatch, 'ERRO', null, insertError.message)
          totalErrors++
          continue
        }

        await supabase
          .from('caixa_entrada_importacao')
          .update({
            status_transferencia: 'TRANSFERIDO',
            data_transferencia: new Date().toISOString(),
            id_transferencia: idTransferencia,
          })
          .eq('id_ra', ra.id_ra)

        await logAction('CARGA', ra.id_ra, currentBatch, 'SUCESSO', 'Transferido com sucesso')
        totalSuccess++
      } catch (err: any) {
        errorsByCategory.load++
        errorsList.push({ ra: ra.id_ra, type: 'ERRO_DESCONHECIDO', details: err.message })
        await logAction('CARGA', ra.id_ra, currentBatch, 'ERRO', null, err.message)
        totalErrors++
      }
    }

    onProgress(`Aguardando próximo lote...`)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    currentBatch++
  }

  const endTime = Date.now()
  const execTimeSeconds = Math.floor((endTime - startTime) / 1000)

  return {
    totalProcessed,
    totalSuccess,
    totalErrors,
    successRate: totalProcessed > 0 ? (totalSuccess / totalProcessed) * 100 : 0,
    errorsByCategory,
    errorsList,
    executionTime: `${Math.floor(execTimeSeconds / 60)}m ${execTimeSeconds % 60}s`,
    completionDate: new Date().toLocaleString(),
  }
}

function isMockedRA(ra: any) {
  // Validação relaxada para evitar rejeitar leads legítimos (reduzindo "falhas de leitura")
  const checkStr = (val: any) => (val ? String(val).toLowerCase() : '')
  const desc = checkStr(ra.dinamica_acidente)

  // Bloqueia apenas lixo técnico evidente como HTML cru
  if (desc.includes('<div') || desc.includes('<!--')) return true

  return false
}

function transformRA(ra: any) {
  try {
    return {
      ...ra,
      data_acidente: ra.data_acidente
        ? new Date(ra.data_acidente).toISOString().split('T')[0]
        : null,
      valor_dano_estimado: ra.valor_dano_estimado ? parseFloat(ra.valor_dano_estimado) : null,
      causador_telefone: cleanNumbers(ra.causador_telefone),
      causador_whatsapp: cleanNumbers(ra.causador_whatsapp),
      causador_cpf: cleanNumbers(ra.causador_cpf),
      cliente_cnpj: cleanNumbers(ra.cliente_cnpj),
      placa_onibus: cleanPlate(ra.placa_onibus),
      placa_causador: cleanPlate(ra.placa_causador),
    }
  } catch {
    return null
  }
}

function cleanNumbers(val: string | null) {
  if (!val) return null
  const num = val.replace(/\D/g, '')
  return num.length > 0 ? num : null
}

function cleanPlate(val: string | null) {
  if (!val) return null
  return val.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
}

async function logAction(
  acao: string,
  ra: string,
  lote: number,
  status: string,
  msg: string | null,
  erro: string | null = null,
) {
  await supabase.from('transferencia_log').insert({
    tipo_acao: acao,
    id_ra: ra,
    lote_numero: lote,
    status: status,
    mensagem: msg,
    detalhes_erro: erro,
  })
}
