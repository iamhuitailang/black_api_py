const Router = {
    currentPage: 'login',
    routes: {},
    onRouteChange: null,

    register(path, component) {
        this.routes[path] = component;
    },

    navigate(path, params = {}) {
        if (!this.routes[path]) {
            console.error(`Route not found: ${path}`);
            return;
        }

        if (path !== 'login' && path !== 'register' && !Auth.isAuthenticated()) {
            path = 'login';
        }

        this.currentPage = path;
        this.currentParams = params;

        if (this.onRouteChange) {
            this.onRouteChange(path, params);
        }
    },

    getCurrentComponent() {
        return this.routes[this.currentPage] || this.routes['login'];
    },

    getCurrentParams() {
        return this.currentParams || {};
    }
};

const Utils = {
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    getDifficultyText(level) {
        const map = { 1: '简单', 2: '普通', 3: '困难', 4: '专家' };
        return map[level] || '未知';
    },

    getDifficultyClass(level) {
        const map = { 1: 'easy', 2: 'normal', 3: 'hard', 4: 'expert' };
        return map[level] || 'normal';
    },

    getRarityText(rarity) {
        const map = { 1: '普通', 2: '稀有', 3: '史诗', 4: '传奇' };
        return map[rarity] || '未知';
    },

    getRarityClass(rarity) {
        const map = { 1: 'common', 2: 'rare', 3: 'epic', 4: 'legendary' };
        return map[rarity] || 'common';
    },

    getRarityGradient(rarity) {
        const map = {
            1: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
            2: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            3: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            4: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
        };
        return map[rarity] || map[1];
    },

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },

    showToast(message, type = 'info', duration = 2000) {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, duration);
    },

    getLevelExp(level) {
        return Math.floor(100 * Math.pow(1.5, level - 1));
    },

    calculateExpProgress(currentExp, level) {
        const levelExp = this.getLevelExp(level);
        const prevLevelExp = this.getLevelExp(level - 1);
        const progress = ((currentExp - prevLevelExp) / (levelExp - prevLevelExp)) * 100;
        return this.clamp(progress, 0, 100);
    }
};
