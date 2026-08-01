import { useState } from 'react'
import {
  FileText,
  Image as ImageIcon,
  File,
  Download,
  Eye,
  Paperclip,
  Upload,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilePreviewModal } from '@/components/FilePreviewModal'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { useKanbanStore } from '@/stores/useKanbanStore'

export function CaseAttachments() {
  const { selectedClaim, updateClaim, refreshClaims } = useKanbanStore()
  const { toast } = useToast()
  const [previewFile, setPreviewFile] = useState<{
    url: string
    name: string
    type: string
  } | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const attachments = selectedClaim?.attachments || []

  const getFileIcon = (fileType: string) => {
    if (fileType === 'pdf') return <FileText className="w-4 h-4 text-red-500" />
    if (fileType === 'image' || fileType?.includes('image'))
      return <ImageIcon className="w-4 h-4 text-blue-500" />
    return <File className="w-4 h-4 text-gray-500" />
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !selectedClaim?.id) return

    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${file.name}`
        const filePath = `uploads/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('claim_attachments')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from('claim_attachments')
          .getPublicUrl(filePath)

        const fileType = fileExt?.toLowerCase() === 'pdf' ? 'pdf' : 'image'

        const { error: insertError } = await supabase.from('attachments').insert({
          claim_id: selectedClaim.id,
          url: publicUrlData.publicUrl,
          file_name: file.name,
          file_type: fileType,
        })

        if (insertError) throw insertError
      }

      toast({
        title: 'Documento(s) anexado(s)',
        description: `${files.length} arquivo(s) adicionado(s) com sucesso.`,
        className: 'bg-green-50 border-green-200 text-green-900',
      })

      await refreshClaims()
    } catch (err: any) {
      toast({
        title: 'Erro no upload',
        description: err.message || 'Falha ao anexar documento.',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="mt-4 p-3 bg-gray-50/50 rounded-md border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-gray-600" />
          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Anexos</h4>
          <span className="text-[10px] text-gray-400">({attachments.length})</span>
        </div>
        <div className="relative">
          <input
            type="file"
            multiple
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleUpload}
            disabled={isUploading || !selectedClaim?.id}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 bg-white shadow-sm"
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Upload className="w-3 h-3" />
            )}
            Anexar
          </Button>
        </div>
      </div>

      {attachments.length === 0 ? (
        <div className="text-xs text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded bg-white/50">
          Nenhum documento anexado a este caso.
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[240px] overflow-y-auto scrollbar-thin">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all group"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getFileIcon(file.file_type)}
                <span className="text-xs font-medium text-gray-700 truncate" title={file.file_name}>
                  {file.file_name}
                </span>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() =>
                    setPreviewFile({
                      url: file.url,
                      name: file.file_name,
                      type: file.file_type,
                    })
                  }
                >
                  <Eye className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-gray-400 hover:text-green-600 hover:bg-green-50"
                  asChild
                >
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={file.file_name}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.url || null}
        fileName={previewFile?.name || ''}
        fileType={previewFile?.type || ''}
      />
    </div>
  )
}
