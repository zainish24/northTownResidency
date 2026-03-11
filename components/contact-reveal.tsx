'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Phone, 
  MessageCircle, 
  Mail, 
  Share2, 
  Building2,
  Copy,
  Facebook,
  Twitter
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ContactRevealProps {
  listingId: string
  listingTitle: string
  listingPrice: string
}

export function ContactReveal({ listingId, listingTitle, listingPrice }: ContactRevealProps) {
  const [phoneRevealed, setPhoneRevealed] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [settings, setSettings] = useState({
    logo_url: '',
    platform_name: 'NTR Properties',
    contact_phone: '+92 300 1234567',
    whatsapp_number: '923001234567'
  })

  useEffect(() => {
    // Fetch site settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }))
        }
      })
      .catch(err => console.error('Failed to load settings:', err))
  }, [])

  const handleRevealPhone = async () => {
    setPhoneRevealed(true)
    // Track phone reveal
    // TODO: Increment contact_views in database
  }

  const handleWhatsApp = () => {
    const message = `Hi, I'm interested in: ${listingTitle} - ${listingPrice}`
    const whatsappNum = settings.whatsapp_number.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${whatsappNum}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleSMS = () => {
    const message = `Interested in: ${listingTitle}`
    const phoneNum = settings.contact_phone.replace(/[^0-9+]/g, '')
    window.open(`sms:${phoneNum}?body=${encodeURIComponent(message)}`)
  }

  const handleShare = (platform: string) => {
    const url = window.location.href
    const text = `Check out this property: ${listingTitle}`
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')
        break
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
        break
      case 'copy':
        navigator.clipboard.writeText(url)
        alert('Link copied to clipboard!')
        break
    }
  }

  return (
    <>
      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle>Contact Seller</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt={settings.platform_name} className="w-8 h-8 object-contain" />
              ) : (
                <Building2 className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <div className="font-semibold">{settings.platform_name}</div>
              <div className="text-sm text-muted-foreground">Property Listing</div>
            </div>
          </div>

          <Separator />

          {/* Phone Reveal */}
          {!phoneRevealed ? (
            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={handleRevealPhone}
              type="button"
            >
              <Phone className="h-5 w-5" />
              Show Contact Number
            </Button>
          ) : (
            <div className="space-y-2">
              <a href={`tel:${settings.contact_phone}`} className="block">
                <Button className="w-full gap-2" size="lg" variant="default" type="button">
                  <Phone className="h-5 w-5" />
                  {settings.contact_phone}
                </Button>
              </a>
              <p className="text-xs text-center text-muted-foreground">
                Tap to call directly
              </p>
            </div>
          )}

          {/* WhatsApp */}
          <Button 
            variant="outline" 
            className="w-full gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200" 
            size="lg"
            onClick={handleWhatsApp}
            type="button"
          >
            <MessageCircle className="h-5 w-5" />
            Chat on WhatsApp
          </Button>

          {/* SMS */}
          <Button 
            variant="outline" 
            className="w-full gap-2" 
            size="lg"
            onClick={handleSMS}
            type="button"
          >
            <Mail className="h-4 w-4" />
            Send SMS
          </Button>

          {/* Share */}
          <Button 
            variant="ghost" 
            className="w-full gap-2"
            onClick={() => setShareDialogOpen(true)}
            type="button"
          >
            <Share2 className="h-4 w-4" />
            Share Property
          </Button>
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share this property</DialogTitle>
            <DialogDescription>
              Share this listing with your friends and family
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Button
              variant="outline"
              className="gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              onClick={() => handleShare('whatsapp')}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              className="gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              onClick={() => handleShare('facebook')}
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </Button>
            <Button
              variant="outline"
              className="gap-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200"
              onClick={() => handleShare('twitter')}
            >
              <Twitter className="h-4 w-4" />
              Twitter
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleShare('copy')}
            >
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
