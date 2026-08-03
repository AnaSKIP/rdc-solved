export const STAGE_DISPLAY_LABELS: Record<string, string> = {
  Repescagem: 'Finalizados Sem Acordo',
}

export const getStageLabel = (stage: string | null | undefined): string => {
  if (!stage) return ''
  return STAGE_DISPLAY_LABELS[stage] || stage
}
