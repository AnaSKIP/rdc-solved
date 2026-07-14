import React, { createContext, useContext, useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'

export type ImportStatus = 'idle' | 'running' | 'paused' | 'error' | 'complete'

export type LogEntry = {
  id: string
  time: string
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
}

export interface OdooCredentials {
  url: string
  db: string
  username: string
  apiKey: string
}

interface OdooImportState {
  credentials: OdooCredentials | null
  setCredentials: (creds: OdooCredentials) => void
  status: ImportStatus
  total: number
  target: number
  batchSize: number
  processed: number
  successful: number
  failed: number
  duplicatesAvoided: number
  attachedFilesCount: number
  logs: LogEntry[]
  isChecking: boolean
  isClearing: boolean
  eta: number | null
  startDate: string
  endDate: string
  setStartDate: (date: string) => void
  setEndDate: (date: string) => void
  lastImportDate: string | null
  fetchLastImportDate: () => Promise<void>
  checkTotalFromOdoo: () => Promise<void>
  clearBase: () => Promise<void>
  startImport: (limit?: number) => void
  pauseImport: () => void
  resumeImport: () => void
  retryBatch: () => void
  resetImport: () => void
  testConnection: () => Promise<{ success: boolean; error?: string; count?: number }>
  isTransferring: boolean
  transferLeads: () => Promise<void>
}

const OdooImportContext = createContext<OdooImportState | null>(null)

export const OdooImportProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast()

  const [credentials, setCredentialsState] = useState<OdooCredentials | null>(() => {
    const saved = localStorage.getItem('odoo_credentials')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        /* ignore */
      }
    }
    return {
      url: 'https://odoo.rdccobrancas.com.br',
      db: 'rdc_prod',
      username: 'admin',
      apiKey: 'demo-key-123',
    }
  })

  const setCredentials = (creds: OdooCredentials) => {
    setCredentialsState(creds)
    localStorage.setItem('odoo_credentials', JSON.stringify(creds))
  }

  const [status, setStatus] = useState<ImportStatus>('idle')
  const [total, setTotal] = useState(0)
  const [target, setTarget] = useState(0)
  const [processed, setProcessed] = useState(0)
  const [successful, setSuccessful] = useState(0)
  const [failed, setFailed] = useState(0)
  const [duplicatesAvoided, setDuplicatesAvoided] = useState(0)
  const [attachedFilesCount, setAttachedFilesCount] = useState(0)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [eta, setEta] = useState<number | null>(null)
  const [isTransferring, setIsTransferring] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [lastImportDate, setLastImportDate] = useState<string | null>(null)

  const batchSize = 100

  const fetchLastImportDate = async () => {
    try {
      const { data } = await supabase
        .from('caixa_entrada_importacao')
        .select('data_importacao')
        .order('data_importacao', { ascending: false, nullsFirst: false })
        .limit(1)
      if (data && data.length > 0 && data[0].data_importacao) {
        setLastImportDate(data[0].data_importacao)
      } else {
        setLastImportDate(null)
      }
    } catch {
      setLastImportDate(null)
    }
  }

  useEffect(() => {
    fetchLastImportDate()
  }, [])

  const addLog = (message: string, type: LogEntry['type']) => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        time: new Date().toLocaleTimeString(),
        message,
        type,
      },
    ])
  }

  const checkTotalFromOdoo = async () => {
    if (!credentials) {
      toast({
        title: 'Atenção',
        description: 'Configure as credenciais primeiro.',
        variant: 'destructive',
      })
      return
    }
    setIsChecking(true)
    setStatus('idle')
    setProcessed(0)
    setSuccessful(0)
    setFailed(0)
    setDuplicatesAvoided(0)
    setAttachedFilesCount(0)
    setLogs([])
    addLog(
      'Conectando à API real do Odoo para buscar contagem de leads ("Sem Acordo" e "Repescagem")...',
      'info',
    )

    try {
      const { data, error } = await supabase.functions.invoke('odoo-sync', {
        body: {
          ...credentials,
          countOnly: true,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)

      const foundTotal = data?.count || 0
      setTotal(foundTotal)
      addLog(
        `Consulta concluída via API: Total de ${foundTotal} leads nas fases corretas no Odoo.`,
        'success',
      )
      toast({
        title: 'Sincronização Odoo',
        description: `Encontrados ${foundTotal} leads no Odoo.`,
        className: 'bg-green-50 border-green-200',
      })
    } catch (err: any) {
      addLog(`Erro ao consultar Odoo: ${err.message}`, 'error')
      toast({
        title: 'Erro na Sincronização',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsChecking(false)
    }
  }

  const clearBase = async () => {
    if (
      !window.confirm(
        'Tem certeza que deseja apagar TODOS os registros da base local de importação?',
      )
    )
      return
    setIsClearing(true)
    addLog('Iniciando limpeza da base de dados de importação...', 'warning')
    try {
      const { error } = await supabase
        .from('caixa_entrada_importacao')
        .delete()
        .neq('id_ra', '00000000-0000-0000-0000-000000000000')

      if (error) throw error

      addLog('Base de importação limpa com sucesso. Pronta para nova extração.', 'success')
      toast({
        title: 'Base Limpa',
        description: 'Todos os registros removidos da tabela de importação.',
      })
      setProcessed(0)
      setSuccessful(0)
      setFailed(0)
      setDuplicatesAvoided(0)
      setAttachedFilesCount(0)
      setStatus('idle')
      setLastImportDate(null)
    } catch (err: any) {
      addLog(`Erro ao limpar base: ${err.message}`, 'error')
      toast({ title: 'Erro na Limpeza', description: err.message, variant: 'destructive' })
    } finally {
      setIsClearing(false)
    }
  }

  const startImport = async (limit?: number) => {
    if (!credentials) {
      toast({
        title: 'Atenção',
        description: 'Configure as credenciais do Odoo primeiro.',
        variant: 'destructive',
      })
      return
    }

    let runTotal = total
    if (runTotal === 0) {
      setIsChecking(true)
      addLog('Consultando Odoo automaticamente para descobrir total de registros...', 'info')
      try {
        const { data, error } = await supabase.functions.invoke('odoo-sync', {
          body: {
            ...credentials,
            countOnly: true,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
          },
        })
        if (error) throw error
        if (data?.error) throw new Error(data.error)
        runTotal = data?.count || 0
        setTotal(runTotal)
      } catch (err: any) {
        addLog(`Erro na pré-consulta: ${err.message}`, 'error')
        setIsChecking(false)
        return
      }
      setIsChecking(false)
    }

    if (runTotal === 0) {
      addLog('Nenhum registro encontrado no Odoo para as fases solicitadas.', 'warning')
      return
    }

    const runTarget = limit || runTotal
    setTarget(runTarget)
    setStatus('running')
    setProcessed(0)
    setSuccessful(0)
    setFailed(0)
    setDuplicatesAvoided(0)
    setAttachedFilesCount(0)
    setLogs([])
    setStartTime(Date.now())
    setEta(null)

    addLog(
      `Iniciando extração fiel em lote de ${runTarget} leads (Sem Acordo e Repescagem)...`,
      'info',
    )
    addLog('Extração bruta ativada: Nenhuma validação obstrutiva será aplicada.', 'info')
  }

  const pauseImport = () => {
    setStatus('paused')
    addLog('Importação pausada pelo usuário.', 'warning')
  }

  const resumeImport = () => {
    setStatus('running')
    addLog('Importação retomada.', 'info')
  }

  const retryBatch = () => {
    setStatus('running')
    addLog('Tentando processar o lote pendente novamente...', 'info')
  }

  const resetImport = () => {
    setStatus('idle')
    setProcessed(0)
    setSuccessful(0)
    setFailed(0)
    setDuplicatesAvoided(0)
    setAttachedFilesCount(0)
    setLogs([])
    setStartTime(null)
    setEta(null)
  }

  const testConnection = async (): Promise<{
    success: boolean
    error?: string
    count?: number
  }> => {
    if (!credentials) return { success: false, error: 'Credenciais não configuradas.' }
    try {
      const { data, error } = await supabase.functions.invoke('odoo-sync', {
        body: { ...credentials, countOnly: true },
      })
      if (data?.error) {
        return { success: false, error: data.error }
      }
      if (error && !data) {
        return { success: false, error: 'Erro de conexão com o servidor de funções.' }
      }
      if (!data?.success) {
        return { success: false, error: 'Resposta inválida do servidor.' }
      }
      return { success: true, count: data.count }
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro desconhecido ao testar conexão.' }
    }
  }

  const transferLeads = async () => {
    setIsTransferring(true)
    addLog('Iniciando transferência direta de todos os leads para a Caixa de Entrada...', 'info')
    try {
      const { data, error } = await supabase.functions.invoke('transferir-leads-corrigido', {
        method: 'POST',
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)

      addLog(data.mensagem, 'success')
      toast({
        title: 'Transferência Concluída',
        description: data.mensagem,
        className: 'bg-green-50 border-green-200',
      })
    } catch (err: any) {
      addLog(`Erro na transferência: ${err.message}`, 'error')
      toast({
        title: 'Erro na Transferência',
        description: 'Ocorreu um erro ao transferir os leads: ' + err.message,
        variant: 'destructive',
      })
    } finally {
      setIsTransferring(false)
    }
  }

  useEffect(() => {
    let mounted = true

    if (status === 'running' && processed < target) {
      const run = async () => {
        const currentBatch = Math.floor(processed / batchSize) + 1
        const remaining = target - processed
        const currentBatchSize = Math.min(batchSize, remaining)

        if (!mounted || status !== 'running') return

        addLog(
          `[Lote ${currentBatch}] Extraindo ${currentBatchSize} leads e suas respectivas mídias do Odoo via API...`,
          'info',
        )

        try {
          const { data, error: functionError } = await supabase.functions.invoke('odoo-sync', {
            body: {
              ...credentials,
              offset: processed,
              limit: currentBatchSize,
              start_date: startDate || undefined,
              end_date: endDate || undefined,
            },
          })

          if (functionError) throw functionError
          if (data?.error) throw new Error(data.error)

          const realLeads = data?.leads || []
          const odooAttachments = data?.attachments || []

          if (realLeads.length === 0 && processed < target) {
            addLog(`Aviso: Odoo não retornou mais leads. Finalizando.`, 'warning')
            setStatus('complete')
            return
          }

          // Busca em todos os estágios do pipeline para garantir que não importemos duplicados
          const { data: existingImportacao, error: fetchError } = await supabase
            .from('caixa_entrada_importacao')
            .select('id_ra, causador_cpf')
          const { data: existingCaixa } = await supabase
            .from('caixa_entrada')
            .select('id_ra, causador_cpf')
          const { data: existingKanban } = await supabase
            .from('claims')
            .select('ra, causer_document')

          if (fetchError) throw fetchError

          const { data: maxLoteData } = await supabase
            .from('caixa_entrada_importacao')
            .select('lote_importacao')
            .order('lote_importacao', { ascending: false, nullsFirst: false })
            .limit(1)
          const currentLote = (maxLoteData?.[0]?.lote_importacao || 0) + 1

          const batchRecords: any[] = []
          let batchDuplicatesAvoided = 0
          let batchFailures = 0
          const odooIdToRa = new Map<number, string>()

          for (const lead of realLeads) {
            try {
              const getVal = (val: any) => (val === false ? null : val)

              const baseRa = String(
                getVal(lead.x_ra) || getVal(lead.name) || `RA-${lead.id}`,
              ).trim()

              const causer_name =
                getVal(lead.partner_name) || getVal(lead.contact_name) || 'Desconhecido'
              const rawCnpj =
                getVal(lead.x_cnpj) || getVal(lead.vat) || getVal(lead.x_cpf_cnpj) || null

              const fullText = `${rawCnpj || ''} ${getVal(lead.description) || ''} ${causer_name}`
              const cnpjMatch = fullText.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{14}/)
              const cnpj = rawCnpj || (cnpjMatch ? cnpjMatch[0] : null)

              // Verifica se já existe na importação
              const matchImportacao = existingImportacao?.some(
                (c) =>
                  (c.id_ra === baseRa || c.id_ra?.startsWith(`${baseRa}\n`)) &&
                  (c.causador_cpf === cnpj || (!c.causador_cpf && !cnpj)),
              )
              // Verifica se já existe na caixa de entrada
              const matchCaixa = existingCaixa?.some(
                (c) =>
                  (c.id_ra === baseRa || c.id_ra?.startsWith(`${baseRa}\n`)) &&
                  (c.causador_cpf === cnpj || (!c.causador_cpf && !cnpj)),
              )
              // Verifica se já existe no Kanban (claims)
              const matchKanban = existingKanban?.some(
                (c) =>
                  (c.ra === baseRa || c.ra?.startsWith(`${baseRa}\n`)) &&
                  (c.causer_document === cnpj || (!c.causer_document && !cnpj)),
              )

              let isDuplicate = matchImportacao || matchCaixa || matchKanban
              let finalRa = baseRa

              // Se não for duplicado estritamente, mas o RA base já existir, adicionamos o CNPJ para diferenciar
              if (
                !isDuplicate &&
                (existingImportacao?.some((c) => c.id_ra === baseRa) ||
                  existingCaixa?.some((c) => c.id_ra === baseRa) ||
                  existingKanban?.some((c) => c.ra === baseRa))
              ) {
                finalRa = `${baseRa}\n${cnpj || 'S-CNPJ'}`
              }

              if (isDuplicate) {
                batchDuplicatesAvoided++
                addLog(
                  `Registro ${baseRa} já existe na base. Pulando para evitar duplicidade.`,
                  'warning',
                )
                odooIdToRa.set(lead.id, finalRa)
                continue
              }

              odooIdToRa.set(lead.id, finalRa)

              const dateStr = getVal(lead.create_date)
              const date = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString()

              const stageName =
                lead.stage_id && Array.isArray(lead.stage_id) ? lead.stage_id[1] : 'Sem Acordo'
              const stage = stageName.includes('Repescagem') ? 'Repescagem' : 'Sem Acordo'

              const cleanResidualData = (val: any) => {
                if (!val) return null
                const noHtml = String(val)
                  .replace(/<[^>]*>?/gm, '')
                  .trim()
                if (!noHtml) return null
                return noHtml
              }

              batchRecords.push({
                id_ra: finalRa,
                status_atual: stage,
                data_criacao: date,
                data_importacao: new Date().toISOString(),
                lote_importacao: currentLote,
                causador_nome: causer_name,
                causador_cpf: cnpj,
                valor_dano_estimado: getVal(lead.expected_revenue) || 0,
                analista_atribuido:
                  lead.user_id && Array.isArray(lead.user_id) ? lead.user_id[1] : null,
                dinamica_acidente: cleanResidualData(getVal(lead.description)),
                causador_telefone: cleanResidualData(getVal(lead.phone) || getVal(lead.mobile)),
                placa_onibus: cleanResidualData(getVal(lead.x_placa_onibus)),
                prefixo_onibus: cleanResidualData(getVal(lead.x_prefixo_onibus)),
                placa_causador: cleanResidualData(getVal(lead.x_placa_causador)),
                modelo_causador: cleanResidualData(getVal(lead.x_tipo_veiculo_causador)),
                status_validacao: 'VÁLIDO',
                status_transferencia: 'PENDENTE',
                cliente_nome:
                  getVal(lead.company_name_enriched) ||
                  getVal(lead.partner_name) ||
                  getVal(lead.contact_name) ||
                  null,
                documentos_anexados: [],
              })
            } catch (e) {
              batchFailures++
            }
          }

          let insertedCount = 0

          if (batchRecords.length > 0) {
            const { data: insertedClaims, error: upsertError } = await supabase
              .from('caixa_entrada_importacao')
              .upsert(batchRecords, {
                onConflict: 'id_ra',
                ignoreDuplicates: true,
              })
              .select('id_ra')

            if (upsertError) throw upsertError
            insertedCount = insertedClaims?.length || 0

            if (insertedCount < batchRecords.length) {
              batchDuplicatesAvoided += batchRecords.length - insertedCount
            }
          }

          setSuccessful((prev) => prev + insertedCount)
          setFailed((prev) => prev + batchFailures)
          setDuplicatesAvoided((prev) => prev + batchDuplicatesAvoided)

          let batchFiles = 0
          let skippedFiles = 0

          if (odooAttachments.length > 0) {
            addLog(
              `[Lote ${currentBatch}] Leads salvos. Baixando ${odooAttachments.length} anexos vinculados fielmente aos RAs...`,
              'info',
            )

            const attachmentsByRa = new Map<string, any[]>()
            for (const att of odooAttachments) {
              const ra = odooIdToRa.get(att.res_id)
              if (ra) {
                if (!attachmentsByRa.has(ra)) attachmentsByRa.set(ra, [])
                attachmentsByRa.get(ra)!.push(att)
              }
            }

            const processRaAttachments = async (ra: string, atts: any[]) => {
              if (!mounted || status !== 'running') return 0

              const validDocs: any[] = []
              for (const att of atts) {
                try {
                  const { data: attData, error: attError } = await supabase.functions.invoke(
                    'odoo-sync',
                    {
                      body: {
                        ...credentials,
                        attachmentId: att.id,
                        claimId: ra.replace(/[^a-zA-Z0-9-]/g, '_'),
                      },
                    },
                  )

                  if (!attError && attData?.success) {
                    validDocs.push({
                      name: attData.name || att.name,
                      url: attData.publicUrl,
                      type: attData.mimeType?.includes('pdf')
                        ? 'pdf'
                        : attData.mimeType?.includes('image')
                          ? 'image'
                          : 'file',
                      id: crypto.randomUUID(),
                    })
                  } else {
                    skippedFiles++
                  }
                } catch (e) {
                  skippedFiles++
                }
              }

              if (validDocs.length > 0) {
                const { data: currentRecord } = await supabase
                  .from('caixa_entrada_importacao')
                  .select('documentos_anexados')
                  .eq('id_ra', ra)
                  .single()

                const currentDocs = Array.isArray(currentRecord?.documentos_anexados)
                  ? currentRecord!.documentos_anexados
                  : []
                const newDocs = [...currentDocs]
                let added = 0

                for (const validDoc of validDocs) {
                  if (!currentDocs.some((d: any) => d.name === validDoc.name)) {
                    newDocs.push(validDoc)
                    added++
                  } else {
                    skippedFiles++
                  }
                }

                if (added > 0) {
                  await supabase
                    .from('caixa_entrada_importacao')
                    .update({ documentos_anexados: newDocs })
                    .eq('id_ra', ra)

                  return added
                }
              }
              return 0
            }

            const raEntries = Array.from(attachmentsByRa.entries())
            const limit = 5
            let index = 0

            const worker = async () => {
              let localAdded = 0
              while (index < raEntries.length) {
                if (!mounted || status !== 'running') break
                const [ra, atts] = raEntries[index++]
                localAdded += await processRaAttachments(ra, atts)
              }
              return localAdded
            }

            const workers = Array.from({ length: Math.min(limit, raEntries.length) }, () =>
              worker(),
            )
            const results = await Promise.all(workers)

            batchFiles = results.reduce((a, b) => a + b, 0)
            setAttachedFilesCount((prev) => prev + batchFiles)
          }

          addLog(
            `[Lote ${currentBatch}] ${insertedCount} leads importados. Mídias processadas e atreladas fielmente aos RAs: ${batchFiles} baixadas, ${skippedFiles} ignoradas/existentes.`,
            'success',
          )

          const newProcessed = processed + realLeads.length
          setProcessed(newProcessed)

          if (startTime && newProcessed > 0) {
            const elapsed = Date.now() - startTime
            const velocity = newProcessed / elapsed
            const remaining = target - newProcessed
            if (velocity > 0) {
              setEta(remaining / velocity)
            }
          }

          if (newProcessed >= target || realLeads.length < currentBatchSize) {
            setStatus('complete')
            setProcessed(target > newProcessed ? newProcessed : target)
            fetchLastImportDate()
            addLog(
              `Extração bruta finalizada com sucesso! Total de leads processados: ${newProcessed}. Clique em 'Transferir Agora' para enviar os dados para a Caixa de Entrada.`,
              'success',
            )
            toast({
              title: 'Extração Finalizada',
              description: `Sincronização fiel com Odoo concluída, incluindo todos os anexos.`,
              className: 'bg-green-50 border-green-200',
            })
          }
        } catch (err: any) {
          setStatus('error')
          setFailed((prev) => prev + 1)
          addLog(`[Lote ${currentBatch}] Falha na integração: ${err.message}`, 'error')
          toast({
            title: 'Erro na Extração',
            description: `Falha ao processar lote.`,
            variant: 'destructive',
          })
        }
      }

      run()
    }

    return () => {
      mounted = false
    }
  }, [status, processed, target, batchSize, toast, credentials])

  return (
    <OdooImportContext.Provider
      value={{
        credentials,
        setCredentials,
        status,
        total,
        target,
        batchSize,
        processed,
        successful,
        failed,
        duplicatesAvoided,
        attachedFilesCount,
        logs,
        isChecking,
        isClearing,
        eta,
        startDate,
        endDate,
        setStartDate,
        setEndDate,
        lastImportDate,
        fetchLastImportDate,
        checkTotalFromOdoo,
        clearBase,
        startImport,
        pauseImport,
        resumeImport,
        retryBatch,
        resetImport,
        testConnection,
        isTransferring,
        transferLeads,
      }}
    >
      {children}
    </OdooImportContext.Provider>
  )
}

export default function useOdooImportStore() {
  const ctx = useContext(OdooImportContext)
  if (!ctx) throw new Error('useOdooImportStore must be used within OdooImportProvider')
  return ctx
}
