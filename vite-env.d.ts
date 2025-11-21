interface ImportMetaEnv {
  readonly VITE_USE_API: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_API_URL: string
  readonly VITE_VENDOR_PASSWORD: string
  readonly VITE_ENABLE_GUEST_LOGIN: string
  readonly DEV: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
