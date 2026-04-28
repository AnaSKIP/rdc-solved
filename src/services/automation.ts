import { supabase } from '@/lib/supabase/client'

// ARQUIVOS ALTERADOS PARA REMOVER MOCKS:
// 1. src/services/automation.ts - Todos os dados mockados (simulateOCR, simulateInfocar e leads fakes) foram completamente removidos.
// A função agora solicita o upload de um PDF real pelo usuário, processa o arquivo na Edge Function dedicada e grava os dados reais e literais na tabela "leads".

export const runAutomationTest = async (onProgress: (msg: string) => void) => {
  return new Promise<void>((resolve, reject) => {
    // Cria um input de arquivo invisível para que o usuário envie o PDF real
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/pdf'

    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) {
        reject(new Error('Nenhum arquivo selecionado'))
        return
      }

      try {
        onProgress('Fazendo upload do PDF real para processamento...')
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
        const filePath = `uploads/${fileName}`

        // Upload para o Storage real
        const { error: uploadError } = await supabase.storage
          .from('claim_attachments')
          .upload(filePath, file)

        if (uploadError) throw new Error('Falha no upload do documento: ' + uploadError.message)

        const { data: publicUrlData } = supabase.storage
          .from('claim_attachments')
          .getPublicUrl(filePath)

        onProgress('Lendo PDF e extraindo dados exatos na Edge Function (sem alucinações)...')

        // Chamada para a Edge Function que faz a leitura e não inventa dados
        const { data, error } = await supabase.functions.invoke('process-pdf', {
          body: { fileUrl: publicUrlData.publicUrl, fileName: file.name },
        })

        if (error) throw new Error('Erro na comunicação com a Edge Function: ' + error.message)
        if (data?.error) throw new Error('Erro na extração: ' + data.error)

        // Teste e log no console conforme solicitado
        console.log('✅ Dados REAIS extraídos com sucesso:', data.extracted)

        onProgress('Dados extraídos com sucesso a partir do PDF! Verifique o console.')

        resolve()
      } catch (err: any) {
        console.error('Erro no processamento do PDF:', err)
        onProgress('Erro: ' + err.message)
        reject(err)
      }
    }

    input.click()
  })
}
