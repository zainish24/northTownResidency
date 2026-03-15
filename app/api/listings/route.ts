import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const area_id = searchParams.get('area_id')
    const project_id = searchParams.get('project_id')
    const property_type_id = searchParams.get('property_type_id')
    const purpose = searchParams.get('purpose')
    const min_price = searchParams.get('min_price')
    const max_price = searchParams.get('max_price')
    const bedrooms = searchParams.get('bedrooms')
    const is_corner = searchParams.get('is_corner')
    const is_park_facing = searchParams.get('is_park_facing')
    const is_road_facing = searchParams.get('is_road_facing')
    const is_west_open = searchParams.get('is_west_open')
    const construction_status = searchParams.get('construction_status')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'newest'
    const featured = searchParams.get('featured')
    const status = searchParams.get('status') || 'approved'

    const supabase = await createClient()
    let query = supabase
      .from('listings')
      .select(`
        *,
        area:areas(id,name,slug),
        project:projects(id,name,slug),
        property_type:property_types(id,name,slug,icon),
        listing_images(id,image_url,is_primary,display_order)
      `)
      .eq('status', status)

    if (area_id) query = query.eq('area_id', area_id)
    if (project_id) query = query.eq('project_id', project_id)
    if (property_type_id) query = query.eq('property_type_id', property_type_id)
    if (purpose) query = query.eq('purpose', purpose)
    if (min_price) query = query.gte('price', parseFloat(min_price))
    if (max_price) query = query.lte('price', parseFloat(max_price))
    if (bedrooms) query = query.eq('bedrooms', parseInt(bedrooms))
    if (is_corner === 'true') query = query.eq('is_corner', true)
    if (is_park_facing === 'true') query = query.eq('is_park_facing', true)
    if (is_road_facing === 'true') query = query.eq('is_road_facing', true)
    if (is_west_open === 'true') query = query.eq('is_west_open', true)
    if (construction_status) query = query.eq('construction_status', construction_status)
    if (featured === 'true') query = query.eq('is_featured', true)
    if (search) query = query.ilike('title', `%${search}%`)

    if (sort === 'price_asc') query = query.order('price', { ascending: true })
    else if (sort === 'price_desc') query = query.order('price', { ascending: false })
    else query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false })

    const { count } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)

    const { data, error } = await query.range((page - 1) * limit, page * limit - 1)
    if (error) throw error

    return NextResponse.json({
      data,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { amenity_ids, ...listingData } = body

    const { data: listing, error } = await supabase
      .from('listings')
      .insert({ ...listingData, user_id: user.id, status: 'pending' })
      .select()
      .single()

    if (error) throw error

    if (amenity_ids?.length) {
      await supabase.from('listing_amenities').insert(
        amenity_ids.map((id: string) => ({ listing_id: listing.id, amenity_id: id }))
      )
    }

    return NextResponse.json({ data: listing }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
