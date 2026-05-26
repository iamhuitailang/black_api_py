export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

export interface User {
  id: number
  username: string
  nickname: string
  phone: string
  email: string
  avatar: string
  status: number
  status_text: string
  created_at: string
}

export interface Admin {
  id: number
  username: string
  nickname: string
  role: string
  role_text: string
  status: number
  status_text: string
  created_at: string
}

export interface LoginResponse {
  user: User
  token: string
}

export interface AdminLoginResponse {
  admin: Admin
  token: string
}

export interface TemplateCategory {
  id: number
  name: string
  code: string
  description: string
  sort_order: number
  status: number
  status_text: string
  created_at: string
}

export interface Template {
  id: number
  name: string
  category_id: number
  category_code: string
  description: string
  thumbnail: string
  preview_url: string
  style_config: string
  sort_order: number
  status: number
  status_text: string
  use_count: number
  created_at: string
}

export interface Resume {
  id: number
  user_id: number
  title: string
  template_id: number
  template_name: string
  template_thumbnail: string
  basic_info: ResumeBasicInfo
  download_count: number
  status: number
  status_text: string
  created_at: string
  updated_at: string
}

export interface ResumeBasicInfo {
  name: string
  gender: string
  phone: string
  email: string
  birthday: string
  address: string
  avatar: string
  job_intention: string
  work_years: string
  salary_expectation: string
  self_evaluation: string
}

export interface ResumeEducation {
  id: number
  resume_id: number
  school: string
  major: string
  degree: string
  start_time: string
  end_time: string
  description: string
  sort_order: number
}

export interface ResumeWork {
  id: number
  resume_id: number
  company: string
  position: string
  start_time: string
  end_time: string
  description: string
  sort_order: number
}

export interface ResumeProject {
  id: number
  resume_id: number
  name: string
  role: string
  start_time: string
  end_time: string
  description: string
  technologies: string
  sort_order: number
}

export interface ResumeSkill {
  id: number
  resume_id: number
  name: string
  level: number
  description: string
  sort_order: number
}

export interface ResumeDetail extends Resume {
  education_list: ResumeEducation[]
  work_list: ResumeWork[]
  project_list: ResumeProject[]
  skill_list: ResumeSkill[]
}

export interface StatisticsData {
  total_users: number
  total_resumes: number
  total_templates: number
  total_downloads: number
  today_new_users: number
  today_new_resumes: number
  user_growth: ChartData[]
  resume_growth: ChartData[]
  template_usage: TemplateUsage[]
}

export interface ChartData {
  date: string
  count: number
}

export interface TemplateUsage {
  template_id: number
  template_name: string
  use_count: number
}

export interface SystemSettings {
  id: number
  setting_key: string
  setting_value: string
  setting_name: string
  description: string
  group_name: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface PaginationParams {
  page: number
  page_size: number
  keyword?: string
  status?: number
  category_id?: number
  category_code?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}
