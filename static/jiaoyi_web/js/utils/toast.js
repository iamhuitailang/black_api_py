const Toast = {
    container: null,

    init() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    },

    show(message, duration = 2000) {
        if (!this.container) {
            this.init();
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        this.container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            toast.style.transition = 'all 0.2s ease';
            setTimeout(() => {
                toast.remove();
            }, 200);
        }, duration);
    },

    success(message) {
        this.show(`✓ ${message}`);
    },

    error(message) {
        this.show(`✗ ${message}`);
    },

    info(message) {
        this.show(`ℹ ${message}`);
    }
};

window.Toast = Toast;
