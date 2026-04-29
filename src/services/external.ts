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

// Remoção completa dos mocks simulateOCR e simulateInfocar para garantir dados apenas 100% reais do backend.
