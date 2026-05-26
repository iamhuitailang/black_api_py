export interface User {
  id: number
  username: string
  nickname: string
  email: string
  phone: string
  role: string
  avatar: string
  status: number
  created_at: string
}

export interface Movie {
  id: number
  title: string
  poster: string
  description: string
  duration: number
  genre: string
  director: string
  actors: string
  language: string
  rating: number
  trailer_url: string
  status: number
  release_date: string
  avg_rating: number
  review_count: number
  status_text: string
  created_at: string
  updated_at: string
}

export interface Showtime {
  id: number
  movie_id: number
  hall_name: string
  show_date: string
  show_time: string
  price: number
  total_seats: number
  available_seats: number
  seat_layout: string
  status: number
  status_text: string
  movie_title: string
  movie_poster: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
  order_no: string
  user_id: number
  showtime_id: number
  seats: string[]
  total_amount: number
  status: number
  status_text: string
  pay_time: string
  cancel_time: string
  verified_at: string
  created_at: string
  updated_at: string
  showtime?: {
    hall_name: string
    show_date: string
    show_time: string
    price: number
  }
  movie?: {
    title: string
    poster: string
  }
  user?: {
    username: string
    nickname: string
  }
}

export interface Review {
  id: number
  user_id: number
  movie_id: number
  rating: number
  content: string
  created_at: string
  updated_at: string
  user?: {
    username: string
    nickname: string
    avatar: string
  }
  movie?: {
    title: string
    poster: string
  }
}

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface Statistics {
  total_users: number
  total_movies: number
  showing_movies: number
  coming_movies: number
  total_showtimes: number
  total_orders: number
  paid_orders: number
  verified_orders: number
  total_reviews: number
  today_revenue: number
  total_revenue: number
}