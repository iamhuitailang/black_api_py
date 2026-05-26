import { get, post, type ApiResult } from './request'

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  color?: string
  sort?: number
  post_count?: number
  created_at?: string
}

export interface Tag {
  id: number
  name: string
  slug: string
  color?: string
  post_count?: number
  created_at?: string
}

export interface Post {
  id: number
  user_id: number
  title: string
  slug?: string
  summary?: string
  content?: string
  cover?: string
  category_id?: number
  category?: Category | null
  tags?: Tag[]
  status: number
  is_top?: number
  view_count?: number
  comment_count?: number
  like_count?: number
  published_at?: string
  created_at?: string
  updated_at?: string
  author?: { id: number; username: string; nickname?: string; avatar?: string }
}

export interface PagedResult<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export const postApi = {
  list: (params?: Record<string, unknown>) =>
    get<PagedResult<Post>>('/blog/post/list/get', params),
  detail: (id: number) => get<Post>('/blog/post/detail/get', { id }),
  create: (payload: Record<string, unknown>) => post<Post>('/blog/post/create', payload),
  update: (payload: Record<string, unknown>) => post<Post>('/blog/post/update', payload),
  delete: (id: number) => post('/blog/post/delete', { id }),
  publish: (id: number) => post<Post>('/blog/post/publish', { id }),
  like: (id: number) => post('/blog/post/like', { id })
}

export const categoryApi = {
  list: (params?: Record<string, unknown>) => get<PagedResult<Category>>('/blog/category/list/get', params),
  all: () => get<Category[]>('/blog/category/all/get'),
  create: (payload: Record<string, unknown>) => post<Category>('/blog/category/create', payload),
  update: (payload: Record<string, unknown>) => post<Category>('/blog/category/update', payload),
  delete: (id: number) => post('/blog/category/delete', { id })
}

export const tagApi = {
  list: (params?: Record<string, unknown>) => get<PagedResult<Tag>>('/blog/tag/list/get', params),
  all: () => get<Tag[]>('/blog/tag/all/get'),
  create: (payload: Record<string, unknown>) => post<Tag>('/blog/tag/create', payload),
  update: (payload: Record<string, unknown>) => post<Tag>('/blog/tag/update', payload),
  delete: (id: number) => post('/blog/tag/delete', { id })
}

export const searchApi = {
  posts: (keyword: string, params?: Record<string, unknown>) =>
    get<PagedResult<Post>>('/blog/search/posts', { keyword, ...params })
}

export const shareApi = {
  generate: (payload: Record<string, unknown>) =>
    post<Record<string, string>>('/blog/share/generate', payload)
}
