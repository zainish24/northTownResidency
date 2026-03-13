import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    
    const { data: listing, error } = await supabase
      .from('listings')
      .insert({ ...body, status: 'pending' })
      .select()
      .single()
    
    if (error) throw error

    // optional amenities
    if (body.amenity_ids && Array.isArray(body.amenity_ids) && listing?.id) {
      const rows = body.amenity_ids.map((id: string) => ({ listing_id: listing.id, amenity_id: id }))
      await supabase.from('listing_amenities').insert(rows)
    }
    
    return NextResponse.json({ listing })
  } catch (error: any) {
    console.error('Submit error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
