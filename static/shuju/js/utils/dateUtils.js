const DateUtils = {
    format(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },

    parse(dateStr) {
        return new Date(dateStr);
    },

    isSameDay(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    },

    isSameMonth(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth();
    },

    getToday() {
        const now = new Date();
        return {
            start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
            end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        };
    },

    getThisWeek() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const start = new Date(now);
        start.setDate(now.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        return { start, end };
    },

    getThisMonth() {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return { start, end };
    },

    getDateRange(rangeType) {
        switch (rangeType) {
            case 'today':
                return this.getToday();
            case 'week':
                return this.getThisWeek();
            case 'month':
                return this.getThisMonth();
            default:
                return this.getToday();
        }
    },

    generateDates(startDate, endDate, interval = 'day') {
        const dates = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        let current = new Date(start);

        while (current <= end) {
            dates.push(new Date(current));
            
            switch (interval) {
                case 'day':
                    current.setDate(current.getDate() + 1);
                    break;
                case 'week':
                    current.setDate(current.getDate() + 7);
                    break;
                case 'month':
                    current.setMonth(current.getMonth() + 1);
                    break;
                default:
                    current.setDate(current.getDate() + 1);
            }
        }

        return dates;
    },

    daysInRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diff = end.getTime() - start.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    },

    getRelativeTime(date) {
        const now = new Date();
        const d = new Date(date);
        const diff = now.getTime() - d.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}天前`;
        } else if (hours > 0) {
            return `${hours}小时前`;
        } else if (minutes > 0) {
            return `${minutes}分钟前`;
        } else {
            return '刚刚';
        }
    },

    formatCurrency(value, currency = '¥') {
        if (typeof value !== 'number') return value;
        
        if (value >= 100000000) {
            return `${currency}${(value / 100000000).toFixed(2)}亿`;
        } else if (value >= 10000) {
            return `${currency}${(value / 10000).toFixed(2)}万`;
        }
        return `${currency}${value.toLocaleString('zh-CN')}`;
    },

    formatNumber(value) {
        if (typeof value !== 'number') return value;
        
        if (value >= 100000000) {
            return `${(value / 100000000).toFixed(2)}亿`;
        } else if (value >= 10000) {
            return `${(value / 10000).toFixed(2)}万`;
        }
        return value.toLocaleString('zh-CN');
    },

    formatPercent(value, decimals = 2) {
        if (typeof value !== 'number') return value;
        return `${(value * 100).toFixed(decimals)}%`;
    }
};

window.DateUtils = DateUtils;
