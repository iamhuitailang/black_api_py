export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface User {
  id: number
  username: string
  nickname: string
  avatar?: string
  email?: string
  phone?: string
  bio?: string
  role: string
  status: number
  created_at?: string
}

export interface UserLogin {
  username: string
  password: string
}

export interface UserRegister {
  username: string
  password: string
  nickname?: string
  email?: string
}

export interface CampingPlan {
  id: number
  user_id: number
  title: string
  destination?: string
  start_date?: string
  end_date?: string
  description?: string
  cover_image?: string
  status: number
  is_template: boolean
  items: PlanItem[]
  created_at?: string
  updated_at?: string
}

export interface PlanItem {
  id: number
  name: string
  category?: string
  quantity: number
  is_checked: boolean
}

export interface Equipment {
  id: number
  user_id: number
  name: string
  category?: string
  brand?: string
  model?: string
  weight?: number
  price?: number
  purchase_date?: string
  image?: string
  description?: string
  condition: string
  is_public: boolean
  created_at?: string
  updated_at?: string
}

export interface Campsite {
  id: number
  name: string
  location?: string
  latitude?: number
  longitude?: number
  description?: string
  cover_image?: string
  images?: string
  facilities?: string
  best_season?: string
  difficulty?: string
  price_info?: string
  tips?: string
  view_count: number
  status: number
  is_favorited?: boolean
  created_at?: string
}

export interface Review {
  id: number
  campsite_id: number
  user_id: number
  username?: string
  nickname?: string
  avatar?: string
  rating: number
  content?: string
  images?: string
  created_at?: string
}

export interface Post {
  id: number
  user_id: number
  username?: string
  nickname?: string
  avatar?: string
  title: string
  content?: string
  images?: string
  location?: string
  view_count: number
  like_count: number
  comment_count: number
  is_liked?: boolean
  status: number
  created_at?: string
  updated_at?: string
}

export interface Comment {
  id: number
  post_id: number
  user_id: number
  username?: string
  nickname?: string
  avatar?: string
  content: string
  parent_id?: number
  created_at?: string
}

export interface PaginationParams {
  page?: number
  page_size?: number
}

export interface ListResponse<T> {
  total: number
  items: T[]
}

export interface Statistics {
  user_count: number
  plan_count: number
  equipment_count: number
  campsite_count: number
  post_count: number
  recent_users: User[]
  recent_posts: Post[]
  daily_stats: DailyStat[]
}

export interface DailyStat {
  date: string
  new_users: number
  new_posts: number
  new_plans: number
}
