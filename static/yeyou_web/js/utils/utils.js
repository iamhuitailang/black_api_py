const Utils = {
    showToast(message, duration = 2000) {
        const existingToast = document.querySelector('.toast-container');
        if (existingToast) {
            existingToast.remove();
        }

        const container = document.createElement('div');
        container.className = 'toast-container';
        container.innerHTML = `<div class="toast">${message}</div>`;
        document.body.appendChild(container);

        setTimeout(() => {
            container.remove();
        }, duration);
    },

    showLoading() {
        const existingMask = document.querySelector('.loading-mask');
        if (existingMask) return;

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

    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${minute}`;
    },

    formatDateShort(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        return `${month}-${day} ${hour}:${minute}`;
    },

    getActivityTypeIcon(type) {
        const icons = {
            'hiking': '🥾',
            'hike': '🥾',
            'camping': '🏕️',
            'camp': '🏕️',
            'cycling': '🚴',
            'cycle': '🚴',
            'picnic': '🧺',
            'climbing': '🧗',
            'climb': '🧗',
            'swimming': '🏊',
            'swim': '🏊',
            'skiing': '⛷️',
            'ski': '⛷️',
            'surfing': '🏄',
            'surf': '🏄'
        };
        return icons[type] || '🎒';
    },

    getActivityTypeText(type) {
        const texts = {
            'hiking': '徒步',
            'hike': '徒步',
            'camping': '露营',
            'camp': '露营',
            'cycling': '骑行',
            'cycle': '骑行',
            'picnic': '野餐',
            'climbing': '攀岩',
            'climb': '攀岩',
            'swimming': '游泳',
            'swim': '游泳',
            'skiing': '滑雪',
            'ski': '滑雪',
            'surfing': '冲浪',
            'surf': '冲浪'
        };
        return texts[type] || '其他';
    },

    getDifficultyText(difficulty) {
        const texts = {
            'easy': '初级',
            'beginner': '初级',
            'medium': '中级',
            'intermediate': '中级',
            'hard': '高级',
            'advanced': '高级'
        };
        return texts[difficulty] || '初级';
    },

    getDifficultyBadgeClass(difficulty) {
        const classes = {
            'easy': 'badge-success',
            'beginner': 'badge-success',
            'medium': 'badge-warning',
            'intermediate': 'badge-warning',
            'hard': 'badge-danger',
            'advanced': 'badge-danger'
        };
        return classes[difficulty] || 'badge-secondary';
    },

    getStatusText(status) {
        const texts = {
            'recruiting': '招募中',
            'full': '已满',
            'active': '进行中',
            'ongoing': '进行中',
            'finished': '已结束',
            'ended': '已结束',
            'cancelled': '已取消'
        };
        return texts[status] || '未知';
    },

    getStatusBadgeClass(status) {
        const classes = {
            'recruiting': 'badge-success',
            'full': 'badge-warning',
            'active': 'badge-info',
            'ongoing': 'badge-info',
            'finished': 'badge-secondary',
            'ended': 'badge-secondary',
            'cancelled': 'badge-danger'
        };
        return classes[status] || 'badge-secondary';
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    getLevelColor(level) {
        const colors = {
            '萌新': '#9ca3af',
            '老驴': '#10b981',
            '大神': '#f59e0b'
        };
        return colors[level] || '#9ca3af';
    },

    getAvatarInitial(name) {
        if (!name) return '?';
        return name.charAt(name.length - 1);
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

    getQueryString(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
};

window.Utils = Utils;
