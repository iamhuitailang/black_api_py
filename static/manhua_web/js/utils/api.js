const API_BASE = '/api';

const ApiService = {
  async request(url, options = {}) {
    const token = Storage.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method: 'GET',
      headers,
      ...options
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(`${API_BASE}${url}`, config);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request error:', error);
      return { code: -1, msg: '网络请求失败', data: null };
    }
  },

  get(url, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return this.request(fullUrl, { method: 'GET' });
  },

  post(url, data = {}) {
    return this.request(url, { method: 'POST', body: data });
  },

  put(url, data = {}) {
    return this.request(url, { method: 'PUT', body: data });
  },

  delete(url, data = {}) {
    return this.request(url, { method: 'DELETE', body: data });
  },

  register(username, password, nickname = '', email = '') {
    return this.post('/manhua/user/register', { username, password, nickname, email });
  },

  login(username, password) {
    return this.post('/manhua/user/login', { username, password });
  },

  logout() {
    return this.post('/manhua/user/logout');
  },

  getCurrentUser() {
    return this.get('/manhua/user/current/get');
  },

  updateProfile(data) {
    return this.post('/manhua/user/profile/update', data);
  },

  changePassword(oldPassword, newPassword) {
    return this.post('/manhua/user/password/change', { old_password: oldPassword, new_password: newPassword });
  },

  getComicList(params = {}) {
    return this.get('/manhua/comic/list/get', params);
  },

  getComicDetail(comicId) {
    return this.get('/manhua/comic/detail/get', { comic_id: comicId });
  },

  getRecommendList(params = {}) {
    return this.get('/manhua/comic/recommend/get', params);
  },

  getHotList(params = {}) {
    return this.get('/manhua/comic/hot/get', params);
  },

  searchComics(keyword, params = {}) {
    return this.get('/manhua/comic/search/get', { keyword, ...params });
  },

  getChapter(comicId, chapterNo) {
    return this.get('/manhua/comic/chapter/get', { comic_id: comicId, chapter_no: chapterNo });
  },

  getCategories() {
    return this.get('/manhua/comic/categories/get');
  },

  addFavorite(comicId) {
    return this.post('/manhua/favorite/add', { comic_id: comicId });
  },

  removeFavorite(comicId) {
    return this.post('/manhua/favorite/remove', { comic_id: comicId });
  },

  checkFavorite(comicId) {
    return this.get('/manhua/favorite/check/get', { comic_id: comicId });
  },

  getFavoriteList(params = {}) {
    return this.get('/manhua/favorite/list/get', params);
  },

  recordProgress(comicId, chapterId, chapterNo, pageNo) {
    return this.post('/manhua/history/record', {
      comic_id: comicId,
      chapter_id: chapterId,
      chapter_no: chapterNo,
      page_no: pageNo
    });
  },

  getHistoryList(params = {}) {
    return this.get('/manhua/history/list/get', params);
  },

  getProgress(comicId) {
    return this.get('/manhua/history/progress/get', { comic_id: comicId });
  },

  deleteHistory(comicId = null) {
    const params = comicId ? { comic_id: comicId } : {};
    return this.post('/manhua/history/delete', params);
  },

  createComment(comicId, content, chapterId = null, parentId = 0) {
    return this.post('/manhua/comment/create', {
      comic_id: comicId,
      content,
      chapter_id: chapterId,
      parent_id: parentId
    });
  },

  getComments(comicId, params = {}) {
    return this.get('/manhua/comment/list/get', { comic_id: comicId, ...params });
  },

  getCommentReplies(parentId, params = {}) {
    return this.get('/manhua/comment/replies/get', { parent_id: parentId, ...params });
  },

  likeComment(commentId) {
    return this.post('/manhua/comment/like', { comment_id: commentId });
  },

  deleteComment(commentId) {
    return this.post('/manhua/comment/delete', { comment_id: commentId });
  },

  getMyComments(params = {}) {
    return this.get('/manhua/comment/my/get', params);
  },

  getSettings() {
    return this.get('/manhua/settings/get');
  },

  updateSettings(data) {
    return this.post('/manhua/settings/update', data);
  }
};