import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { File } from 'lucide-react'

interface FilePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  fileUrl: string | null
  fileName: string
  fileType: string
}

export function FilePreviewModal({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileType,
}: FilePreviewModalProps) {
  if (!fileUrl) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-4 sm:rounded-lg overflow-hidden">
        <DialogHeader className="pb-2 flex-shrink-0">
          <DialogTitle className="text-lg text-gray-800">{fileName}</DialogTitle>
          <DialogDescription>
            Pré-visualização do documento de mídia anexado ao sinistro.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 w-full bg-gray-100 rounded-md overflow-hidden flex items-center justify-center border border-gray-200 shadow-inner">
          {fileType === 'pdf' ||
          fileType.includes('pdf') ||
          fileName?.toLowerCase().endsWith('.pdf') ? (
            <object data={fileUrl} type="application/pdf" className="w-full h-full border-none">
              <iframe src={fileUrl} className="w-full h-full border-none" title={fileName}>
                <div className="flex flex-col items-center justify-center p-8 text-center bg-white h-full">
                  <File className="w-16 h-16 mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">
                    Seu navegador pode estar bloqueando a visualização de PDFs ou o arquivo foi
                    enviado como anexo de download.
                  </p>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Abrir PDF em Nova Guia
                  </a>
                </div>
              </iframe>
            </object>
          ) : fileType === 'image' ||
            fileType.includes('image') ||
            fileName?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
            <img src={fileUrl} alt={fileName} className="max-w-full max-h-full object-contain" />
          ) : fileType === 'text' ||
            fileType.includes('text') ||
            fileName?.toLowerCase().endsWith('.txt') ? (
            <iframe
              src={fileUrl}
              className="w-full h-full border-none bg-white p-4"
              title={fileName}
            />
          ) : fileType === 'audio' || fileType.includes('audio') ? (
            <audio controls src={fileUrl} className="w-full max-w-md" />
          ) : fileType === 'video' || fileType.includes('video') ? (
            <video controls src={fileUrl} className="max-w-full max-h-full" />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-500">
              <File className="w-16 h-16 mb-4 text-gray-400" />
              <p>Visualização nativa não disponível para este formato.</p>
              <a
                href={fileUrl}
                download={fileName}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline mt-2 font-medium"
              >
                Fazer Download do Arquivo
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
