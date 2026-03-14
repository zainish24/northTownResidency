import type { Metadata, Viewport } from 'next'
import { Inter, Merriweather } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/auth-provider'
import { ProgressBar } from '@/components/progress-bar'
import { DynamicFavicon } from '@/components/dynamic-favicon'
import { createClient } from '@/lib/supabase/server'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
})

const merriweather = Merriweather({ 
  subsets: ['latin'], 
  weight: ['300', '400', '700', '900'], 
  variable: '--font-serif',
  display: 'swap',
})

async function getSiteSettings() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['platform_name', 'meta_title', 'meta_description', 'logo_url', 'favicon_url'])
    
    const settings: Record<string, string> = {}
    data?.forEach((s: any) => { settings[s.setting_key] = s.setting_value })
    return settings
  } catch {
    return {}
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  
  const siteName = settings.platform_name || 'Karachi Estates'
  const siteUrl = 'https://karachiestates.com'
  const description = settings.meta_description || 'Buy, sell, and rent properties in Karachi. Premium real estate marketplace.'
  const logoUrl = settings.logo_url || '/logo.png'
  const faviconUrl = settings.favicon_url || '/logo.png'
  const metaTitle = settings.meta_title || siteName

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: metaTitle,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: [
      'Karachi property',
      'plots for sale',
      'commercial shops',
      'real estate',
      'property investment',
      'Karachi real estate',
      'residential plots',
      'commercial property'
    ],
    authors: [{ name: siteName, url: siteUrl }],
    creator: siteName,
    publisher: siteName,
    formatDetection: { email: false, address: false, telephone: false },
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: siteName,
    },
    openGraph: {
      type: 'website',
      locale: 'en_PK',
      siteName,
      title: siteName,
      description,
      url: siteUrl,
      images: [{ url: logoUrl, width: 1200, height: 630, alt: siteName }],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description,
      images: [logoUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    category: 'real estate',
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#10b981' }, // Emerald 500
    { media: '(prefers-color-scheme: dark)', color: '#1e293b' }, // Slate 800
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: 'light dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${merriweather.variable}`} 
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect to important domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />

        {/* Favicon - default, DynamicFavicon will override from DB */}
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="shortcut icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body 
        className="font-sans antialiased min-h-screen bg-background text-foreground scroll-smooth" 
        suppressHydrationWarning
      >
        {/* Theme Provider for dark/light mode */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {/* Auth Provider for user session */}
          <AuthProvider>
            {/* Dynamic Favicon */}
            <DynamicFavicon />
            
            {/* Progress Bar for navigation */}
            <ProgressBar />
            
            {/* Main Content */}
            {children}
            
            {/* Toast Notifications */}
            <Toaster 
              richColors 
              position="top-right"
              closeButton
              theme="light"
            />
            
            {/* Vercel Analytics */}
            <Analytics />
            
            {/* Vercel Speed Insights */}
            <SpeedInsights />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}