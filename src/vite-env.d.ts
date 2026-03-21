/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_TIKTOK_APP_ID: string
  readonly VITE_TIKTOK_REDIRECT_URI: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
