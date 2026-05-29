const Toast = {
    show(message, duration = 2000) {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = 'toast';
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
    success(message) { this.show(message); },
    error(message) { this.show(message); },
    info(message) { this.show(message); }
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
        if (mask) mask.remove();
    }
};

const Utils = {
    formatTime(time) {
        if (!time) return '-';
        const date = new Date(time);
        const now = new Date();
        const diff = now - date;
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
        return `${date.getMonth() + 1}-${date.getDate()}`;
    },

    formatDateTime(time) {
        if (!time) return '-';
        const date = new Date(time);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${d} ${h}:${min}`;
    },

    getCategoryIcon(code) {
        const icons = {
            'sports': '🏃', 'social': '🤝', 'charity': '💚', 'show': '🎭',
            'study': '📚', 'food': '🍜', 'travel': '🏕️', 'volunteer': '🙌', 'other': '📌'
        };
        return icons[code] || '📌';
    },

    getCategoryName(code) {
        const names = {
            'sports': '运动健身', 'social': '社交聚会', 'charity': '公益活动', 'show': '演出展览',
            'study': '学习交流', 'food': '美食探店', 'travel': '户外旅行', 'volunteer': '志愿者', 'other': '其他'
        };
        return names[code] || '其他';
    },

    validatePhone(phone) {
        const pattern = /^1[3-9]\d{9}$/;
        return pattern.test(phone);
    },

    getStatusText(status) {
        const map = { 0: '草稿', 1: '报名中', 2: '进行中', 3: '已结束', 4: '已取消' };
        return map[status] || '未知';
    },

    getStatusClass(status) {
        const map = { 0: 'badge-secondary', 1: 'badge-success', 2: 'badge-info', 3: 'badge-warning', 4: 'badge-danger' };
        return map[status] || 'badge-secondary';
    }
};

const Tabbar = {
    render(active = 'home') {
        const user = AuthService.getCurrentUser();
        let unreadDot = '';
        return `
            <nav class="tabbar">
                <div class="tabbar-item ${active === 'home' ? 'active' : ''}" onclick="Router.navigate('home')">
                    <span class="tabbar-icon">🏠</span>
                    <span class="tabbar-text">首页</span>
                </div>
                <div class="tabbar-item ${active === 'discover' ? 'active' : ''}" onclick="Router.navigate('discover')">
                    <span class="tabbar-icon">🔍</span>
                    <span class="tabbar-text">发现</span>
                </div>
                <div class="tabbar-item ${active === 'publish' ? 'active' : ''}" onclick="Router.navigate('publish')">
                    <span class="tabbar-icon publish-icon">➕</span>
                    <span class="tabbar-text">发布</span>
                </div>
                <div class="tabbar-item ${active === 'messages' ? 'active' : ''}" onclick="Router.navigate('messages')">
                    <span class="tabbar-icon">💬</span>
                    <span class="tabbar-text">消息</span>
                </div>
                <div class="tabbar-item ${active === 'profile' ? 'active' : ''}" onclick="Router.navigate('profile')">
                    <span class="tabbar-icon">👤</span>
                    <span class="tabbar-text">我的</span>
                </div>
            </nav>
        `;
    }
};
