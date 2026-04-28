import { supabase } from '@/lib/supabase/client'

export const sendWhatsAppMessage = async (phone: string, message: string) => {
  let formattedPhone = phone.replace(/\D/g, '')

  if (!formattedPhone || formattedPhone.length < 10) {
    throw new Error('Formato de número de telefone inválido.')
  }

  // Prepend Brazil country code if missing
  if (formattedPhone.length === 10 || formattedPhone.length === 11) {
    formattedPhone = `55${formattedPhone}`
  }

  const { data, error } = await supabase.functions.invoke('send-whatsapp', {
    body: { to: formattedPhone, phone: formattedPhone, message },
  })

  if (error) {
    throw new Error(error.message || 'Falha ao se comunicar com o servidor de envio.')
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data
}
