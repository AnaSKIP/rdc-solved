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

export const simulateOCR = async (fileUrl: string) => {
  return new Promise<{
    placa_causador: string
    tipo_veiculo_causador: string
    nome_causador: string
    relato_acidente: string
    placa_onibus: string
    prefixo_onibus: string
  }>((resolve) => {
    setTimeout(() => {
      resolve({
        placa_causador: 'ABC-1234',
        tipo_veiculo_causador: 'Carro Passeio',
        nome_causador: 'Fernando Fambri',
        relato_acidente:
          'Veículo de passeio colidiu na traseira do ônibus que estava parado no ponto aguardando passageiros.',
        placa_onibus: 'RDC-9090',
        prefixo_onibus: '12219',
      })
    }, 2000)
  })
}

export const simulateInfocar = async (name: string, plate: string) => {
  return new Promise<{
    phone: string
    document: string
    address: string
  }>((resolve) => {
    setTimeout(() => {
      resolve({
        phone: '5511999999999',
        document: '123.456.789-00',
        address: 'Rua das Flores, 123, São Paulo - SP',
      })
    }, 1500)
  })
}
