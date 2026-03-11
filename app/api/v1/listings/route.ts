import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const phaseId = searchParams.get('phase_id')
    const blockId = searchParams.get('block_id')
    const propertyType = searchParams.get('property_type')
    const listingType = searchParams.get('listing_type')
    const minPrice = searchParams.get('min_price')
    const maxPrice = searchParams.get('max_price')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    const supabase = await createClient()
    
    let query = supabase
      .from('listings')
      .select(`
        *,
        phase:phases(id, name, location),
        block:blocks(id, name, block_type),
        images:listing_images(*)
      `, { count: 'exact' })
      .eq('status', 'approved')

    if (phaseId) query = query.eq('phase_id', phaseId)
    if (blockId) query = query.eq('block_id', blockId)
    if (propertyType) query = query.eq('property_type', propertyType)
    if (listingType) query = query.eq('listing_type', listingType)
    if (minPrice) query = query.gte('price', parseFloat(minPrice))
    if (maxPrice) query = query.lte('price', parseFloat(maxPrice))
    if (search) query = query.ilike('title', `%${search}%`)

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: listings, error, count } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      data: listings,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_blocked')
      .eq('id', user.id)
      .single()

    if (profile?.is_blocked) {
      return NextResponse.json({ error: 'Account is blocked' }, { status: 403 })
    }

    const body = await request.json()

    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        user_id: user.id,
        ...body,
        status: 'pending',
        views_count: 0,
        is_featured: false
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: listing }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
