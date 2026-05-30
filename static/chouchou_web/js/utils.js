const Utils = {
    toast(message, type = 'info', duration = 3000) {
        const toastDiv = document.createElement('div');
        toastDiv.className = `toast toast-${type}`;
        toastDiv.textContent = message;
        document.body.appendChild(toastDiv);
        
        setTimeout(() => {
            toastDiv.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toastDiv.remove(), 300);
        }, duration);
    },

    success(message) {
        this.toast(message, 'success');
    },

    error(message) {
        this.toast(message, 'error');
    },

    warning(message) {
        this.toast(message, 'warning');
    },

    info(message) {
        this.toast(message, 'info');
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    formatNumber(num) {
        return num.toLocaleString('zh-CN');
    },

    getRoleName(role) {
        const roleMap = {
            'king': '国王',
            'civilian': '平民',
            'clown': '小丑'
        };
        return roleMap[role] || role;
    },

    getRoleEmoji(role) {
        const emojiMap = {
            'king': '👑',
            'civilian': '🤵',
            'clown': '🤡'
        };
        return emojiMap[role] || '❓';
    },

    getActionName(action) {
        const actionMap = {
            'obey': '服从',
            'refuse': '拒绝',
            'sabotage': '捣乱'
        };
        return actionMap[action] || action;
    },

    getStatusName(status) {
        const statusMap = {
            'waiting': '等待中',
            'playing': '进行中',
            'paused': '已暂停',
            'finished': '已结束'
        };
        return statusMap[status] || status;
    },

    getThemeName(theme) {
        const themeMap = {
            'carnival': '欢乐马戏城',
            'vintage': '复古马戏团',
            'dark': '暗夜诡马戏'
        };
        return themeMap[theme] || theme;
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    copyToClipboard(text) {
        return navigator.clipboard.writeText(text).then(() => {
            this.success('已复制到剪贴板');
            return true;
        }).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            textarea.remove();
            this.success('已复制到剪贴板');
            return true;
        });
    },

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    randomChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    shuffleArray(arr) {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    isValidUsername(username) {
        return /^[a-zA-Z0-9_]{3,20}$/.test(username);
    },

    isValidPassword(password) {
        return password.length >= 6 && password.length <= 20;
    },

    isValidPhone(phone) {
        return /^1[3-9]\d{9}$/.test(phone);
    },

    getInitials(name) {
        return name.substring(0, 1).toUpperCase();
    },

    storage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                return false;
            }
        },

        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                return defaultValue;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                return false;
            }
        },

        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                return false;
            }
        }
    }
};
