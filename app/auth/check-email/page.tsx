'use client'

import Link from 'next/link'
import { Building2, Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4 py-8">
      <Link href="/" className="flex items-center gap-2 mb-8 group">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-blue-600 text-white shadow-lg">
          <Building2 className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold leading-none text-slate-900">Karachi Estates</span>
          <span className="text-xs text-slate-500">Karachi Real Estate</span>
        </div>
      </Link>

      <Card className="w-full max-w-md border-0 shadow-xl rounded-2xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600" />
        
        <CardHeader className="text-center pt-8">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Check Your Email</CardTitle>
          <CardDescription className="text-slate-500">
            We've sent you a magic link to sign in
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-8 text-center space-y-4">
          <p className="text-sm text-slate-600">
            Click the link in your email to complete your sign up. The link will expire in 1 hour.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 text-left">
            <p className="text-xs font-medium text-slate-700 mb-2">Didn't receive the email?</p>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Check your spam folder</li>
              <li>• Make sure you entered the correct email</li>
              <li>• Wait a few minutes and try again</li>
            </ul>
          </div>

          <Link href="/auth/signup">
            <Button variant="outline" className="w-full rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sign Up
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
