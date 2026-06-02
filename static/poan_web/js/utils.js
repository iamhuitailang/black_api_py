const Storage = {
    set(key, value) {
        if (typeof value === 'object') {
            value = JSON.stringify(value);
        }
        localStorage.setItem(key, value);
    },

    get(key) {
        const value = localStorage.getItem(key);
        if (!value) return null;
        try {
            return JSON.parse(value);
        } catch (e) {
            return value;
        }
    },

    remove(key) {
        localStorage.removeItem(key);
    },

    clear() {
        localStorage.clear();
    },

    getToken() {
        return this.get('poan_user_token');
    },

    setToken(token) {
        this.set('poan_user_token', token);
    },

    removeToken() {
        this.remove('poan_user_token');
    },

    getUser() {
        return this.get('poan_user');
    },

    setUser(user) {
        this.set('poan_user', user);
    },

    removeUser() {
        this.remove('poan_user');
    },

    getGameState(caseId) {
        return this.get(`poan_game_${caseId}`);
    },

    setGameState(caseId, state) {
        this.set(`poan_game_${caseId}`, state);
    },

    removeGameState(caseId) {
        this.remove(`poan_game_${caseId}`);
    }
};

const Toast = {
    show(message, type = 'info', duration = 2000) {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, duration);
    },

    success(message) {
        this.show(message, 'success');
    },

    error(message) {
        this.show(message, 'error');
    },

    info(message) {
        this.show(message, 'info');
    }
};

const Loading = {
    show() {
        let mask = document.getElementById('loadingMask');
        if (mask) return;

        mask = document.createElement('div');
        mask.id = 'loadingMask';
        mask.className = 'loading-mask';
        mask.innerHTML = '<div class="loading-spinner"></div>';
        document.body.appendChild(mask);
    },

    hide() {
        const mask = document.getElementById('loadingMask');
        if (mask) {
            mask.remove();
        }
    }
};

const Utils = {
    formatDate(date) {
        if (!date) return '-';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    },

    formatTime(time) {
        if (!time) return '-';
        const date = new Date(time);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) {
            return '刚刚';
        } else if (diff < 3600000) {
            return `${Math.floor(diff / 60000)}分钟前`;
        } else if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)}小时前`;
        } else if (diff < 604800000) {
            return `${Math.floor(diff / 86400000)}天前`;
        } else {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
    },

    formatDateTime(timestamp) {
        if (!timestamp) return '-';
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    getDifficultyStars(difficulty) {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(i <= difficulty ? 'active' : '');
        }
        return stars;
    },

    getDifficultyText(difficulty) {
        const texts = ['', '入门', '简单', '中等', '困难', '地狱'];
        return texts[difficulty] || '未知';
    },

    getDifficultyClass(difficulty) {
        const classes = ['', 'badge-success', 'badge-secondary', 'badge-primary', 'badge-warning', 'badge-danger'];
        return classes[difficulty] || 'badge-secondary';
    },

    getEraIcon(era) {
        const icons = {
            'ancient': '🏛️',
            'tang': '🏯',
            'song': '🎭',
            'ming': '⛩️',
            'qing': '🏮',
            'modern': '🏢',
            'republic': '📻'
        };
        return icons[era] || '📜';
    },

    getEraName(era) {
        const names = {
            'ancient': '先秦',
            'tang': '唐代',
            'song': '宋代',
            'ming': '明代',
            'qing': '清代',
            'modern': '现代',
            'republic': '民国'
        };
        return names[era] || era;
    },

    getClueIcon(type) {
        const icons = {
            'item': '🔍',
            'document': '📄',
            'testimony': '💬',
            'photo': '📷',
            'location': '📍',
            'time': '⏰',
            'person': '👤'
        };
        return icons[type] || '📎';
    },

    getClueTypeName(type) {
        const names = {
            'item': '物品',
            'document': '文书',
            'testimony': '证词',
            'photo': '照片',
            'location': '地点',
            'time': '时间',
            'person': '人物'
        };
        return names[type] || '线索';
    },

    getCharacterIcon(role) {
        const icons = {
            'victim': '💀',
            'suspect': '👤',
            'witness': '👁️',
            'npc': '🧑',
            'police': '👮'
        };
        return icons[role] || '🧑';
    },

    getRoleName(role) {
        const names = {
            'victim': '受害者',
            'suspect': '嫌疑人',
            'witness': '目击者',
            'npc': '路人',
            'police': '警官'
        };
        return names[role] || '角色';
    },

    getRoleClass(role) {
        const classes = {
            'victim': 'badge-danger',
            'suspect': 'badge-warning',
            'witness': 'badge-secondary',
            'npc': 'badge-primary',
            'police': 'badge-success'
        };
        return classes[role] || 'badge-primary';
    },

    truncateText(text, maxLength = 50) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
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

    calculateLevel(exp) {
        if (!exp || exp < 0) return 1;
        const baseExp = 100;
        const multiplier = 1.5;
        let level = 1;
        let requiredExp = baseExp;
        
        while (exp >= requiredExp) {
            exp -= requiredExp;
            level++;
            requiredExp = Math.floor(baseExp * Math.pow(multiplier, level - 1));
        }
        
        return level;
    },

    calculateExpProgress(exp) {
        if (!exp || exp < 0) return { current: 0, required: 100, percentage: 0 };
        const baseExp = 100;
        const multiplier = 1.5;
        let level = 1;
        let requiredExp = baseExp;
        
        while (exp >= requiredExp) {
            exp -= requiredExp;
            level++;
            requiredExp = Math.floor(baseExp * Math.pow(multiplier, level - 1));
        }
        
        const percentage = Math.min(100, Math.floor((exp / requiredExp) * 100));
        return {
            current: exp,
            required: requiredExp,
            percentage: percentage
        };
    },

    getEndingTypeText(type) {
        const texts = {
            'perfect': '完美结局',
            'good': '良好结局',
            'normal': '普通结局',
            'bad': '失败结局'
        };
        return texts[type] || '未知结局';
    },

    getEndingTypeClass(type) {
        const classes = {
            'perfect': 'badge-success',
            'good': 'badge-secondary',
            'normal': 'badge-primary',
            'bad': 'badge-danger'
        };
        return classes[type] || 'badge-primary';
    },

    getEndingIcon(type) {
        const icons = {
            'perfect': '🏆',
            'good': '⭐',
            'normal': '📜',
            'bad': '💔'
        };
        return icons[type] || '📜';
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }
};

window.Storage = Storage;
window.Toast = Toast;
window.Loading = Loading;
window.Utils = Utils;
