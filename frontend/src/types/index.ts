export type Priority = 'want_to_read' | 'reading' | 'read'

export interface Project {
  id: number
  github_url: string
  name: string
  description: string | null
  language: string | null
  stars: number
  tags: string[]
  priority: Priority
  note: string | null
  added_at: string
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface ProjectListData {
  items: Project[]
  total: number
}

export interface AddProjectRequest {
  github_url: string
  tags?: string[]
  priority?: Priority
  note?: string
}

export interface UpdateProjectRequest {
  id: number
  tags?: string[]
  priority?: Priority
  note?: string
}

export interface BatchDeleteRequest {
  ids: number[]
}

export interface PriorityInfo {
  value: Priority
  label: string
  color: string
  bgColor: string
}

export const priorityList: PriorityInfo[] = [
  { value: 'want_to_read', label: '想看', color: '#f9e2af', bgColor: 'rgba(249, 226, 175, 0.15)' },
  { value: 'reading', label: '在看', color: '#89b4fa', bgColor: 'rgba(137, 180, 250, 0.15)' },
  { value: 'read', label: '已看', color: '#a6e3a1', bgColor: 'rgba(166, 227, 161, 0.15)' },
]
