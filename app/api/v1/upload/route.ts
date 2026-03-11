import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const listingId = formData.get('listing_id') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (listingId) {
      const { data: listing } = await supabase
        .from('listings')
        .select('user_id')
        .eq('id', listingId)
        .single()

      if (!listing || listing.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(uploadData.path)

    if (listingId) {
      const { data: images } = await supabase
        .from('listing_images')
        .select('id')
        .eq('listing_id', listingId)

      await supabase.from('listing_images').insert({
        listing_id: listingId,
        image_url: publicUrl,
        is_primary: !images || images.length === 0,
        display_order: images ? images.length : 0
      })
    }

    return NextResponse.json({ 
      data: { 
        url: publicUrl,
        path: uploadData.path 
      } 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
