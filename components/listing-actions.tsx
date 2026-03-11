'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Heart, Share2, Eye, MessageCircle, Facebook, Twitter, Copy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ListingActionsProps {
  listingId: string
  listingTitle: string
  listingPrice: string
  viewsCount: number
}

export function ListingActions({ listingId, listingTitle, listingPrice, viewsCount }: ListingActionsProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  useEffect(() => {
    const checkSaved = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setUserId(null)
        return
      }
      
      setUserId(user.id)
      
      const { data } = await supabase
        .from('saved_listings')
        .select('id')
        .eq('user_id', user.id)
        .eq('listing_id', listingId)
        .single()
      
      setIsSaved(!!data)
    }
    
    checkSaved()
  }, [listingId])

  const handleSave = async () => {
    if (!userId) {
      alert('Please login to save listings')
      window.location.href = '/auth/login'
      return
    }
    
    console.log('Saving listing:', listingId, 'for user:', userId)
    setIsLoading(true)
    const supabase = createClient()
    
    try {
      if (isSaved) {
        // Unsave
        console.log('Unsaving listing...')
        const { error } = await supabase
          .from('saved_listings')
          .delete()
          .eq('user_id', userId)
          .eq('listing_id', listingId)
        
        if (error) {
          console.error('Error unsaving:', error)
        } else {
          console.log('Successfully unsaved')
          setIsSaved(false)
        }
      } else {
        // Save
        console.log('Saving listing...')
        const { data, error } = await supabase
          .from('saved_listings')
          .insert({ user_id: userId, listing_id: listingId })
        
        if (error) {
          console.error('Error saving:', error)
        } else {
          console.log('Successfully saved:', data)
          setIsSaved(true)
        }
      }
    } catch (error) {
      console.error('Error saving listing:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = (platform: string) => {
    const url = `${window.location.origin}/listings/${listingId}`
    const text = `Check out this property: ${listingTitle} - ${listingPrice}`
    
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
        setShareDialogOpen(false)
        break
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className={`gap-1 text-xs ${isSaved ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : ''}`}
          onClick={handleSave}
          disabled={isLoading}
        >
          <Heart className={`h-3 w-3 ${isSaved ? 'fill-red-600' : ''}`} />
          {isLoading ? '...' : isSaved ? 'Saved' : 'Save'}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1 text-xs"
          onClick={() => setShareDialogOpen(true)}
        >
          <Share2 className="h-3 w-3" />
          Share
        </Button>
        <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
          <Eye className="h-3 w-3" />
          {viewsCount} views
        </span>
      </div>

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
