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
                container.removeChild(toast);
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
            return `${date.getMonth() + 1}-${date.getDate()}`;
        }
    },

    getCategoryIcon(code) {
        const icons = {
            'tools': '🔧',
            'errand': '🏃',
            'repair': '🔨',
            'care': '👶',
            'study': '📚',
            'life': '🏠'
        };
        return icons[code] || '📋';
    },

    getCategoryName(code) {
        const names = {
            'tools': '工具借用',
            'errand': '跑腿帮忙',
            'repair': '维修',
            'care': '照顾',
            'study': '学习',
            'life': '生活'
        };
        return names[code] || '其他';
    },

    validatePhone(phone) {
        const pattern = /^1[3-9]\d{9}$/;
        return pattern.test(phone);
    }
};

const Tabbar = {
    render(active = 'home') {
        return `
            <nav class="tabbar">
                <div class="tabbar-item ${active === 'home' ? 'active' : ''}" onclick="Router.navigate('home')">
                    <span class="tabbar-icon">🏠</span>
                    <span class="tabbar-text">首页</span>
                </div>
                <div class="tabbar-item ${active === 'post' ? 'active' : ''}" onclick="Router.navigate('post')">
                    <span class="tabbar-icon">✏️</span>
                    <span class="tabbar-text">发布</span>
                </div>
                <div class="tabbar-item ${active === 'profile' ? 'active' : ''}" onclick="Router.navigate('profile')">
                    <span class="tabbar-icon">👤</span>
                    <span class="tabbar-text">我的</span>
                </div>
            </nav>
        `;
    }
};
