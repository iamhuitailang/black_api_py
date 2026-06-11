import type { Project, ApiResponse, ProjectListData, AddProjectRequest, UpdateProjectRequest, BatchDeleteRequest } from '@/types'

const API_BASE = '/api'
const TOKEN_KEY = 'auth_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  })
  if (response.status === 401) {
    clearToken()
    window.location.href = '/login'
    return { code: 401, message: 'Unauthorized', data: null as any }
  }
  return response.json()
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; user: { id: number; username: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () =>
    request<null>('/auth/logout', {
      method: 'POST',
    }),

  checkAuth: () =>
    request<{ id: number; username: string }>('/auth/current/user/get'),

  addProject: (data: AddProjectRequest) =>
    request<Project>('/projects/add', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProjects: (params?: { search?: string; language?: string; priority?: string; tag?: string }) => {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search)
    if (params?.language) query.append('language', params.language)
    if (params?.priority) query.append('priority', params.priority)
    if (params?.tag) query.append('tag', params.tag)
    const url = params ? `/projects/list/get?${query.toString()}` : '/projects/list/get'
    return request<ProjectListData>(url)
  },

  getLanguages: () => request<string[]>('/projects/languages/get'),

  getRandomProject: () => request<Project>('/projects/random/get'),

  updateProject: (data: UpdateProjectRequest) =>
    request<Project>('/projects/update/put', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProject: (id: number) =>
    request<null>(`/projects/delete/delete?id=${id}`, {
      method: 'DELETE',
    }),

  batchDelete: (ids: number[]) =>
    request<{ deleted_count: number }>('/projects/batchdelete', {
      method: 'POST',
      body: JSON.stringify({ ids } as BatchDeleteRequest),
    }),
}
