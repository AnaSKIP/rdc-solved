import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const isMessage =
      payload?.text?.message || payload?.message?.text || payload?.text || payload?.message
    const phone = payload?.phone || payload?.sender
    const fromMe = payload?.fromMe || payload?.message?.fromMe || false

    // Process attachments (Images, Documents, Audios) from Z-API payload
    const image = payload?.image || payload?.message?.image
    const document = payload?.document || payload?.message?.document
    const audio = payload?.audio || payload?.message?.audio

    const fileUrl = image?.imageUrl || document?.documentUrl || audio?.audioUrl
    const mimeType =
      image?.mimeType || document?.mimeType || audio?.mimeType || 'application/octet-stream'
    const originalFileName =
      document?.fileName || `attachment_${Date.now()}${image ? '.jpg' : audio ? '.ogg' : '.pdf'}`
    const fileType = document ? 'pdf' : image ? 'image' : audio ? 'audio' : 'file'

    if (phone) {
      const rawPhone = phone.replace(/\D/g, '')
      const localPhone = rawPhone.length > 8 ? rawPhone.slice(-8) : rawPhone

      if (localPhone.length >= 8) {
        // Find corresponding claim based on phone
        const { data: claims } = await supabase
          .from('claims')
          .select('id, stage')
          .ilike('phone', `%${localPhone}%`)
          .order('created_at', { ascending: false })
          .limit(1)

        const claimId = claims?.[0]?.id
        const currentStage = claims?.[0]?.stage

        if (claimId) {
          const messageText =
            typeof isMessage === 'string' ? isMessage : isMessage ? JSON.stringify(isMessage) : ''

          if (messageText.trim().length > 0) {
            await supabase.from('claim_messages').insert({
              claim_id: claimId,
              sender_phone: phone,
              content: messageText,
              is_from_client: !fromMe,
            })
          }

          // Flag all incoming messages as positive interactions for now, removing keyword filtering as requested
          let hasPositive = !fromMe

          // Process file upload if attachment exists
          if (fileUrl) {
            hasPositive = !fromMe

            try {
              // Fetch file from Z-API generated URL
              const fileRes = await fetch(fileUrl)
              const fileBlob = await fileRes.blob()
              const safeFileName = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_')
              const storagePath = `${claimId}/${Date.now()}_${safeFileName}`

              // Upload to Supabase Storage
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('claim_attachments')
                .upload(storagePath, fileBlob, { contentType: mimeType })

              if (uploadData) {
                const { data: publicUrlData } = supabase.storage
                  .from('claim_attachments')
                  .getPublicUrl(storagePath)

                // Link attachment to the claim
                await supabase.from('attachments').insert({
                  claim_id: claimId,
                  file_name: originalFileName,
                  file_type: fileType,
                  url: publicUrlData.publicUrl,
                })

                // Also save the attachment link in the message history
                await supabase.from('claim_messages').insert({
                  claim_id: claimId,
                  sender_phone: phone,
                  content: `[Anexo recebido: ${originalFileName}](${publicUrlData.publicUrl})`,
                  is_from_client: !fromMe,
                })
              } else {
                console.error('Storage Upload Error:', uploadError)
              }
            } catch (err) {
              console.error('File fetch/upload error:', err)
            }
          }

          // Update claim status & interaction flag
          if (hasPositive) {
            const updates: any = { has_positive_interaction: true }

            // Automatically move stage to 'Em análise' on ANY positive interaction (text or file)
            if (currentStage !== 'Concluído' && currentStage !== 'Em análise') {
              updates.stage = 'Em análise'
            }

            await supabase.from('claims').update(updates).eq('id', claimId)
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, received: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
