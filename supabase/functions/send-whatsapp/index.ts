import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const destinationPhone = payload.phone || payload.to
    const message = payload.message

    if (!destinationPhone || !message) {
      return new Response(JSON.stringify({ error: 'Phone number and message are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const zApiInstance = Deno.env.get('ZAPI_INSTANCE_ID') || Deno.env.get('ZAPI_INSTANCE')
    const zApiToken = Deno.env.get('ZAPI_TOKEN')
    const zApiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN')

    let formattedPhone = destinationPhone.replace(/\D/g, '')
    if (formattedPhone.length === 10 || formattedPhone.length === 11) {
      formattedPhone = `55${formattedPhone}`
    }

    if (!zApiInstance || !zApiToken) {
      console.warn(
        'Missing Z-API credentials in environment variables. Simulating success response.',
      )
      return new Response(
        JSON.stringify({
          success: true,
          simulated: true,
          message:
            'Mensagem simulada com sucesso (Credenciais Z-API não configuradas no servidor).',
          data: {
            phone: formattedPhone,
            message: message,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    // Using the requested ZAPI_INSTANCE_ID variable for the URL formula
    // We retain send-text as the standard Z-API endpoint for text messages
    const zApiUrl = `https://api.z-api.io/instances/${zApiInstance}/token/${zApiToken}/send-text`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (zApiClientToken) {
      headers['Client-Token'] = zApiClientToken
    }

    const zApiResponse = await fetch(zApiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        phone: formattedPhone,
        message: message,
      }),
    })

    const dataText = await zApiResponse.text()
    let data
    try {
      data = JSON.parse(dataText)
    } catch {
      data = { message: dataText }
    }

    if (!zApiResponse.ok) {
      console.error('Z-API error:', data)
      return new Response(
        JSON.stringify({ error: data.message || 'Failed to send WhatsApp message via Z-API.' }),
        {
          status: zApiResponse.status,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error: any) {
    console.error('Internal server error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
