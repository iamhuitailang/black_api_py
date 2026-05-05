const Toast = {
    container: null,

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    show(message, duration = 2000) {
        this.init();
        this.container.innerHTML = '';

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        this.container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, duration);
    },

    success(message) {
        this.show('✅ ' + message);
    },

    error(message) {
        this.show('❌ ' + message);
    },

    warning(message) {
        this.show('⚠️ ' + message);
    },

    info(message) {
        this.show('ℹ️ ' + message);
    }
};
