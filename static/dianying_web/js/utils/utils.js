const Utils = {
    debounce(fn, delay = 300) {
        let timer = null;
        return function(...args) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    },

    getYearFromDate(dateStr) {
        if (!dateStr) return '';
        return new Date(dateStr).getFullYear();
    },

    truncate(str, maxLength = 50) {
        if (!str || str.length <= maxLength) return str;
        return str.substring(0, maxLength) + '...';
    }
};
