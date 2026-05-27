import request from './request'

export const userApi = {
  register: (data) => request.post('/user/register', data),
  login: (data) => request.post('/user/login', data),
  getDetail: (id) => request.get(`/user/detail/${id}`),
  getList: (params) => request.get('/user/list', { params }),
  update: (id, data) => request.put(`/user/update/${id}`, data),
  delete: (id) => request.delete(`/user/delete/${id}`)
}

export const petApi = {
  create: (data, user_id) => request.post(`/pet/create?user_id=${user_id}`, data),
  getDetail: (id) => request.get(`/pet/detail/${id}`),
  getList: (params) => request.get('/pet/list', { params }),
  update: (id, data) => request.put(`/pet/update/${id}`, data),
  updateStatus: (id, status) => request.put(`/pet/status/${id}?status=${status}`),
  delete: (id) => request.delete(`/pet/delete/${id}`)
}

export const adoptionApi = {
  createApplication: (data, applicant_id) => request.post(`/adoption/application/create?applicant_id=${applicant_id}`, data),
  getApplicationDetail: (id) => request.get(`/adoption/application/detail/${id}`),
  getApplicationList: (params) => request.get('/adoption/application/list', { params }),
  updateApplicationStatus: (id, data) => request.put(`/adoption/application/status/${id}`, data),
  createFeedback: (data, user_id) => request.post(`/adoption/feedback/create?user_id=${user_id}`, data),
  getFeedbackList: (params) => request.get('/adoption/feedback/list', { params }),
  createAgreement: (data) => request.post('/adoption/agreement/create', data),
  getLatestAgreement: () => request.get('/adoption/agreement/latest'),
  getAgreementList: (params) => request.get('/adoption/agreement/list', { params }),
  updateAgreement: (id, data) => request.put(`/adoption/agreement/update/${id}`, data),
  deleteAgreement: (id) => request.delete(`/adoption/agreement/delete/${id}`)
}

export const favoriteApi = {
  create: (data, user_id) => request.post(`/favorite/create?user_id=${user_id}`, data),
  delete: (id, user_id) => request.delete(`/favorite/delete/${id}?user_id=${user_id}`),
  getList: (params) => request.get('/favorite/list', { params }),
  check: (params) => request.get('/favorite/check', { params })
}

export const messageApi = {
  send: (data, sender_id) => request.post(`/message/send?sender_id=${sender_id}`, data),
  sendMessage: (data) => request.post('/message/send', data),
  getConversations: (user_id) => request.get(`/message/list?user_id=${user_id}`),
  getMessages: (params) => request.get('/message/list', { params }),
  getList: (params) => request.get('/message/list', { params }),
  markRead: (id, user_id) => request.put(`/message/read/${id}?user_id=${user_id}`),
  getUnreadCount: (user_id) => request.get(`/message/unread-count?user_id=${user_id}`)
}

export const reviewApi = {
  create: (data, user_id) => request.post(`/review/create?user_id=${user_id}`, data),
  getList: (params) => request.get('/review/list', { params })
}

export const questionApi = {
  create: (data, user_id) => request.post(`/question/create?user_id=${user_id}`, data),
  update: (id, data, user_id) => request.put(`/question/update/${id}?user_id=${user_id}`, data),
  getById: (id) => request.get(`/question/detail/${id}`),
  getList: (params) => request.get('/question/list', { params }),
  createAnswer: (question_id, data, user_id) => request.post(`/question/answer/${question_id}?user_id=${user_id}`, data),
  getAnswers: (question_id) => request.get(`/question/answers/${question_id}`)
}

export const articleApi = {
  create: (data, user_id) => request.post(`/article/create?user_id=${user_id}`, data),
  update: (id, data) => request.put(`/article/update/${id}`, data),
  getById: (id) => request.get(`/article/detail/${id}`),
  getList: (params) => request.get('/article/list', { params }),
  delete: (id) => request.delete(`/article/delete/${id}`)
}

export const noticeApi = {
  create: (data, user_id) => request.post(`/notice/create?user_id=${user_id}`, data),
  update: (id, data) => request.put(`/notice/update/${id}`, data),
  getList: (params) => request.get('/notice/list', { params }),
  delete: (id) => request.delete(`/notice/delete/${id}`)
}

export const reportApi = {
  create: (data, reporter_id) => request.post(`/report/create?reporter_id=${reporter_id}`, data),
  update: (id, data) => request.put(`/report/update/${id}`, data),
  getList: (params) => request.get('/report/list', { params }),
  delete: (id) => request.delete(`/report/delete/${id}`)
}
