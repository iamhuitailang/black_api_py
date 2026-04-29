const Utils = {
    formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
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
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    },

    getCreditColor(credit) {
        if (credit >= 80) return '#10b981';
        if (credit >= 60) return '#f59e0b';
        return '#ef4444';
    },

    getLevelText(level) {
        const levels = {
            'beginner': '初级',
            'intermediate': '中级',
            'advanced': '高级'
        };
        return levels[level] || level;
    },

    getTypeText(type) {
        return type === 'offer' ? '提供技能' : '需求技能';
    },

    getTypeColor(type) {
        return type === 'offer' ? 'offer' : 'need';
    },

    getStatusText(status) {
        const statuses = {
            'pending': '待确认',
            'accepted': '已接受',
            'in_progress': '进行中',
            'completed': '已完成',
            'rejected': '已拒绝',
            'cancelled': '已取消'
        };
        return statuses[status] || status;
    },

    getStatusColor(status) {
        const colors = {
            'pending': 'pending',
            'accepted': 'accepted',
            'in_progress': 'in-progress',
            'completed': 'completed',
            'rejected': 'rejected',
            'cancelled': 'cancelled'
        };
        return colors[status] || 'pending';
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

    getAvatarUrl(avatar, nickname) {
        if (avatar) return avatar;
        const colors = ['#6366f1', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'];
        const color = colors[nickname ? nickname.charCodeAt(0) % colors.length : 0];
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect fill="${color}" width="100" height="100"/>
                <text x="50" y="65" font-size="45" fill="white" text-anchor="middle" font-family="sans-serif">${nickname ? nickname.charAt(0).toUpperCase() : '?'}</text>
            </svg>
        `)}`;
    },

    showLoading() {
        let loading = document.getElementById('global-loading');
        if (!loading) {
            loading = document.createElement('div');
            loading.id = 'global-loading';
            loading.className = 'global-loading';
            loading.innerHTML = '<div class="loading-spinner"></div>';
            document.body.appendChild(loading);
        }
        loading.style.display = 'flex';
    },

    hideLoading() {
        const loading = document.getElementById('global-loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }
};

window.Utils = Utils;
