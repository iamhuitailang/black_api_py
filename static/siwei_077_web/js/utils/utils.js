const Utils = {
    showToast(msg, duration = 2000) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, duration);
    },

    showLoading() {
        let mask = document.querySelector('.loading-mask');
        if (!mask) {
            mask = document.createElement('div');
            mask.className = 'loading-mask';
            mask.innerHTML = '<div class="loading-spinner"></div>';
            document.body.appendChild(mask);
        }
    },

    hideLoading() {
        const mask = document.querySelector('.loading-mask');
        if (mask) mask.remove();
    },

    formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    },

    debounce(fn, delay = 300) {
        let timer = null;
        return function (...args) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    generateId() {
        return 'n_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
};
