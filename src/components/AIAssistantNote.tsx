import { AlertTriangle, FileText, Phone, Mail, Smartphone, ChevronRight, Bot } from 'lucide-react'

export function AIAssistantNote() {
  return (
    <div className="text-sm bg-white border border-gray-200 rounded-md shadow-sm mb-4 font-sans">
      <div className="bg-gray-50 px-3 py-2 border-b flex items-center justify-between">
        <span className="font-semibold text-gray-700">RDC Enricher — caso 3279-24346-2025</span>
      </div>

      <div className="p-4 bg-[#FFF8E1] border-b border-yellow-200">
        <div className="flex items-start gap-2 text-yellow-800 font-bold mb-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          ATENÇÃO - REVISÃO NECESSÁRIA
        </div>
        <p className="text-gray-800 mb-2">
          Este caso contém <strong>4 documento(s)</strong> manuscrito(s) ou parcialmente
          manuscrito(s).
        </p>
        <p className="text-gray-800 mb-3">
          Informações extraídas de documentos manuscritos possuem{' '}
          <strong>MENOR CONFIABILIDADE</strong> devido a dificuldades de transcrição.
        </p>

        <div className="mb-3">
          <div className="flex items-center gap-1 font-medium text-gray-700 mb-1">
            <FileText className="w-4 h-4" /> Documentos manuscritos identificados:
          </div>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>REGISTRO DE AVARIA.pdf</li>
            <li>DECLARAÇÃO DO MOTORISTA.pdf</li>
            <li>Boletim.pdf</li>
            <li>OCORRÊNCIA DE TRÂNSITO.pdf</li>
          </ul>
        </div>

        <div className="flex gap-2 text-gray-800 bg-yellow-100 p-2 rounded-sm">
          <span>👉</span>
          <span>
            <strong>AÇÃO REQUERIDA:</strong> Equipe deve revisar manualmente os dados extraídos
            comparando com os documentos originais.
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4 text-gray-800">
        <div>
          <span className="font-semibold">Causador:</span> -
        </div>
        <div>
          <span className="font-semibold">Contatos:</span>
          <div className="pl-4 mt-1">
            <div>fone=-</div>
            <div>email=-</div>
          </div>
        </div>

        <div>
          <span className="font-semibold">Causador (Detalhes SCI):</span>{' '}
          <span className="text-gray-600">Ricardo Santos doc=-</span>
        </div>

        <div>
          <span className="font-semibold">Proprietário:</span> MAURO DE JESUS SILVESTRE{' '}
          <span className="text-gray-500">doc=52727947704</span>
        </div>

        <div>
          <span className="font-semibold">Contatos (Proprietário):</span>
          <div className="pl-4 mt-1">
            <div>fone preferencial=+5527998831951</div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 font-semibold mb-2">
            <Smartphone className="w-4 h-4 text-purple-600" /> Celulares:
          </div>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>+5527998831951 | VIVO | últ.atualização: 18/09/2025</li>
            <li>+55279988815691 | OI | últ.atualização: 28/01/2019</li>
          </ul>
        </div>

        <div>
          <div className="flex items-center gap-2 font-semibold mb-2">
            <Mail className="w-4 h-4 text-blue-600" /> Emails:
          </div>
          <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-2">
            <li>lenon_pereira@yahoo.com.br | últ.atualização: 12/07/2017</li>
            <li>alemao@originet.com.br | últ.atualização: 17/08/2017</li>
            <li>maurosilvestre@oi.com.br | últ.atualização: 05/05/2017</li>
          </ul>
          <div className="mt-3 text-[11px] bg-indigo-50 text-indigo-700 p-2 rounded-md inline-flex items-center gap-1.5 border border-indigo-100 font-medium">
            <Bot className="w-3.5 h-3.5 shrink-0" />
            Utilize a aba "Enviar mensagem" para acionar a IA de Negociação em massa através destes
            emails.
          </div>
        </div>
      </div>
    </div>
  )
}
