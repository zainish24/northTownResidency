import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const listingId = formData.get('listing_id') as string
    const userId = formData.get('user_id') as string
    const files = formData.getAll('images') as File[]
    
    console.log('Upload API called')
    console.log('Listing ID:', listingId)
    console.log('User ID:', userId)
    console.log('Files count:', files.length)
    
    const supabase = await createClient()
    const uploadedImages = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`Processing file ${i}:`, file.name, file.size)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}-${i}.${fileExt}`
      
      console.log('Uploading to:', fileName)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file)
      
      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }
      
      console.log('Upload success:', uploadData.path)
      
      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(uploadData.path)
      
      console.log('Public URL:', publicUrl)
      
      const { error: linkError } = await supabase.from('listing_images').insert({
        listing_id: listingId,
        image_url: publicUrl,
        is_primary: i === 0,
        display_order: i,
      })
      
      if (linkError) {
        console.error('Link error:', linkError)
      } else {
        uploadedImages.push(publicUrl)
        console.log('Image linked successfully')
      }
    }
    
    console.log('Total uploaded:', uploadedImages.length)
    return NextResponse.json({ success: true, images: uploadedImages })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
