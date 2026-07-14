export function isValidUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string' || url.trim() === '') return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function getDocFileType(url: string | null | undefined): 'image' | 'pdf' {
  if (!url) return 'pdf'
  const cleanUrl = url.split('?')[0].split('#')[0]
  const ext = cleanUrl.split('.').pop()?.toLowerCase()
  if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image'
  return 'pdf'
}

export interface ParsedDocument {
  url: string
  name: string
  type: string
}

export function parseDocumentosAnexados(raw: unknown): ParsedDocument[] {
  if (!raw) return []
  let docs: unknown[] = []
  if (Array.isArray(raw)) {
    docs = raw
  } else if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      docs = Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  } else {
    return []
  }

  return docs
    .map((doc: any) => {
      if (typeof doc === 'string') {
        const name = doc.split('/').pop() || 'Documento'
        return { url: doc, name, type: name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'file' }
      }
      const url = doc?.url || doc?.url_arquivo || doc?.link || doc?.fileUrl || ''
      const name =
        doc?.nome ||
        doc?.nome_arquivo ||
        doc?.file_name ||
        doc?.name ||
        (url ? url.split('/').pop() : 'Documento')
      const type =
        doc?.tipo ||
        doc?.tipo_arquivo ||
        doc?.file_type ||
        doc?.type ||
        (String(name).toLowerCase().endsWith('.pdf') ? 'pdf' : 'file')
      return { url, name: name || 'Documento', type: type || 'file' }
    })
    .filter((d) => d.url && isValidUrl(d.url))
}
