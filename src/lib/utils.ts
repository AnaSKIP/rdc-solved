import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Separates the RA number from the CNPJ for better display.
 * Identifies if the CNPJ is appended at the end and splits it.
 */
export function formatRaDisplay(raString?: string | null, cnpjStr?: string | null) {
  if (!raString) return { ra: 'S/N', cnpj: null }

  let baseRa = raString
  let cnpj = cnpjStr || null

  if (cnpj && baseRa.includes(cnpj)) {
    baseRa = baseRa.replace(`-${cnpj}`, '').replace(cnpj, '').trim()
    if (baseRa.endsWith('-')) baseRa = baseRa.slice(0, -1).trim()
  } else {
    // Try to guess if the last part is a CNPJ (at least 11 digits)
    const parts = baseRa.split('-')
    if (parts.length >= 3) {
      const lastPart = parts[parts.length - 1].trim()
      if (lastPart.replace(/\D/g, '').length >= 11) {
        cnpj = lastPart
        baseRa = parts
          .slice(0, parts.length - 1)
          .join('-')
          .trim()
      }
    }
  }

  return { ra: baseRa, cnpj }
}
