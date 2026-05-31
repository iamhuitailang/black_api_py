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
        const d = new Date(time);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    },
    formatPrice(price) {
        if (price === null || price === undefined) return '0.00';
        return parseFloat(price).toFixed(2);
    },
    discount(price, originalPrice) {
        if (!originalPrice || originalPrice <= 0) return '';
        return Math.round((price / originalPrice) * 100) / 10;
    },
    getCategoryName(code) {
        const map = {
            'literature': '文学小说', 'textbook': '教材教辅', 'technology': '科技计算机',
            'history': '历史哲学', 'art': '艺术摄影', 'children': '少儿读物',
            'life': '生活休闲', 'economy': '经济管理', 'other': '其他'
        };
        return map[code] || '其他';
    },
    getConditionName(code) {
        const map = {
            'new': '全新', 'like_new': '几乎全新', 'good': '良好',
            'fair': '一般', 'poor': '较差'
        };
        return map[code] || '未知';
    },
    getTradeStatusText(status) {
        const map = { 0: '待确认', 1: '已确认', 2: '已完成', 3: '已取消' };
        return map[status] || '未知';
    },
    getTradeStatusBadge(status) {
        const map = { 0: 'badge-warning', 1: 'badge-info', 2: 'badge-success', 3: 'badge-secondary' };
        return map[status] || 'badge-secondary';
    },
    getBookStatusText(status) {
        const map = { 0: '待审核', 1: '在售', 2: '已拒绝', 3: '交易中', 4: '已售出' };
        return map[status] || '未知';
    },
    getComplaintStatusText(status) {
        const map = { 0: '待处理', 1: '处理中', 2: '已解决' };
        return map[status] || '未知';
    }
};
