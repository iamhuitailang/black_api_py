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

    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    getDifficultyStars(difficulty) {
        const stars = {
            1: 1,
            2: 2,
            3: 3,
            4: 4,
            5: 5,
            6: 6
        };
        return stars[difficulty] || 1;
    },

    getDifficultyName(difficulty) {
        const names = {
            1: '简单',
            2: '普通',
            3: '困难',
            4: '专家',
            5: '大师',
            6: '传说'
        };
        return names[difficulty] || '简单';
    },

    getCategoryName(category) {
        const names = {
            'classical': '古典',
            'pop': '流行',
            'rock': '摇滚',
            'jazz': '爵士',
            'electronic': '电子'
        };
        return names[category] || '其他';
    },

    getCategoryIcon(category) {
        const icons = {
            'classical': '🎻',
            'pop': '🎤',
            'rock': '🎸',
            'jazz': '🎷',
            'electronic': '🎧'
        };
        return icons[category] || '🎵';
    },

    randomColor() {
        const colors = [
            '#8b5cf6',
            '#ec4899',
            '#06b6d4',
            '#fbbf24',
            '#10b981',
            '#f97316'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    validateUsername(username) {
        const pattern = /^[a-zA-Z0-9_]{3,20}$/;
        return pattern.test(username);
    },

    validatePassword(password) {
        return password && password.length >= 6;
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
                <div class="tabbar-item ${active === 'tracks' ? 'active' : ''}" onclick="Router.navigate('tracks')">
                    <span class="tabbar-icon">📖</span>
                    <span class="tabbar-text">曲目</span>
                </div>
                <div class="tabbar-item ${active === 'magic' ? 'active' : ''}" onclick="Router.navigate('magic')">
                    <span class="tabbar-icon">✨</span>
                    <span class="tabbar-text">魔法</span>
                </div>
                <div class="tabbar-item ${active === 'instruments' ? 'active' : ''}" onclick="Router.navigate('instruments')">
                    <span class="tabbar-icon">🎸</span>
                    <span class="tabbar-text">乐器</span>
                </div>
                <div class="tabbar-item ${active === 'profile' ? 'active' : ''}" onclick="Router.navigate('profile')">
                    <span class="tabbar-icon">👤</span>
                    <span class="tabbar-text">我的</span>
                </div>
            </nav>
        `;
    }
};
