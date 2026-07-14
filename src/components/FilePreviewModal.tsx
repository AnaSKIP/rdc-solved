import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { File, Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isOpen || !fileUrl) return
    setIsLoading(true)
    const isPdf =
      fileType === 'pdf' || fileType.includes('pdf') || fileName?.toLowerCase().endsWith('.pdf')
    if (isPdf) {
      const timer = setTimeout(() => setIsLoading(false), 1500)
      return () => clearTimeout(timer)
    }
  }, [isOpen, fileUrl, fileType, fileName])

  if (!fileUrl) return null

  const isPdf =
    fileType === 'pdf' || fileType.includes('pdf') || fileName?.toLowerCase().endsWith('.pdf')
  const isImage =
    fileType === 'image' ||
    fileType.includes('image') ||
    fileName?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)
  const isText =
    fileType === 'text' || fileType.includes('text') || fileName?.toLowerCase().endsWith('.txt')
  const isAudio = fileType === 'audio' || fileType.includes('audio')
  const isVideo = fileType === 'video' || fileType.includes('video')

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-4 sm:rounded-lg overflow-hidden">
        <DialogHeader className="pb-2 flex-shrink-0">
          <DialogTitle className="text-lg text-gray-800">{fileName}</DialogTitle>
          <DialogDescription>
            Pré-visualização do documento de mídia anexado ao sinistro.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 w-full bg-gray-100 rounded-md overflow-hidden flex items-center justify-center border border-gray-200 shadow-inner relative">
          {isLoading && (isImage || isPdf) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-10">
              <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
              <p className="text-sm text-gray-500 mt-2">Carregando documento...</p>
            </div>
          )}
          {isPdf ? (
            <iframe src={fileUrl} className="w-full h-full border-none" title={fileName} />
          ) : isImage ? (
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full max-h-full object-contain"
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          ) : isText ? (
            <iframe
              src={fileUrl}
              className="w-full h-full border-none bg-white p-4"
              title={fileName}
            />
          ) : isAudio ? (
            <audio controls src={fileUrl} className="w-full max-w-md" />
          ) : isVideo ? (
            <video controls src={fileUrl} className="max-w-full max-h-full" />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-500">
              <File className="w-16 h-16 mb-4 text-gray-400" />
              <p>Visualização nativa não disponível para este formato.</p>
              <Button asChild className="mt-4">
                <a href={fileUrl} download={fileName}>
                  <Download className="w-4 h-4 mr-2" />
                  Fazer Download do Arquivo
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
