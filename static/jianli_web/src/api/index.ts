import request from '@/utils/request'
import type {
  LoginResponse,
  AdminLoginResponse,
  User,
  Template,
  TemplateCategory,
  Resume,
  ResumeDetail,
  ResumeEducation,
  ResumeWork,
  ResumeProject,
  ResumeSkill,
  PaginatedResponse,
  PaginationParams,
  StatisticsData,
  SystemSettings
} from '@/types'

export const userApi = {
  register: (data: { username: string; password: string; phone?: string; email?: string; nickname?: string }) => {
    return request.post<LoginResponse>('/jianli/user/register', data)
  },

  login: (data: { username: string; password: string }) => {
    return request.post<LoginResponse>('/jianli/user/login', data)
  },

  logout: () => {
    return request.post('/jianli/user/logout')
  },

  getCurrentUser: () => {
    return request.get<User>('/jianli/user/current/get')
  },

  updateProfile: (data: { nickname?: string; phone?: string; email?: string; avatar?: string }) => {
    return request.post<User>('/jianli/user/profile/update', data)
  },

  changePassword: (data: { old_password: string; new_password: string }) => {
    return request.post('/jianli/user/password/change', data)
  },

  getUserList: (params: PaginationParams) => {
    return request.get<PaginatedResponse<User>>('/jianli/user/list/get', { params })
  },

  updateUserStatus: (params: { user_id: number; status: number }) => {
    return request.post('/jianli/user/status/update', null, { params })
  },

  deleteUser: (params: { user_id: number }) => {
    return request.post('/jianli/user/delete', null, { params })
  }
}

export const adminApi = {
  login: (data: { username: string; password: string }) => {
    return request.post<AdminLoginResponse>('/jianli/admin/login', data)
  },

  logout: () => {
    return request.post('/jianli/admin/logout')
  },

  getCurrentAdmin: () => {
    return request.get<User>('/jianli/admin/current/get')
  }
}

export const templateApi = {
  getCategoryList: (params?: PaginationParams) => {
    return request.get<PaginatedResponse<TemplateCategory>>('/jianli/template/category/list/get', { params })
  },

  getAllCategories: () => {
    return request.get<TemplateCategory[]>('/jianli/template/category/all/get')
  },

  createCategory: (data: { name: string; code: string; description?: string; sort_order?: number }) => {
    return request.post<TemplateCategory>('/jianli/template/category/create', data)
  },

  updateCategory: (params: { category_id: number }, data: { name?: string; code?: string; description?: string; sort_order?: number; status?: number }) => {
    return request.post<TemplateCategory>('/jianli/template/category/update', data, { params })
  },

  deleteCategory: (params: { category_id: number }) => {
    return request.post('/jianli/template/category/delete', null, { params })
  },

  getTemplateList: (params?: PaginationParams) => {
    return request.get<PaginatedResponse<Template>>('/jianli/template/list/get', { params })
  },

  getTemplateDetail: (params: { template_id: number }) => {
    return request.get<Template>('/jianli/template/detail/get', { params })
  },

  createTemplate: (data: { name: string; category_id: number; category_code?: string; description?: string; thumbnail?: string; preview_url?: string; style_config?: string; sort_order?: number }) => {
    return request.post<Template>('/jianli/template/create', data)
  },

  updateTemplate: (params: { template_id: number }, data: { name?: string; category_id?: number; description?: string; thumbnail?: string; preview_url?: string; style_config?: string; sort_order?: number }) => {
    return request.post<Template>('/jianli/template/update', data, { params })
  },

  publishTemplate: (params: { template_id: number }) => {
    return request.post('/jianli/template/publish', null, { params })
  },

  unpublishTemplate: (params: { template_id: number }) => {
    return request.post('/jianli/template/unpublish', null, { params })
  },

  deleteTemplate: (params: { template_id: number }) => {
    return request.post('/jianli/template/delete', null, { params })
  }
}

export const resumeApi = {
  createResume: (data: { title: string; template_id?: number }) => {
    return request.post<Resume>('/jianli/resume/create', data)
  },

  getResumeList: (params?: PaginationParams) => {
    return request.get<PaginatedResponse<Resume>>('/jianli/resume/list/get', { params })
  },

  getResumeDetail: (params: { resume_id: number }) => {
    return request.get<ResumeDetail>('/jianli/resume/detail/get', { params })
  },

  updateBasicInfo: (params: { resume_id: number }, data: any) => {
    return request.post<Resume>('/jianli/resume/basic/update', data, { params })
  },

  addEducation: (params: { resume_id: number }, data: Omit<ResumeEducation, 'id' | 'resume_id' | 'sort_order'>) => {
    return request.post<ResumeEducation>('/jianli/resume/education/add', data, { params })
  },

  updateEducation: (params: { education_id: number }, data: Partial<Omit<ResumeEducation, 'id' | 'resume_id'>>) => {
    return request.post<ResumeEducation>('/jianli/resume/education/update', data, { params })
  },

  deleteEducation: (params: { education_id: number }) => {
    return request.post('/jianli/resume/education/delete', null, { params })
  },

  addWork: (params: { resume_id: number }, data: Omit<ResumeWork, 'id' | 'resume_id' | 'sort_order'>) => {
    return request.post<ResumeWork>('/jianli/resume/work/add', data, { params })
  },

  updateWork: (params: { work_id: number }, data: Partial<Omit<ResumeWork, 'id' | 'resume_id'>>) => {
    return request.post<ResumeWork>('/jianli/resume/work/update', data, { params })
  },

  deleteWork: (params: { work_id: number }) => {
    return request.post('/jianli/resume/work/delete', null, { params })
  },

  addProject: (params: { resume_id: number }, data: Omit<ResumeProject, 'id' | 'resume_id' | 'sort_order'>) => {
    return request.post<ResumeProject>('/jianli/resume/project/add', data, { params })
  },

  updateProject: (params: { project_id: number }, data: Partial<Omit<ResumeProject, 'id' | 'resume_id'>>) => {
    return request.post<ResumeProject>('/jianli/resume/project/update', data, { params })
  },

  deleteProject: (params: { project_id: number }) => {
    return request.post('/jianli/resume/project/delete', null, { params })
  },

  addSkill: (params: { resume_id: number }, data: Omit<ResumeSkill, 'id' | 'resume_id' | 'sort_order'>) => {
    return request.post<ResumeSkill>('/jianli/resume/skill/add', data, { params })
  },

  updateSkill: (params: { skill_id: number }, data: Partial<Omit<ResumeSkill, 'id' | 'resume_id'>>) => {
    return request.post<ResumeSkill>('/jianli/resume/skill/update', data, { params })
  },

  deleteSkill: (params: { skill_id: number }) => {
    return request.post('/jianli/resume/skill/delete', null, { params })
  },

  deleteResume: (params: { resume_id: number }) => {
    return request.post('/jianli/resume/delete', null, { params })
  },

  incrementDownload: (params: { resume_id: number }) => {
    return request.post('/jianli/resume/download/increment', null, { params })
  },

  getAllResumes: (params?: PaginationParams) => {
    return request.get<PaginatedResponse<Resume>>('/jianli/resume/all/get', { params })
  }
}

export const statisticsApi = {
  getOverview: () => {
    return request.get<StatisticsData>('/jianli/statistics/overview/get')
  }
}

export const settingsApi = {
  getList: (params?: { page?: number; page_size?: number; group_name?: string }) => {
    return request.get<PaginatedResponse<SystemSettings>>('/jianli/settings/list/get', { params })
  },

  create: (data: { setting_key: string; setting_value: string; setting_name?: string; description?: string; group_name?: string; sort_order?: number }) => {
    return request.post<SystemSettings>('/jianli/settings/create', data)
  },

  update: (params: { setting_id: number }, data: { setting_value?: string; setting_name?: string; description?: string; group_name?: string; sort_order?: number }) => {
    return request.post<SystemSettings>('/jianli/settings/update', data, { params })
  },

  delete: (params: { setting_id: number }) => {
    return request.post('/jianli/settings/delete', null, { params })
  }
}
