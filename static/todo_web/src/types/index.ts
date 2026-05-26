export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

export interface User {
  id: number
  username: string
  email: string
  nickname: string
  avatar: string
  bio: string
  status: number
  status_text: string
  created_at: string
}

export interface LoginData {
  user: User
  token: string
}

export interface Task {
  id: number
  user_id: number
  project_id: number
  title: string
  description: string
  status: number
  status_text: string
  priority: number
  priority_text: string
  priority_color: string
  tags: string[]
  due_date: string | null
  completed_at: string | null
  estimated_time: number
  actual_time: number
  sort_order: number
  created_at: string
  updated_at: string
  reminders?: Reminder[]
}

export interface Project {
  id: number
  user_id: number
  name: string
  description: string
  color: string
  icon: string
  sort_order: number
  status: number
  status_text: string
  created_at: string
  updated_at: string
  total: number
  completed: number
  in_progress: number
  pending: number
  progress: number
}

export interface Tag {
  id: number
  user_id: number
  name: string
  color: string
  created_at: string
}

export interface Reminder {
  id: number
  user_id: number
  task_id: number
  reminder_time: string
  reminder_type: string
  message: string
  status: number
  created_at: string
}

export interface TaskStatistics {
  total: number
  completed: number
  in_progress: number
  pending: number
  overdue: number
  completion_rate: number
}

export interface OverviewStatistics extends TaskStatistics {
  total_projects: number
  active_projects: number
  today_tasks: number
  overdue_tasks: number
}

export interface TrendData {
  date: string
  total: number
  completed: number
}

export interface TagDistribution {
  name: string
  count: number
  color: string
}

export interface ProjectDistribution {
  project_id: number
  name: string
  color: string
  total: number
  completed: number
  progress: number
}

export interface CalendarData {
  date: string
  total: number
  completed: number
}

export interface KanbanData {
  pending: Task[]
  in_progress: Task[]
  completed: Task[]
}

export interface PersonalStats {
  all_time: TaskStatistics
  last_7_days: TaskStatistics
  last_30_days: TaskStatistics
  total_projects: number
  completed_projects: number
  active_projects: number
}

export interface PaginationResult<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface TaskQueryParams {
  page?: number
  page_size?: number
  status?: number
  priority?: number
  project_id?: number
  keyword?: string
  start_date?: string
  end_date?: string
  order_by?: string
}
