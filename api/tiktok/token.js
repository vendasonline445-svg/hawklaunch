import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase not configured' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data, error } = await supabase
    .from('tiktok_tokens')
    .select('access_token, advertiser_ids, bc_ids, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return res.status(404).json({ error: 'No token found', details: error?.message })
  }

  res.json({
    code: 0,
    data: {
      access_token: data.access_token,
      advertiser_ids: data.advertiser_ids || [],
      bc_ids: data.bc_ids || [],
    }
  })
}
