const Toast = {
    show(message, duration = 2000) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    },

    success(message) {
        this.show(message);
    },

    error(message) {
        this.show(message);
    },

    info(message) {
        this.show(message);
    }
};

const Loading = {
    show() {
        let mask = document.getElementById('loadingMask');
        if (mask) return;

        mask = document.createElement('div');
        mask.id = 'loadingMask';
        mask.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,0.8);display:flex;align-items:center;justify-content:center;z-index:9999;';
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

    getCategoryIcon(code) {
        const icons = {
            'electronics': '📱',
            'documents': '📄',
            'cards': '💳',
            'keys': '🔑',
            'bags': '👜',
            'clothes': '👕',
            'books': '📚',
            'umbrella': '☂️',
            'water_bottle': '🥤',
            'other': '📦'
        };
        return icons[code] || '📦';
    },

    getCategoryName(code) {
        const names = {
            'electronics': '电子产品',
            'documents': '证件文件',
            'cards': '卡类',
            'keys': '钥匙',
            'bags': '箱包',
            'clothes': '衣物',
            'books': '书籍',
            'umbrella': '雨伞',
            'water_bottle': '水杯',
            'other': '其他'
        };
        return names[code] || '其他';
    },

    getPostTypeText(type) {
        const types = {
            'lost': '寻物启事',
            'found': '招领启事'
        };
        return types[type] || type;
    },

    getPostStatusText(status) {
        const statuses = {
            'active': '进行中',
            'claimed': '已认领',
            'closed': '已关闭',
            'expired': '已过期'
        };
        return statuses[status] || status;
    },

    getClaimStatusText(status) {
        const statuses = {
            'pending': '待审核',
            'approved': '已通过',
            'rejected': '已拒绝',
            'completed': '已完成'
        };
        return statuses[status] || status;
    },

    validatePhone(phone) {
        const pattern = /^1[3-9]\d{9}$/;
        return pattern.test(phone);
    },

    getInitial(name) {
        if (!name) return 'U';
        return name.charAt(0).toUpperCase();
    },

    truncate(text, maxLength = 50) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
};

const Tabbar = {
    render(active = 'home') {
        return `
            <nav class="tabbar">
                <div class="tabbar-item ${active === 'home' ? 'active' : ''}" onclick="Router.navigate('home')">
                    <span class="icon">🏠</span>
                    <span>首页</span>
                </div>
                <div class="tabbar-item ${active === 'map' ? 'active' : ''}" onclick="Router.navigate('map')">
                    <span class="icon">📍</span>
                    <span>地图</span>
                </div>
                <div class="tabbar-item ${active === 'office' ? 'active' : ''}" onclick="Router.navigate('office')">
                    <span class="icon">🏛️</span>
                    <span>官方</span>
                </div>
                <div class="tabbar-item ${active === 'notifications' ? 'active' : ''}" onclick="Router.navigate('notifications')">
                    <span class="icon">🔔</span>
                    <span>消息</span>
                </div>
                <div class="tabbar-item ${active === 'profile' ? 'active' : ''}" onclick="Router.navigate('profile')">
                    <span class="icon">👤</span>
                    <span>我的</span>
                </div>
            </nav>
        `;
    }
};

const Header = {
    render(title, showBack = false, rightActions = '') {
        return `
            <header class="header">
                ${showBack ? '<button class="header-back" onclick="Router.back()">‹</button>' : ''}
                <h1 class="header-title">${title}</h1>
                <div class="header-right">${rightActions}</div>
            </header>
        `;
    }
};

window.Toast = Toast;
window.Loading = Loading;
window.Utils = Utils;
window.Tabbar = Tabbar;
window.Header = Header;
