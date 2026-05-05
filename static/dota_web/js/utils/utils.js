const Utils = {
    formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) {
            return '刚刚';
        }
        if (diff < 3600000) {
            return Math.floor(diff / 60000) + '分钟前';
        }
        if (diff < 86400000) {
            return Math.floor(diff / 3600000) + '小时前';
        }
        if (diff < 604800000) {
            return Math.floor(diff / 86400000) + '天前';
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');

        if (year === now.getFullYear()) {
            return `${month}-${day} ${hour}:${minute}`;
        }
        return `${year}-${month}-${day}`;
    },

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
    },

    getHeroTypeColor(heroType) {
        const colors = {
            'agility': 'var(--agility-color)',
            'strength': 'var(--strength-color)',
            'intelligence': 'var(--intelligence-color)'
        };
        return colors[heroType] || 'var(--text-primary)';
    },

    getHeroTypeName(heroType) {
        const names = {
            'agility': '敏捷',
            'strength': '力量',
            'intelligence': '智力'
        };
        return names[heroType] || '未知';
    },

    getStageTypeName(stageType) {
        const names = {
            'minion': '小兵关',
            'elite': '精英关',
            'boss': 'BOSS关'
        };
        return names[stageType] || '未知';
    },

    getStageTypeIcon(stageType) {
        const icons = {
            'minion': '🧟',
            'elite': '👹',
            'boss': '👾'
        };
        return icons[stageType] || '❓';
    },

    createElement(tag, className, innerHTML) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (innerHTML) el.innerHTML = innerHTML;
        return el;
    },

    showLoading() {
        const existing = document.querySelector('.loading-mask');
        if (existing) return;

        const mask = document.createElement('div');
        mask.className = 'loading-mask';
        mask.innerHTML = '<div class="loading-spinner"></div>';
        document.body.appendChild(mask);
    },

    hideLoading() {
        const mask = document.querySelector('.loading-mask');
        if (mask) {
            mask.remove();
        }
    },

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
