import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!profile?.is_admin)
      throw new Error('Forbidden: Somente administradores podem realizar esta ação.')

    const { email, name } = await req.json()
    if (!email) throw new Error('Email é obrigatório.')

    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: '1234',
      email_confirm: true,
      user_metadata: { name: name || '' },
    })

    if (createError) throw createError

    const userId = authData.user.id

    await supabaseAdmin.from('profiles').upsert(
      {
        id: userId,
        email,
        name: name || '',
        is_admin: false,
        force_password_change: true,
        raw_password_view: '1234',
      },
      { onConflict: 'id' },
    )

    return new Response(
      JSON.stringify({ success: true, userId, message: 'Usuário criado com senha inicial 1234' }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
