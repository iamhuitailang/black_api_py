const Toast = {
    container: null,
    toasts: [],
    autoHideDuration: 3000,

    init() {
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'info', options = {}) {
        if (!this.container) this.init();

        const { duration = this.autoHideDuration, closable = true } = options;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            ${closable ? '<button class="toast-close" data-action="close">✕</button>' : ''}
        `;

        this.container.appendChild(toast);

        const closeBtn = toast.querySelector('[data-action="close"]');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide(toast));
        }

        if (duration > 0) {
            const timer = setTimeout(() => {
                this.hide(toast);
            }, duration);
            toast.dataset.timer = timer;
        }

        this.toasts.push(toast);
        return toast;
    },

    hide(toast) {
        if (!toast) return;
        
        if (toast.dataset.timer) {
            clearTimeout(toast.dataset.timer);
        }

        toast.style.animation = 'slideIn 0.3s ease reverse';
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            const index = this.toasts.indexOf(toast);
            if (index > -1) {
                this.toasts.splice(index, 1);
            }
        }, 300);
    },

    success(message, options = {}) {
        return this.show(message, 'success', options);
    },

    error(message, options = {}) {
        return this.show(message, 'error', options);
    },

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    },

    info(message, options = {}) {
        return this.show(message, 'info', options);
    },

    clear() {
        [...this.toasts].forEach(toast => this.hide(toast));
    }
};

window.Toast = Toast;
