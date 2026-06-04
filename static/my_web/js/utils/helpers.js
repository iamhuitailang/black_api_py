const Helpers = {
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  },

  formatCredits(num) {
    return '₵ ' + this.formatNumber(num);
  },

  formatDate(gameDay) {
    const year = Math.floor(gameDay / 365) + 3000;
    const day = Math.floor(gameDay % 365) + 1;
    return `公元 ${year}年 第${day}天`;
  },

  calculateDistance(system1, system2) {
    const dx = system1.x - system2.x;
    const dy = system1.y - system2.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  randomRange(min, max) {
    return Math.random() * (max - min) + min;
  },

  randomInt(min, max) {
    return Math.floor(this.randomRange(min, max + 1));
  },

  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  },

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },

  lerp(start, end, t) {
    return start + (end - start) * t;
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  calculateUpgradeCost(type, currentLevel) {
    const baseCost = CONSTANTS.UPGRADE_BASE_COST[type];
    const multiplier = Math.pow(CONSTANTS.UPGRADE_COST_MULTIPLIER, currentLevel - 1);
    return Math.floor(baseCost * multiplier);
  },

  calculateUpgradeValue(type, level) {
    switch (type) {
      case 'cargo':
        return CONSTANTS.INITIAL_CARGO + (level - 1) * 100;
      case 'engine':
        return 1 + (level - 1) * 0.5;
      case 'shield':
        return CONSTANTS.INITIAL_SHIELD + (level - 1) * 50;
      case 'weapon':
        return 10 + (level - 1) * 15;
      default:
        return 0;
    }
  },

  getRiskColor(risk) {
    switch (risk) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  },

  getRiskText(risk) {
    switch (risk) {
      case 'low': return '低风险';
      case 'medium': return '中风险';
      case 'high': return '高风险';
      default: return '未知';
    }
  },

  getTrendColor(trend) {
    switch (trend) {
      case 'up': return '#10b981';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  },

  getTrendIcon(trend) {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};
