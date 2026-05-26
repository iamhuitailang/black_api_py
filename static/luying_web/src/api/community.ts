import request from '@/utils/request'
import type { ApiResponse, Post, Comment, ListResponse } from '@/types'

export const createPost = (userId: number, data: Partial<Post>): Promise<ApiResponse<Post>> => {
  return request.post('/community/post/create', data, { params: { user_id: userId } })
}

export const getPostList = (params?: { page?: number; page_size?: number; keyword?: string; user_id?: number; current_user_id?: number }): Promise<ApiResponse<ListResponse<Post>>> => {
  return request.get('/community/post/list', { params })
}

export const getPostDetail = (postId: number, currentUserId?: number): Promise<ApiResponse<Post>> => {
  return request.get(`/community/post/${postId}`, { params: { current_user_id: currentUserId } })
}

export const updatePost = (postId: number, data: Partial<Post>): Promise<ApiResponse<Post>> => {
  return request.put(`/community/post/${postId}`, data)
}

export const deletePost = (postId: number): Promise<ApiResponse<null>> => {
  return request.delete(`/community/post/${postId}`)
}

export const createComment = (userId: number, data: { post_id: number; content: string; parent_id?: number }): Promise<ApiResponse<Comment>> => {
  return request.post('/community/comment', data, { params: { user_id: userId } })
}

export const getComments = (postId: number): Promise<ApiResponse<Comment[]>> => {
  return request.get(`/community/comment/list/${postId}`)
}

export const deleteComment = (commentId: number): Promise<ApiResponse<null>> => {
  return request.delete(`/community/comment/${commentId}`)
}

export const toggleLike = (postId: number, userId: number): Promise<ApiResponse<{ is_liked: boolean }>> => {
  return request.post('/community/like', null, { params: { post_id: postId, user_id: userId } })
}

export const toggleFollow = (followingId: number, userId: number): Promise<ApiResponse<{ is_following: boolean }>> => {
  return request.post('/community/follow', null, { params: { following_id: followingId, user_id: userId } })
}

export const getFollowers = (userId: number): Promise<ApiResponse<User[]>> => {
  return request.get(`/community/follow/followers/${userId}`)
}

export const getFollowing = (userId: number): Promise<ApiResponse<User[]>> => {
  return request.get(`/community/follow/following/${userId}`)
}
