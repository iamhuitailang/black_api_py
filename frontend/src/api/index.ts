import type {
  ApiResponse,
  User,
  Category,
  Staff,
  Opinion,
  Timeline,
  Rating,
  PaginatedList,
  Statistics,
  MonthlyReport
} from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

function getToken(): string {
  return localStorage.getItem('token') || ''
}

function setToken(token: string) {
  localStorage.setItem('token', token)
}

function clearToken() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

function setUser(user: User) {
  localStorage.setItem('user', JSON.stringify(user))
}

function getUser(): User | null {
  const u = localStorage.getItem('user')
  return u ? JSON.parse(u) : null
}

async function request<T>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  params?: Record<string, any>,
  body?: any,
  isFormData = false
): Promise<ApiResponse<T>> {
  const url = new URL(API_BASE + path, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.append(k, String(v))
    })
  }

  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  let requestBody: any = undefined
  if (body) {
    if (isFormData) {
      requestBody = body
    } else {
      headers['Content-Type'] = 'application/json'
      requestBody = JSON.stringify(body)
    }
  }

  const resp = await fetch(url.toString(), {
    method,
    headers,
    body: requestBody
  })
  const data = await resp.json()
  return data as ApiResponse<T>
}

export const authApi = {
  login(username: string, password: string) {
    return request<{ user: User; token: string }>('/auth/login', 'POST', undefined, { username, password })
  },
  logout() {
    return request('/auth/logout', 'POST')
  },
  currentUser() {
    return request<User>('/auth/current/user/get')
  }
}

export const opinionApi = {
  categories() {
    return request<Category[]>('/opinion/categories/get')
  },
  staffList() {
    return request<Staff[]>('/opinion/staff/get')
  },
  create(data: { title: string; category: string; description: string; photos?: string[] }) {
    return request<{ id: number }>('/opinion/create', 'POST', undefined, data)
  },
  list(params?: { category?: string; status?: string; keyword?: string; handler_id?: number; page?: number; page_size?: number }) {
    return request<PaginatedList<Opinion>>('/opinion/list/get', 'GET', params)
  },
  pendingList(params?: { page?: number; page_size?: number }) {
    return request<PaginatedList<Opinion>>('/opinion/pending/get', 'GET', params)
  },
  detail(opinion_id: number) {
    return request<{ opinion: Opinion; timelines: Timeline[]; rating?: Rating }>('/opinion/detail/get', 'GET', { opinion_id })
  },
  claim(opinion_id: number) {
    const fd = new FormData()
    fd.append('opinion_id', String(opinion_id))
    return request('/opinion/claim', 'POST', undefined, fd, true)
  },
  process(data: { opinion_id: number; content: string; photos?: string[]; is_resolved?: boolean }) {
    return request('/opinion/process', 'POST', undefined, data)
  },
  rate(data: { opinion_id: number; rating: number; comment?: string }) {
    return request('/opinion/rate', 'POST', undefined, data)
  },
  escalate(opinion_id: number) {
    const fd = new FormData()
    fd.append('opinion_id', String(opinion_id))
    return request('/opinion/escalate', 'POST', undefined, fd, true)
  },
  assign(data: { opinion_id: number; handler_ids: number[] }) {
    return request('/opinion/assign', 'POST', undefined, data)
  },
  publicList(params?: { category?: string; page?: number; page_size?: number }) {
    return request<PaginatedList<Opinion>>('/opinion/public/get', 'GET', params)
  },
  statistics() {
    return request<Statistics>('/opinion/statistics/get')
  },
  report(year: number, month: number) {
    return request<MonthlyReport>('/opinion/report/get', 'GET', { year, month })
  },
  upload(files: File[]) {
    const fd = new FormData()
    files.forEach(f => fd.append('files', f))
    return request<{ urls: string[] }>('/opinion/upload', 'POST', undefined, fd, true)
  }
}

export { getToken, setToken, clearToken, setUser, getUser }
