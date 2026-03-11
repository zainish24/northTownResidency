import type { Metadata, Viewport } from 'next'
import { Inter, Merriweather } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/auth-provider'
import { ProgressBar } from '@/components/progress-bar'
import { DynamicFavicon } from '@/components/dynamic-favicon'
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

export const metadata: Metadata = {
  metadataBase: new URL('https://ntrproperties.com'),
  title: {
    default: 'NTR Properties - North Town Residency Karachi',
    template: '%s | NTR Properties',
  },
  description: 'Buy, sell, and rent properties in North Town Residency Karachi. Find residential plots, commercial shops in Phase 1, 2, and 4. Premium real estate marketplace.',
  keywords: [
    'North Town Residency', 
    'Karachi property', 
    'plots for sale', 
    'commercial shops', 
    'NTR Karachi', 
    'real estate',
    'property investment',
    'Karachi real estate',
    'housing scheme',
    'residential plots',
    'commercial property'
  ],
  authors: [{ name: 'NTR Properties', url: 'https://ntrproperties.com' }],
  creator: 'NTR Properties',
  publisher: 'NTR Properties',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NTR Properties',
    startupImage: [
      '/icons/apple-splash-2048-2732.jpg',
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    siteName: 'NTR Properties',
    title: 'NTR Properties - North Town Residency Karachi',
    description: 'Buy, sell, and rent properties in North Town Residency Karachi',
    url: 'https://ntrproperties.com',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'NTR Properties - North Town Residency Karachi',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NTR Properties - North Town Residency Karachi',
    description: 'Buy, sell, and rent properties in North Town Residency Karachi',
    images: ['/twitter-image.jpg'],
    creator: '@ntrproperties',
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
  verification: {
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code',
  },
  category: 'real estate',
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
        
        {/* Preload critical assets */}
        <link 
          rel="preload" 
          href="/logo.png" 
          as="image" 
          type="image/png"
        />
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