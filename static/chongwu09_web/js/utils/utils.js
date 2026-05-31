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
            setTimeout(() => { container.removeChild(toast); }, 300);
        }, duration);
    },
    success(msg) { this.show(msg); },
    error(msg) { this.show(msg); },
    info(msg) { this.show(msg); }
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
    formatDate(dateStr) {
        if (!dateStr) return '-';
        return dateStr.substring(0, 10);
    },
    validatePhone(phone) {
        return /^1[3-9]\d{9}$/.test(phone);
    },
    getPetIcon(type) {
        const icons = { dog: '🐕', cat: '🐈', bird: '🐦', fish: '🐠', other: '🐾' };
        return icons[type] || '🐾';
    },
    getPetTypeName(type) {
        const names = { dog: '犬类', cat: '猫类', bird: '鸟类', fish: '鱼类', other: '其他' };
        return names[type] || '其他';
    },
    getServiceIcon(type) {
        const icons = { daycare: '🏠', boarding: '🏨', grooming: '✂️', walking: '🚶', vet: '🏥' };
        return icons[type] || '🐾';
    },
    getServiceTypeName(type) {
        const names = { daycare: '日间寄养', boarding: '长期寄养', grooming: '美容洗护', walking: '遛宠服务', vet: '医疗陪护' };
        return names[type] || '其他';
    },
    getBookingStatusText(status) {
        const map = { 0: '待确认', 1: '已确认', 2: '寄养中', 3: '已完成', 4: '已取消' };
        return map[status] || '未知';
    },
    getBookingStatusClass(status) {
        const map = { 0: 'badge-warning', 1: 'badge-info', 2: 'badge-primary', 3: 'badge-success', 4: 'badge-secondary' };
        return map[status] || 'badge-secondary';
    },
    getOrderStatusText(status) {
        const map = { 0: '待支付', 1: '已支付', 2: '服务中', 3: '已完成', 4: '已退款', 5: '已取消' };
        return map[status] || '未知';
    },
    getOrderStatusClass(status) {
        const map = { 0: 'badge-warning', 1: 'badge-info', 2: 'badge-primary', 3: 'badge-success', 4: 'badge-danger', 5: 'badge-secondary' };
        return map[status] || 'badge-secondary';
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
                <div class="tabbar-item ${active === 'myBookings' ? 'active' : ''}" onclick="Router.navigate('myBookings')">
                    <span class="tabbar-icon">📋</span>
                    <span class="tabbar-text">我的寄养</span>
                </div>
                <div class="tabbar-item ${active === 'notifications' ? 'active' : ''}" onclick="Router.navigate('notifications')">
                    <span class="tabbar-icon">🔔</span>
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
