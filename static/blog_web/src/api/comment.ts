import { get, post, del } from './request'

export interface Comment {
  id: number
  post_id: number
  user_id: number
  parent_id?: number | null
  nickname?: string
  email?: string
  content: string
  status: number
  like_count?: number
  created_at?: string
  replies?: Comment[]
  user?: { id: number; username: string; nickname?: string; avatar?: string }
}

export const commentApi = {
  list: (postId: number, params?: Record<string, unknown>) =>
    get<any>('/blog/comment/list/get', { post_id: postId, ...params }),
  create: (payload: Record<string, unknown>) =>
    post<Comment>('/blog/comment/create', payload),
  delete: (id: number) => post('/blog/comment/delete', { id }),
  like: (id: number) => post('/blog/comment/like', { id })
}
