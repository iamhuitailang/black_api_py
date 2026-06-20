const Utils = {
  formatTime(seconds) {
    if (!seconds && seconds !== 0) return '--';
    const s = Number(seconds);
    const mins = Math.floor(s / 60);
    const secs = (s % 60).toFixed(3);
    return mins > 0 ? `${mins}分${parseFloat(secs).toFixed(3)}秒` : `${secs}秒`;
  },

  formatSpeed(speed) {
    return `${Number(speed || 0).toFixed(1)} km/h`;
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateStr;
    }
  },

  getDifficultyLabel(diff) {
    return { easy: '新手', normal: '标准', hard: '大师' }[diff] || diff;
  },
  getDifficultyClass(diff) {
    return `difficulty-${diff}`;
  },

  getTypeLabel(type) {
    return { aggressive: '激进型', steady: '稳健型', random: '随机型', player: '玩家' }[type] || type;
  },
  getTypeIcon(type) {
    return { aggressive: '🔥', steady: '🛡️', random: '🎲', player: '👤' }[type] || '🎯';
  },
  getTypeAvatarClass(type) {
    return `type-${type}`;
  },

  getSegmentColor(type) {
    return {
      straight: 'linear-gradient(90deg, #cbd5e1, #e2e8f0)',
      curve: 'linear-gradient(90deg, #f97316, #fb923c)',
      crack: 'linear-gradient(90deg, #64748b, #94a3b8)',
      boost: 'linear-gradient(90deg, #10b981, #34d399)',
    }[type] || '#e2e8f0';
  },
  getSegmentLabel(type) {
    return { straight: '直', curve: '弯', crack: '裂', boost: '加' }[type] || '';
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  showToast(message, type = 'info', duration = 2500) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  },

  clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
};
