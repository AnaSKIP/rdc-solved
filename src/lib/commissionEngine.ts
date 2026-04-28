/**
 * Advanced Commission Engine
 * Automated calculation logic for analyst commissions based on claim values,
 * inspection (vistoria) costs, and claim status.
 */

export interface CommissionContext {
  claimValue: number
  vistoriaValue: number
  claimStatus: 'Aprovada' | 'Negada' | string
}

export function calculateAnalystCommission({
  claimValue,
  vistoriaValue,
  claimStatus,
}: CommissionContext): number {
  let baseCommission = 0

  // Base Tiers:
  // Claim values from R$ 1.00 to R$ 9,999.99 = 4% commission.
  // Claim values from R$ 10,000.00 upwards = 5% commission.
  if (claimValue >= 1 && claimValue <= 9999.99) {
    baseCommission = claimValue * 0.04
  } else if (claimValue >= 10000) {
    baseCommission = claimValue * 0.05
  }

  // Inspection (Vistoria) Rules:
  // If the claim is "Denied" (Negada): No discount is applied to the analyst.
  if (claimStatus === 'Negada') {
    return baseCommission
  }

  // Base Vistoria value: R$ 80.00
  // Rule 1: If the vistoria is strictly < R$ 80.00: The analyst receives the full Base Commission.
  if (vistoriaValue < 80) {
    return baseCommission
  }

  // Rules 2 & 3: If the vistoria is >= R$ 80.00: The final commission is (Base Commission - R$ 80.00).
  return Math.max(0, baseCommission - 80)
}
