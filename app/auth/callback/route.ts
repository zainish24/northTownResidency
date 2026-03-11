import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL('/auth/login?error=auth_failed', requestUrl.origin))
    }

    if (data.session) {
      // Session successfully created
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // No code or session failed
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
}
