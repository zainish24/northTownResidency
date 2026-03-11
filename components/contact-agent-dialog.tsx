'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Phone, 
  MessageCircle, 
  Mail,
  Building2
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

export function ContactAgentDialog() {
  const [open, setOpen] = useState(false)
  const [phoneRevealed, setPhoneRevealed] = useState(false)
  const [settings, setSettings] = useState({
    logo_url: '',
    platform_name: 'NTR Properties',
    contact_phone: '+92 300 1234567',
    whatsapp_number: '923001234567'
  })

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }))
        }
      })
      .catch(err => console.error('Failed to load settings:', err))
  }, [])

  const handleRevealPhone = () => {
    setPhoneRevealed(true)
  }

  const handleWhatsApp = () => {
    const message = `Hi, I want to inquire about properties in North Town Residency`
    const whatsappNum = settings.whatsapp_number.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${whatsappNum}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleSMS = () => {
    const message = `Interested in NTR Properties`
    const phoneNum = settings.contact_phone.replace(/[^0-9+]/g, '')
    window.open(`sms:${phoneNum}?body=${encodeURIComponent(message)}`)
  }

  return (
    <>
      <Button 
        size="lg" 
        className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-slate-900 rounded-xl px-6 py-5 text-sm transition-all"
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        Contact Agent
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Agent</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
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
                <div className="text-sm text-muted-foreground">Property Consultant</div>
              </div>
            </div>

            <Separator />

            {!phoneRevealed ? (
              <Button 
                className="w-full gap-2" 
                size="lg"
                onClick={handleRevealPhone}
              >
                <Phone className="h-5 w-5" />
                Show Contact Number
              </Button>
            ) : (
              <div className="space-y-2">
                <a href={`tel:${settings.contact_phone}`} className="block">
                  <Button className="w-full gap-2" size="lg" variant="default">
                    <Phone className="h-5 w-5" />
                    {settings.contact_phone}
                  </Button>
                </a>
                <p className="text-xs text-center text-muted-foreground">
                  Tap to call directly
                </p>
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200" 
              size="lg"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="h-5 w-5" />
              Chat on WhatsApp
            </Button>

            <Button 
              variant="outline" 
              className="w-full gap-2" 
              size="lg"
              onClick={handleSMS}
            >
              <Mail className="h-4 w-4" />
              Send SMS
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
