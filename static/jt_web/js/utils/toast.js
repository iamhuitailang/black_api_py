const Toast = {
    show(message, type = 'info', duration = 3000) {
        if (typeof message !== 'string') {
            message = String(message || '');
        }
        if (!message) return;
        
        if (window.vueApp && window.vueApp.showToast) {
            window.vueApp.showToast(message, type);
            setTimeout(() => {
                if (window.vueApp && window.vueApp.hideToast) {
                    window.vueApp.hideToast();
                }
            }, duration);
        } else {
            this.showFallback(message, type);
        }
    },

    showFallback(message, type) {
        if (typeof message !== 'string') {
            message = String(message || '');
        }
        if (!message) return;
        
        const existing = document.querySelector('.toast-container');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.className = 'toast-container';
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        document.body.appendChild(container);

        setTimeout(() => {
            container.remove();
        }, 3000);
    },

    success(message, duration) {
        this.show(message, 'success', duration);
    },

    error(message, duration) {
        this.show(message, 'error', duration);
    },

    warning(message, duration) {
        this.show(message, 'warning', duration);
    },

    info(message, duration) {
        this.show(message, 'info', duration);
    }
};

window.Toast = Toast;
