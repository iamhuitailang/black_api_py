const Utils = {
    formatDate(dateString, format = 'YYYY-MM-DD HH:mm') {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes);
    },

    formatPrice(price) {
        return parseFloat(price || 0).toFixed(2);
    },

    getConditionText(condition) {
        const map = {
            'new': '全新',
            'like_new': '几乎全新',
            'good': '良好',
            'fair': '一般'
        };
        return map[condition] || '未知';
    },

    getOrderStatusText(status) {
        const map = {
            0: '待付款',
            1: '待发货',
            2: '待收货',
            3: '已收货',
            4: '已完成',
            5: '已取消',
            6: '退款中',
            7: '已退款'
        };
        return map[status] || '未知';
    },

    getBookStatusText(status) {
        const map = {
            0: '待审核',
            1: '在售',
            2: '已下架',
            3: '已售出',
            4: '已拒绝'
        };
        return map[status] || '未知';
    },

    getRoleText(role) {
        const map = {
            'buyer': '买家',
            'seller': '卖家',
            'both': '买家/卖家'
        };
        return map[role] || '未知';
    },

    debounce(fn, delay = 300) {
        let timer = null;
        return function(...args) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    throttle(fn, delay = 300) {
        let last = 0;
        return function(...args) {
            const now = Date.now();
            if (now - last >= delay) {
                last = now;
                fn.apply(this, args);
            }
        };
    },

    showLoading() {
        const existing = document.querySelector('.loading-mask');
        if (existing) return;

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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    truncate(text, length = 50) {
        if (!text) return '';
        if (text.length <= length) return text;
        return text.slice(0, length) + '...';
    }
};

window.Utils = Utils;
