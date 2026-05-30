const MessageService = {
  async getMyMessages(params = {}) {
    return await Api.get('/message/my/get', params);
  },

  async getDetail(message_id) {
    return await Api.get('/message/detail/get', { message_id });
  },

  async markAsRead(message_id) {
    return await Api.post('/message/read', { message_id });
  },

  async markAllAsRead() {
    return await Api.post('/message/read/all');
  },

  async delete(message_id) {
    return await Api.post('/message/delete', { message_id });
  },

  async getUnreadCount() {
    return await Api.get('/message/unread/count/get');
  },

  async send(data) {
    return await Api.post('/message/send', data);
  },

  async getList(params = {}) {
    return await Api.get('/message/list/get', params);
  }
};

window.MessageService = MessageService;
