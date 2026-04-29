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
  checkTotalFromOdoo: () => Promise<void>
  clearBase: () => Promise<void>
  startImport: (limit?: number) => void
  pauseImport: () => void
  resumeImport: () => void
  retryBatch: () => void
  resetImport: () => void
  testConnection: () => Promise<boolean>
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

  const batchSize = 30 // Lote reduzido (30-50) para evitar timeout e permitir download de mídias

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
        body: { ...credentials, countOnly: true },
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
    if (!window.confirm('Tem certeza que deseja apagar TODOS os sinistros da base local?')) return
    setIsClearing(true)
    addLog('Iniciando limpeza da base de dados de sinistros...', 'warning')
    try {
      const { error } = await supabase
        .from('claims')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) throw error

      addLog('Base de sinistros limpa com sucesso. Pronta para nova importação.', 'success')
      toast({ title: 'Base Limpa', description: 'Todos os sinistros removidos localmente.' })
      setProcessed(0)
      setSuccessful(0)
      setFailed(0)
      setDuplicatesAvoided(0)
      setAttachedFilesCount(0)
      setStatus('idle')
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
          body: { ...credentials, countOnly: true },
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
      `Iniciando extração real em lote de ${runTarget} leads (Sem Acordo e Repescagem)...`,
      'info',
    )
    addLog('Validação estrita de duplicidade por RA + CNPJ configurada.', 'info')
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

  const testConnection = async () => {
    if (!credentials) return false
    try {
      const { data, error } = await supabase.functions.invoke('odoo-sync', {
        body: { ...credentials, countOnly: true },
      })
      if (error || !data?.success) return false
      return true
    } catch {
      return false
    }
  }

  const transferLeads = async () => {
    setIsTransferring(true)
    addLog('Iniciando transferência de todos os leads para a Caixa de Entrada...', 'info')
    try {
      const { data, error } = await supabase.functions.invoke('transferir-todos-leads', {
        method: 'POST',
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)

      addLog(data.mensagem, 'success')
      if (data.total_erros > 0) {
        addLog(
          `${data.total_erros} leads ignorados devido a falhas de validação (campos vazios).`,
          'warning',
        )
      }
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

        if (processed > 0) {
          addLog(
            `Aguardando 2 segundos antes do próximo lote para evitar sobrecarga e timeout nas mídias...`,
            'info',
          )
          await new Promise((r) => setTimeout(r, 2000))
        }

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

          const { data: existingClaims, error: fetchError } = await supabase
            .from('claims')
            .select('ra, causer_document')

          if (fetchError) throw fetchError

          const batchRecords: any[] = []
          let batchDuplicatesAvoided = 0
          let batchFailures = 0
          const odooIdToRa = new Map<number, string>()

          for (const lead of realLeads) {
            try {
              const getVal = (val: any) => (val === false ? null : val)

              // 1. Validar se é dado mockado
              const isMockedData = (l: any) => {
                const placeholders = [
                  'xyz-9876',
                  'abc1234',
                  'ex: abc1234',
                  'ex: ford / ecosport',
                  'ex: 1002',
                  '(00) 00000-0000',
                  'selecione o cliente...',
                  'cliente desconhecido',
                ]
                const fictitiousNames = [
                  'roberto almeida',
                  'ana oliveira',
                  'douglas martins',
                  'elisicler ia santos',
                  'transmimo ltda',
                ]

                const checkStr = (val: any) => (val ? String(val).toLowerCase() : '')

                const clientName = checkStr(
                  l.company_name_enriched || l.partner_name || l.contact_name,
                )
                const causerName = checkStr(l.x_nome_causador || l.x_causador_nome)
                const placaOnibus = checkStr(l.x_placa_onibus)
                const placaCausador = checkStr(l.x_placa_causador)
                const desc = checkStr(l.description)

                if (
                  placeholders.some(
                    (p) =>
                      clientName.includes(p) ||
                      causerName.includes(p) ||
                      placaOnibus.includes(p) ||
                      placaCausador.includes(p),
                  )
                )
                  return true
                if (fictitiousNames.some((n) => clientName.includes(n) || causerName.includes(n)))
                  return true
                if (desc.includes('<div') || desc.includes('<!--')) return true

                return false
              }

              if (isMockedData(lead)) {
                batchFailures++
                continue
              }

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

              const existingWithBaseRa =
                existingClaims?.filter((c) => c.ra === baseRa || c.ra?.startsWith(`${baseRa}\n`)) ||
                []

              let finalRa = baseRa
              let isDuplicate = false

              if (existingWithBaseRa.length > 0) {
                const sameCnpj = existingWithBaseRa.find(
                  (c) => c.causer_document === cnpj || (!c.causer_document && !cnpj),
                )
                if (sameCnpj) {
                  isDuplicate = true
                } else {
                  finalRa = `${baseRa}\n${cnpj || 'S-CNPJ'}`
                }
              }

              if (isDuplicate) {
                batchDuplicatesAvoided++
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
                ra: finalRa,
                stage: stage,
                status: 'pending',
                date,
                causer_name: causer_name,
                causer_document: cnpj,
                financial_total_value: getVal(lead.expected_revenue) || 0,
                analyst_id: lead.user_id && Array.isArray(lead.user_id) ? lead.user_id[1] : null,
                relato_acidente: cleanResidualData(getVal(lead.description)),
                phone: cleanResidualData(getVal(lead.phone) || getVal(lead.mobile)),
                placa_onibus: cleanResidualData(getVal(lead.x_placa_onibus)),
                prefixo_onibus: cleanResidualData(getVal(lead.x_prefixo_onibus)),
                motorista_onibus: cleanResidualData(getVal(lead.x_motorista_onibus)),
                placa_causador: cleanResidualData(getVal(lead.x_placa_causador)),
                tipo_veiculo_causador: cleanResidualData(getVal(lead.x_tipo_veiculo_causador)),
                is_enriched: false,
              })
            } catch (e) {
              batchFailures++
            }
          }

          let insertedCount = 0

          if (batchRecords.length > 0) {
            const { data: insertedClaims, error: upsertError } = await supabase
              .from('claims')
              .upsert(batchRecords, {
                onConflict: 'ra,date,placa_causador',
                ignoreDuplicates: true,
              })
              .select('id')

            if (upsertError) throw upsertError
            insertedCount = insertedClaims?.length || 0

            if (insertedCount < batchRecords.length) {
              batchDuplicatesAvoided += batchRecords.length - insertedCount
            }
          }

          // Atualizar contadores de leads imediatamente para feedback visual em tempo real
          setSuccessful((prev) => prev + insertedCount)
          setFailed((prev) => prev + batchFailures)
          setDuplicatesAvoided((prev) => prev + batchDuplicatesAvoided)

          let batchFiles = 0
          let skippedFiles = 0

          if (odooAttachments.length > 0) {
            addLog(
              `[Lote ${currentBatch}] Leads salvos. Baixando ${odooAttachments.length} anexos em paralelo (em background)...`,
              'info',
            )

            const raList = Array.from(odooIdToRa.values())
            const { data: claimsData } = await supabase
              .from('claims')
              .select('id, ra')
              .in('ra', raList)

            const raToClaimId = new Map<string, string>()
            claimsData?.forEach((c) => raToClaimId.set(c.ra, c.id))

            const processAttachment = async (att: any) => {
              if (!mounted || status !== 'running') return 'aborted'

              const ra = odooIdToRa.get(att.res_id)
              if (!ra) return 'skipped'
              const claimId = raToClaimId.get(ra)
              if (!claimId) return 'skipped'

              try {
                const { data: existingAtt } = await supabase
                  .from('attachments')
                  .select('id')
                  .eq('claim_id', claimId)
                  .eq('file_name', att.name)
                  .maybeSingle()

                if (existingAtt) {
                  return 'skipped'
                }

                // O upload agora é feito diretamente pela Edge Function para evitar o travamento do navegador (limite de memória na aba)
                const { data: attData, error: attError } = await supabase.functions.invoke(
                  'odoo-sync',
                  {
                    body: {
                      ...credentials,
                      attachmentId: att.id,
                      claimId: claimId,
                    },
                  },
                )

                if (attError || !attData?.success) {
                  console.error(`Erro ao processar anexo ${att.name}:`, attError || attData?.error)
                  return 'error'
                }

                const mimeType = attData.mimeType || 'application/octet-stream'

                await supabase.from('attachments').insert({
                  claim_id: claimId,
                  file_name: attData.name || att.name,
                  file_type: mimeType.includes('pdf')
                    ? 'pdf'
                    : mimeType.includes('image')
                      ? 'image'
                      : 'file',
                  url: attData.publicUrl,
                })

                // Atualiza a UI em tempo real arquivo por arquivo
                setAttachedFilesCount((prev) => prev + 1)
                return 'inserted'
              } catch (e: any) {
                console.error(`Erro ao processar anexo ${att.name}:`, e)
                return 'error'
              }
              return 'error'
            }

            // Processamento concorrente otimizado (5 workers)
            const limit = 5
            let index = 0
            const results: string[] = []

            const worker = async () => {
              while (index < odooAttachments.length) {
                if (!mounted || status !== 'running') break
                const currentIndex = index++
                results[currentIndex] = await processAttachment(odooAttachments[currentIndex])
              }
            }

            const workers = Array.from({ length: Math.min(limit, odooAttachments.length) }, () =>
              worker(),
            )
            await Promise.all(workers)

            batchFiles = results.filter((r) => r === 'inserted').length
            skippedFiles = results.filter((r) => r === 'skipped').length
          }

          addLog(
            `[Lote ${currentBatch}] ${insertedCount} leads importados. Mídias processadas: ${batchFiles} baixadas, ${skippedFiles} ignoradas/existentes.`,
            'success',
          )

          // Atualiza o progresso global após finalizar leads + attachments
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
            addLog(
              `Importação finalizada com sucesso! Total de leads processados: ${newProcessed}`,
              'success',
            )
            toast({
              title: 'Carga Finalizada',
              description: `Sincronização com Odoo concluída, incluindo anexos vinculados.`,
              className: 'bg-green-50 border-green-200',
            })
          }
        } catch (err: any) {
          setStatus('error')
          setFailed((prev) => prev + 1)
          addLog(`[Lote ${currentBatch}] Falha na integração: ${err.message}`, 'error')
          toast({
            title: 'Erro na Carga',
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
