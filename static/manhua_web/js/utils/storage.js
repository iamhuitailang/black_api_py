const Storage = {
  get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return defaultValue;
      return JSON.parse(value);
    } catch (e) {
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage set error:', e);
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Storage remove error:', e);
    }
  },

  clear() {
    try {
      localStorage.clear();
    } catch (e) {
      console.error('Storage clear error:', e);
    }
  },

  getToken() {
    return this.get('manhua_token', '');
  },

  setToken(token) {
    this.set('manhua_token', token);
  },

  removeToken() {
    this.remove('manhua_token');
  },

  getUser() {
    return this.get('manhua_user', null);
  },

  setUser(user) {
    this.set('manhua_user', user);
  },

  removeUser() {
    this.remove('manhua_user');
  },

  getTheme() {
    return this.get('manhua_theme', 'dark');
  },

  setTheme(theme) {
    this.set('manhua_theme', theme);
  },

  getReadingSettings() {
    return this.get('manhua_reading_settings', {
      read_mode: 'single',
      theme: 'dark',
      brightness: 80,
      auto_play: 0,
      auto_play_speed: 3,
      font_size: 16,
      page_direction: 'ltr',
      show_page_num: 1,
      show_timestamp: 0
    });
  },

  setReadingSettings(settings) {
    this.set('manhua_reading_settings', settings);
  },

  getReaderProgress(comicId) {
    return this.get(`manhua_progress_${comicId}`, null);
  },

  setReaderProgress(comicId, progress) {
    this.set(`manhua_progress_${comicId}`, progress);
  }
};