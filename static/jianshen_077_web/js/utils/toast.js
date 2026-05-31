const Toast = {
    show(message, duration = 2000) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                toast.remove();
            }, 300);
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

window.Toast = Toast;
