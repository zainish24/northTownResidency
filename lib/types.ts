// Karachi Estates - Database Types

export interface Profile {
  id: string
  phone: string | null
  full_name: string | null
  avatar_url: string | null
  role: 'user' | 'admin'
  user_type: 'individual' | 'agent' | 'developer'
  agency_name: string | null
  is_blocked: boolean
  blocked_reason: string | null
  blocked_at: string | null
  created_at: string
  updated_at: string
}

export interface Area {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  is_popular: boolean
  is_active: boolean
  display_order: number
  created_at: string
}

export interface Developer {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  website: string | null
  phone: string | null
  email: string | null
  established_year: number | null
  is_verified: boolean
  is_featured: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined
  projects?: Project[]
  projects_count?: number
  listings_count?: number
}

export interface Project {
  id: string
  area_id: string | null
  developer_id: string | null
  name: string
  slug: string
  description: string | null
  image_url: string | null
  banner_url: string | null
  min_price: number | null
  max_price: number | null
  total_units: number | null
  completion_year: number | null
  project_status: 'upcoming' | 'ongoing' | 'completed'
  is_featured: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined
  area?: Area
  developer?: Developer
  listings_count?: number
}

export interface PropertyType {
  id: string
  name: string
  slug: string
  icon: string | null
  category: 'residential' | 'commercial' | 'industrial'
  is_active: boolean
  display_order: number
  created_at: string
}

export interface Amenity {
  id: string
  name: string
  slug: string
  icon: string | null
  category: 'general' | 'security' | 'utilities' | 'facilities' | 'outdoor' | 'lifestyle'
  is_active: boolean
  display_order: number
  created_at: string
}

export type ListingStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'sold' | 'rented' | 'expired'
export type PromotionPackage = 'free' | 'featured' | 'premium'
export type AreaUnit = 'sqft' | 'sqyd' | 'marla' | 'kanal'
export type Purpose = 'sale' | 'rent'
export type ConstructionStatus = 'empty' | 'under_construction' | 'completed'
export type PriceType = 'fixed' | 'negotiable'

export interface Listing {
  id: string
  user_id: string

  // Location
  area_id: string | null
  project_id: string | null
  address: string | null
  latitude: number | null
  longitude: number | null

  // Property Info
  property_type_id: string | null
  purpose: Purpose
  title: string
  description: string | null

  // Size
  area_size: number | null
  area_unit: AreaUnit

  // Price
  price: number
  price_type: PriceType

  // Details
  bedrooms: number | null
  bathrooms: number | null
  floors: number | null

  // Features
  is_corner: boolean
  is_road_facing: boolean
  is_park_facing: boolean
  is_west_open: boolean

  // Construction
  construction_status: ConstructionStatus

  // Status
  status: ListingStatus
  rejection_reason: string | null

  // Promotion
  is_featured: boolean
  promotion_package: PromotionPackage
  promotion_expires_at: string | null

  // Stats
  views_count: number
  saved_count: number

  created_at: string
  updated_at: string

  // Joined
  area?: Area
  project?: Project
  property_type?: PropertyType
  profile?: Profile
  images?: ListingImage[]
  listing_images?: ListingImage[]
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

export interface Favorite {
  user_id: string
  listing_id: string
  created_at: string
  listing?: Listing
}

export interface Lead {
  id: string
  listing_id: string
  sender_id: string | null
  sender_name: string
  sender_phone: string
  message: string | null
  is_read: boolean
  created_at: string
  listing?: Listing
}

export interface Ad {
  id: string
  title: string
  image_url: string
  link: string | null
  placement:
    | 'homepage_top' | 'homepage_featured' | 'homepage_bottom'
    | 'search_results_top' | 'search_results_sidebar'
    | 'listing_page_sidebar' | 'listing_page_bottom'
    | 'area_page_top' | 'developer_page_top' | 'project_page_top'
  target_type: 'global' | 'area' | 'developer' | 'project'
  target_id: string | null
  priority: number
  start_date: string | null
  end_date: string | null
  status: 'active' | 'inactive' | 'scheduled' | 'expired'
  clicks_count: number
  impressions_count: number
  created_at: string
  updated_at: string
}

export interface ListingPromotion {
  id: string
  listing_id: string
  package_type: 'featured' | 'premium'
  start_date: string
  end_date: string
  priority: number
  is_active: boolean
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
  admin?: Profile
}

export interface SiteSettings {
  platform_name: string
  tagline: string
  logo_url: string
  primary_color: string
  secondary_color: string
  contact_phone: string
  contact_email: string
  facebook_url: string
  instagram_url: string
  twitter_url: string
  whatsapp_number: string
}

// Filter types
export interface ListingFilters {
  area_id?: string
  project_id?: string
  property_type_id?: string
  purpose?: Purpose
  min_price?: number
  max_price?: number
  min_size?: number
  max_size?: number
  bedrooms?: number
  bathrooms?: number
  is_corner?: boolean
  is_road_facing?: boolean
  is_park_facing?: boolean
  is_west_open?: boolean
  construction_status?: ConstructionStatus
  status?: ListingStatus
  search?: string
  amenities?: string[]
}

// Form types
export interface ListingFormData {
  title: string
  description: string
  area_id: string
  project_id?: string
  address?: string
  property_type_id: string
  purpose: Purpose
  area_size?: number
  area_unit: AreaUnit
  price: number
  price_type: PriceType
  bedrooms?: number
  bathrooms?: number
  floors?: number
  is_corner: boolean
  is_road_facing: boolean
  is_park_facing: boolean
  is_west_open: boolean
  construction_status: ConstructionStatus
  amenity_ids?: string[]
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
