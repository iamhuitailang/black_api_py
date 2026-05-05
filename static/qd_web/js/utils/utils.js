const Utils = {
    formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    formatDateTime(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    },

    getToday() {
        return this.formatDate(new Date());
    },

    getDaysInMonth(year, month) {
        return new Date(year, month, 0).getDate();
    },

    getFirstDayOfMonth(year, month) {
        return new Date(year, month - 1, 1).getDay();
    },

    showToast(message, duration = 2000) {
        const existingToast = document.querySelector('.toast-container');
        if (existingToast) {
            existingToast.remove();
        }

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
        const loading = document.querySelector('.loading-mask');
        if (loading) {
            loading.remove();
        }
    },

    playFireworks() {
        const container = document.createElement('div');
        container.className = 'fireworks-container';
        document.body.appendChild(container);

        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe'];
        
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'firework-particle';
            
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 8 + 4;
            const x = Math.random() * 100;
            const y = Math.random() * 60 + 20;
            const delay = Math.random() * 0.5;
            const duration = Math.random() * 1 + 1;

            particle.style.cssText = `
                left: ${x}%;
                top: ${y}%;
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                animation-delay: ${delay}s;
                animation-duration: ${duration}s;
            `;

            container.appendChild(particle);
        }

        setTimeout(() => {
            container.remove();
        }, 3000);
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
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};
