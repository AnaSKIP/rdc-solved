import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileText, Download, Loader2, FileWarning } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FilePreviewModalProps {
  open: boolean
  onClose: () => void
  url: string | null
  fileName: string | null
  fileType: string | null
}

export function FilePreviewModal({
  open,
  onClose,
  url,
  fileName,
  fileType,
}: FilePreviewModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const blobUrlRef = useRef<string | null>(null)

  const isPdf = (fileType?.includes('pdf') || fileName?.toLowerCase().endsWith('.pdf')) ?? false
  const isImage =
    (fileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName || '')) ??
    false

  useEffect(() => {
    if (!open || !url) {
      setBlobUrl(null)
      return
    }

    if (isPdf) {
      setLoading(true)
      fetch(url)
        .then((res) => res.blob())
        .then((blob) => {
          if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
          const typedBlob = new Blob([blob], { type: 'application/pdf' })
          const objUrl = URL.createObjectURL(typedBlob)
          blobUrlRef.current = objUrl
          setBlobUrl(objUrl)
          setLoading(false)
        })
        .catch(() => {
          setBlobUrl(url)
          setLoading(false)
        })
    } else {
      setBlobUrl(null)
    }

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [open, url, isPdf])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{fileName || 'Pré-visualização'}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden rounded-lg border bg-muted/30">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && isPdf && blobUrl && (
            <iframe
              src={blobUrl}
              title={fileName || 'PDF Preview'}
              className="w-full h-full border-0"
            />
          )}
          {!loading && isImage && url && (
            <div className="flex items-center justify-center h-full p-4">
              <img
                src={url}
                alt={fileName || 'Image'}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
          {!loading && !isPdf && !isImage && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <FileWarning className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Pré-visualização não disponível para este tipo de arquivo.
              </p>
              {url && (
                <Button asChild>
                  <a href={url} download={fileName || 'arquivo'}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar arquivo
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
