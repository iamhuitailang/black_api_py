window.SIQIU = window.SIQIU || {};

SIQIU.Storage = {
  KEY: 'shiqiu_save_v1',

  defaults() {
    return {
      best: 0,
      clears: 0,
      shots: 0,
      goals: 0,
      maxCombo: 0,
      character: 'allround',
      stadium: 'grass',
      progress: null
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return this.defaults();
      const data = JSON.parse(raw);
      return Object.assign(this.defaults(), data);
    } catch (e) {
      console.warn('读取本地存档失败', e);
      return this.defaults();
    }
  },

  save(data) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('写入本地存档失败', e);
    }
  },

  reset() {
    localStorage.removeItem(this.KEY);
  },

  update(patch) {
    const data = this.load();
    Object.assign(data, patch);
    this.save(data);
    return data;
  }
};
