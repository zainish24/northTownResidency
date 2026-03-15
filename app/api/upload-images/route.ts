import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const listingId = formData.get('listing_id') as string
    const userId = formData.get('user_id') as string
    const files = formData.getAll('images') as File[]

    if (!listingId || !userId || !files.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()
    const uploadedImages: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}-${i}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file)

      if (uploadError) continue

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(uploadData.path)

      const { error: linkError } = await supabase.from('listing_images').insert({
        listing_id: listingId,
        image_url: publicUrl,
        is_primary: i === 0,
        display_order: i,
      })

      if (!linkError) uploadedImages.push(publicUrl)
    }

    return NextResponse.json({ success: true, images: uploadedImages })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
