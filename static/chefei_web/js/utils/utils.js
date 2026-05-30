const Utils = {
    formatTime(isoString) {
        if (!isoString) return '-';
        try {
            const date = new Date(isoString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } catch (e) {
            return isoString;
        }
    },

    formatDuration(minutes) {
        if (!minutes || minutes === 0) return '0分钟';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0 && mins > 0) {
            return `${hours}小时${mins}分钟`;
        } else if (hours > 0) {
            return `${hours}小时`;
        } else {
            return `${mins}分钟`;
        }
    },

    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    getTodayStart() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return this.formatDate(today) + ' 00:00:00';
    },

    getTodayEnd() {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return this.formatDate(today) + ' 23:59:59';
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
    }
};
