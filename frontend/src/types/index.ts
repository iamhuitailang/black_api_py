export interface User {
  id: number
  username: string
  role: 'resident' | 'staff' | 'admin'
  real_name?: string
  community?: string
  status?: number
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface Category {
  key: string
  name: string
}

export interface Staff {
  id: number
  username: string
  real_name: string
  community?: string
}

export type OpinionStatus = 'pending' | 'claimed' | 'processing' | 'resolved' | 'escalated' | 'closed'
export type OpinionCategory = 'environment' | 'security' | 'facility' | 'other'

export interface Opinion {
  id: number
  title: string
  category: OpinionCategory
  category_name: string
  description: string
  photos: string[]
  status: OpinionStatus
  status_name: string
  submitter_id: number
  submitter_name?: string
  community?: string
  handler_id?: number
  handler_name?: string
  escalated: number
  assigned_at?: string
  claimed_at?: string
  resolved_at?: string
  closed_at?: string
  response_days?: number
  rating?: number
  is_public: number
  supervision_id?: number
  created_at: string
  updated_at: string
}

export interface Timeline {
  id: number
  opinion_id: number
  type: string
  type_name: string
  content?: string
  operator_id?: number
  operator_name?: string
  photos: string[]
  created_at: string
}

export interface Rating {
  id: number
  opinion_id: number
  rating: number
  comment?: string
  rater_id: number
  rater_name?: string
  created_at: string
}

export interface PaginatedList<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface Statistics {
  summary: {
    total: number
    resolved: number
    resolved_rate: number
    avg_rating: number
    avg_response_days: number
  }
  category: Record<string, { count: number; name: string }>
  status: Record<string, { count: number; name: string }>
  monthly: Array<{ month: string; count: number; avg_response_days?: number }>
  rating: Record<string, number>
}

export interface MonthlyReport {
  year: number
  month: number
  summary: {
    total: number
    resolved: number
    resolved_rate: number
    avg_response_days: number
    avg_rating: number
  }
  category: Record<string, { count: number; name: string }>
  rating: Record<string, number>
}
