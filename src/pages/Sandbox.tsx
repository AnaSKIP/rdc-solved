import { useState, useRef, type ChangeEvent } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { fetchCEP, fetchCNPJ } from '@/services/external'
import { uploadAndProcessPdf } from '@/services/ocr'
import { sendWhatsAppMessage } from '@/services/whatsapp'
import { Loader2, Beaker, Play, Server, FileText, MessageSquare } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Sandbox() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const runTest = async (testName: string, action: () => Promise<any>) => {
    setLoading(true)
    setResult(null)
    try {
      const res = await action()
      setResult({ test: testName, data: res })
      toast({
        title: 'Teste Concluído',
        description: `Execução de ${testName} finalizada com sucesso.`,
        className: 'bg-green-50 border-green-200 text-green-900',
      })
    } catch (e: any) {
      setResult({ test: testName, error: e.message })
      toast({ title: 'Erro no Teste', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleOcrFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await runTest('OCR Extração de BO', () => uploadAndProcessPdf(file))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] bg-gray-50 overflow-auto p-4 lg:p-8 animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Beaker className="text-solved w-8 h-8" /> Sandbox de Integrações
          </h1>
          <p className="text-sm text-gray-500 mt-2 max-w-2xl">
            Módulo 6: Ambiente seguro para testes de automação e comunicação. Verifique o retorno
            bruto (JSON) de APIs externas como ViaCEP, BrasilAPI, OCR Inteligente e disparos via
            Z-API do WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6 lg:col-span-1">
            <Card className="shadow-md border-gray-200">
              <CardHeader className="bg-white border-b pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue-500" /> Disparadores API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6 bg-gray-50/50">
                <Button
                  onClick={() => runTest('ViaCEP', () => fetchCEP('01001000'))}
                  className="w-full justify-start gap-3 bg-white text-gray-700 border hover:bg-gray-50 shadow-sm h-12"
                  variant="outline"
                  disabled={loading}
                >
                  <Play className="w-4 h-4 text-blue-500" /> Buscar ViaCEP (01001-000)
                </Button>
                <Button
                  onClick={() => runTest('BrasilAPI CNPJ', () => fetchCNPJ('19131243000197'))}
                  className="w-full justify-start gap-3 bg-white text-gray-700 border hover:bg-gray-50 shadow-sm h-12"
                  variant="outline"
                  disabled={loading}
                >
                  <Play className="w-4 h-4 text-purple-500" /> Consultar CNPJ (BrasilAPI)
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleOcrFileSelect}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full justify-start gap-3 bg-white text-gray-700 border hover:bg-gray-50 shadow-sm h-12"
                  variant="outline"
                  disabled={loading}
                >
                  <FileText className="w-4 h-4 text-orange-500" /> Extrair Dados via OCR (IA)
                </Button>
                <Button
                  onClick={() =>
                    runTest('WhatsApp Z-API', () =>
                      sendWhatsAppMessage(
                        '5511999999999',
                        'Teste Sandbox RDC: Mensagem Automatizada',
                      ),
                    )
                  }
                  className="w-full justify-start gap-3 bg-white text-gray-700 border hover:bg-gray-50 shadow-sm h-12"
                  variant="outline"
                  disabled={loading}
                >
                  <MessageSquare className="w-4 h-4 text-green-500" /> Disparo WhatsApp (Z-API)
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="lg:col-span-2 bg-[#0f172a] text-green-400 font-mono shadow-xl border-gray-800 rounded-xl overflow-hidden">
            <CardHeader className="bg-[#1e293b] border-b border-gray-800 pb-3 py-3">
              <CardTitle className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <div className="flex gap-1.5 mr-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                Console Output & JSON Inspector
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 h-[500px] overflow-auto text-sm scrollbar-thin scrollbar-thumb-gray-600">
              {loading && (
                <div className="flex items-center gap-3 text-blue-400 font-semibold animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin" /> Executando requisição para o serviço
                  externo...
                </div>
              )}
              {!loading && !result && (
                <div className="text-gray-500 italic mt-4">
                  Nenhum teste executado. Clique em um disparador à esquerda para iniciar.
                </div>
              )}
              {!loading && result && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <div className="text-purple-400 mb-4 font-bold border-b border-gray-800 pb-2">
                    // Teste Finalizado: {result.test}
                  </div>
                  <pre className="text-green-300 leading-relaxed whitespace-pre-wrap">
                    {JSON.stringify(result.data || result.error, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
