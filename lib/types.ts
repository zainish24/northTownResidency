// North Town Residency - Database Types

export interface Profile {
  id: string
  phone: string | null
  full_name: string | null
  role: 'user' | 'admin'
  is_blocked: boolean
  created_at: string
  updated_at: string
}

export interface Phase {
  id: string
  name: string
  location: string | null
  description: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export interface Block {
  id: string
  phase_id: string
  name: string
  block_type: 'residential' | 'commercial' | 'mixed'
  description: string | null
  is_active: boolean
  created_at: string
  // Joined data
  phase?: Phase
}

export type PropertyType = 'residential_plot' | 'commercial_shop'
export type ListingType = 'sale' | 'rent'
export type ListingStatus = 'pending' | 'approved' | 'rejected' | 'sold'
export type ConstructionStatus = 'empty' | 'under_construction' | 'completed'
export type PriceType = 'fixed' | 'negotiable'

export interface Amenity {
  id: string
  name: string
  slug: string
  category: 'general' | 'security' | 'utilities' | 'facilities' | 'outdoor' | 'lifestyle'
  icon: string
  is_active: boolean
  display_order: number
  created_at: string
}

export interface Listing {
  id: string
  user_id: string
  title: string
  description: string | null
  phase_id: string
  block_id: string
  property_type: PropertyType
  listing_type: ListingType
  // Size
  plot_size_sqyd: number | null
  shop_size_sqft: number | null
  // Price
  price: number
  price_type: PriceType
  // Features (for built properties)
  bedrooms: number | null
  bathrooms: number | null
  // Position features
  is_corner: boolean
  is_road_facing: boolean
  is_park_facing: boolean
  is_west_open: boolean
  // Construction
  has_construction: boolean
  construction_status: ConstructionStatus
  // Address
  address_details: string | null
  // Status
  status: ListingStatus
  rejection_reason: string | null
  is_featured: boolean
  views_count: number
  // Timestamps
  created_at: string
  updated_at: string
  // Joined data
  phase?: Phase
  block?: Block
  images?: ListingImage[]
  profile?: Profile
  // amenities join (optional)
  listing_amenities?: Array<{ amenity: Amenity }>
}

export interface ListingImage {
  id: string
  listing_id: string
  image_url: string
  is_primary: boolean
  display_order: number
  created_at: string
}

export interface ActivityLog {
  id: string
  admin_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
  // Joined
  admin?: Profile
}

// Filter types for listings
export interface ListingFilters {
  phase_id?: string
  block_id?: string
  property_type?: PropertyType
  listing_type?: ListingType
  min_price?: number
  max_price?: number
  min_size?: number
  max_size?: number
  is_corner?: boolean
  is_road_facing?: boolean
  is_park_facing?: boolean
  is_west_open?: boolean
  has_construction?: boolean
  construction_status?: ConstructionStatus
  status?: ListingStatus
  search?: string
  amenities?: string[]
}

// Form types
export interface ListingFormData {
  title: string
  description: string
  phase_id: string
  block_id: string
  property_type: PropertyType
  listing_type: ListingType
  plot_size_sqyd?: number
  shop_size_sqft?: number
  price: number
  price_type: PriceType
  bedrooms?: number
  bathrooms?: number
  is_corner: boolean
  is_road_facing: boolean
  is_park_facing: boolean
  is_west_open: boolean
  has_construction: boolean
  construction_status: ConstructionStatus
  address_details?: string
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
