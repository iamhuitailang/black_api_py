import request from './request'

export const taskApi = {
  getList: (params?: any) => request.get('/task/list', { params }),
  getMyTasks: () => request.get('/task/my-tasks'),
  completeTask: (taskId: number) => request.post(`/task/complete/${taskId}`),
  signin: () => request.post('/task/signin'),
  getSigninInfo: () => request.get('/task/signin/info'),
  create: (data: any) => request.post('/task/', data),
  update: (id: number, data: any) => request.put(`/task/${id}`, data),
  delete: (id: number) => request.delete(`/task/${id}`)
}
