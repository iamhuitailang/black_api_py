import type { Project, ApiResponse, ProjectListData, AddProjectRequest, UpdateProjectRequest, BatchDeleteRequest } from '@/types'

const API_BASE = '/api'

async function request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  return response.json()
}

export const api = {
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
