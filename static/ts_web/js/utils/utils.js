const Utils = {
    formatDate(date, format = 'YYYY-MM-DD') {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        if (!(date instanceof Date)) {
            date = new Date();
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },

    formatDuration(seconds) {
        if (seconds < 60) {
            return `${seconds}秒`;
        } else if (seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return secs > 0 ? `${mins}分${secs}秒` : `${mins}分钟`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
        }
    },

    formatNumber(num) {
        if (num >= 100000000) {
            return (num / 100000000).toFixed(1) + '亿';
        } else if (num >= 10000) {
            return (num / 10000).toFixed(1) + '万';
        }
        return num.toLocaleString();
    },

    formatCalories(calories) {
        if (calories >= 1000) {
            return (calories / 1000).toFixed(2) + ' kcal';
        }
        return calories.toFixed(2) + ' kcal';
    },

    calculateCalories(count, weight = 60) {
        if (count <= 0) return 0;
        const perJump = weight * 0.0004;
        return parseFloat((count * perJump).toFixed(2));
    },

    calculateAvgSpeed(count, duration) {
        if (duration <= 0) return 0;
        const durationMinutes = duration / 60;
        if (durationMinutes <= 0) return 0;
        return parseFloat((count / durationMinutes).toFixed(2));
    },

    getWeekRange(date = new Date()) {
        const start = new Date(date);
        start.setDate(date.getDate() - date.getDay() + 1);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);

        return {
            start: this.formatDate(start),
            end: this.formatDate(end)
        };
    },

    getMonthRange(date = new Date()) {
        const year = date.getFullYear();
        const month = date.getMonth();

        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0);

        return {
            start: this.formatDate(start),
            end: this.formatDate(end),
            yearMonth: `${year}-${String(month + 1).padStart(2, '0')}`
        };
    },

    getDaysDiff(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    },

    isToday(date) {
        const today = new Date();
        const target = new Date(date);
        return today.toDateString() === target.toDateString();
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
    },

    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    showToast(message, duration = 2000) {
        const existing = document.querySelector('.toast-container');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.className = 'toast-container';
        container.innerHTML = `<div class="toast">${message}</div>`;
        document.body.appendChild(container);

        setTimeout(() => {
            container.remove();
        }, duration);
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
        if (mask) mask.remove();
    },

    showConfirm(title, message) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-title">${title}</div>
                    </div>
                    <div class="modal-body" style="text-align: center;">
                        ${message}
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn" data-action="cancel">取消</button>
                        <button class="modal-btn primary" data-action="confirm">确定</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action === 'confirm') {
                    modal.remove();
                    resolve(true);
                } else if (action === 'cancel' || e.target === modal) {
                    modal.remove();
                    resolve(false);
                }
            });
        });
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    isValidPhone(phone) {
        const pattern = /^1[3-9]\d{9}$/;
        return pattern.test(phone);
    },

    formatTimer(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    },

    formatTimerMs(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        const centis = Math.floor((ms % 1000) / 10);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
    },

    getLastNDays(n = 7) {
        const days = [];
        const today = new Date();
        for (let i = n - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            days.push(this.formatDate(date));
        }
        return days;
    }
};

window.Utils = Utils;
