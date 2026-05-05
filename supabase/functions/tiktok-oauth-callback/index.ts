import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const TIKTOK_API = "https://business-api.tiktok.com/open_api/v1.3"
const APP_ID = Deno.env.get("TIKTOK_APP_ID") || "7617705058569814033"
const APP_SECRET = Deno.env.get("TIKTOK_APP_SECRET") || ""
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || ""
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
const REDIRECT_URL = Deno.env.get("HAWKLAUNCH_URL") || "https://hawklaunch.vercel.app"

serve(async (req) => {
  const url = new URL(req.url)
  const authCode = url.searchParams.get("auth_code") || url.searchParams.get("code")
  const state = url.searchParams.get("state") || ""

  // state = "hl_<encoded-origin>" → extrai o origin do frontend que iniciou o OAuth
  let redirectBase = REDIRECT_URL
  if (state.startsWith("hl_")) {
    const origin = decodeURIComponent(state.slice(3))
    if (origin.startsWith("https://")) redirectBase = origin
  }

  if (!authCode) {
    return new Response("<html><body><h2>Erro: auth_code não recebido</h2></body></html>", {
      status: 400,
      headers: { "Content-Type": "text/html" },
    })
  }

  try {
    // Exchange auth_code for access_token
    const tokenRes = await fetch(`${TIKTOK_API}/oauth2/access_token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: APP_ID,
        secret: APP_SECRET,
        auth_code: authCode,
      }),
    })

    const tokenData = await tokenRes.json()

    if (tokenData.code !== 0) {
      return new Response(
        `<html><body><h2>Erro TikTok: ${tokenData.message}</h2></body></html>`,
        { status: 400, headers: { "Content-Type": "text/html" } }
      )
    }

    const { access_token, advertiser_ids } = tokenData.data

    // Save token to Supabase
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await supabase.from("tiktok_tokens").upsert({
        access_token,
        advertiser_ids,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" })
    }

    // Redirect back to HawkLaunch with token
    const redirectTo = `${redirectBase}/?connected=true&token=${encodeURIComponent(access_token)}&advertisers=${encodeURIComponent(JSON.stringify(advertiser_ids))}`

    return new Response(null, {
      status: 302,
      headers: { Location: redirectTo },
    })

  } catch (error) {
    return new Response(
      `<html><body><h2>Erro: ${error.message}</h2></body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    )
  }
})
