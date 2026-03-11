import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return undefined
          const cookie = document.cookie.split('; ').find(row => row.startsWith(name + '='))
          return cookie ? decodeURIComponent(cookie.split('=')[1]) : undefined
        },
        set(name: string, value: string, options: any) {
          if (typeof document === 'undefined') return
          const maxAge = options?.maxAge || 31536000 // 1 year default
          const isLocalhost = window.location.hostname === 'localhost'
          const secure = isLocalhost ? '' : '; secure'
          document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax${secure}`
        },
        remove(name: string, options: any) {
          if (typeof document === 'undefined') return
          document.cookie = `${name}=; path=/; max-age=0; samesite=lax`
        }
      }
    }
  )
}
