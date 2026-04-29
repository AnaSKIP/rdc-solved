export const fetchCEP = async (cep: string) => {
  try {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length !== 8) return { erro: true }
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
    return await res.json()
  } catch (e) {
    return { erro: true }
  }
}

export const fetchCNPJ = async (cnpj: string) => {
  try {
    const cleanCnpj = cnpj.replace(/\D/g, '')
    if (cleanCnpj.length !== 14) return { erro: true }
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`)
    return await res.json()
  } catch (e) {
    return { erro: true }
  }
}

// Restored empty mocks to prevent build errors in Sandbox.tsx and CaseHeader.tsx
export const simulateOCR = async (file?: any) => {
  return {
    cliente: null,
    placaOnibus: null,
    prefixo: null,
    causerName: null,
    placaCausador: null,
    marcaModelo: null,
    causerDocument: null,
    causerPhone: null,
    dinamica: null,
  }
}

export const simulateInfocar = async (placa?: string) => {
  return {
    success: false,
    message: 'Mock removed',
    data: null,
  }
}
