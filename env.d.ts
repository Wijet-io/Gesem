/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    readonly VITE_JIBBLE_API_KEY: string
    readonly VITE_JIBBLE_API_SECRET: string
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }