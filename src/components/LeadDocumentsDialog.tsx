import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileText, ExternalLink, Eye } from 'lucide-react'
import { parseDocumentosAnexados } from '@/lib/document-utils'
import { FilePreviewModal } from '@/components/FilePreviewModal'

interface LeadDocumentsDialogProps {
  isOpen: boolean
  onClose: () => void
  documentosAnexados: unknown
  leadId: string
}

export function LeadDocumentsDialog({
  isOpen,
  onClose,
  documentosAnexados,
  leadId,
}: LeadDocumentsDialogProps) {
  const [previewDoc, setPreviewDoc] = useState<{
    url: string
    name: string
    type: string
  } | null>(null)

  const docs = parseDocumentosAnexados(documentosAnexados)

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600" /> Documentos Anexados
            </DialogTitle>
            <DialogDescription>
              {docs.length} documento(s) vinculado(s) ao lead {leadId}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-auto">
            {docs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum documento encontrado.</p>
            ) : (
              docs.map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-md border bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700 truncate">{doc.name}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setPreviewDoc({ url: doc.url, name: doc.name, type: doc.type })
                      }
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
      <FilePreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        fileUrl={previewDoc?.url || null}
        fileName={previewDoc?.name || ''}
        fileType={previewDoc?.type || ''}
      />
    </>
  )
}
