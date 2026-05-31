const Toast = {
    show(message, type = 'info', duration = 2000) {
        const existing = document.querySelector('.doudizhu-toast');
        if (existing) {
            existing.remove();
        }

        const toast = document.createElement('div');
        toast.className = `doudizhu-toast toast-${type}`;
        toast.textContent = message;

        const style = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 12px 24px;
            border-radius: 8px;
            color: #fff;
            font-size: 14px;
            z-index: 9999;
            animation: toastFadeIn 0.3s ease;
        `;

        const typeStyles = {
            info: 'background: rgba(0, 0, 0, 0.8);',
            success: 'background: rgba(67, 160, 71, 0.9);',
            error: 'background: rgba(211, 47, 47, 0.9);',
            warning: 'background: rgba(245, 124, 0, 0.9);'
        };

        toast.style.cssText = style + (typeStyles[type] || typeStyles.info);

        const keyframes = `
            @keyframes toastFadeIn {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            @keyframes toastFadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;

        let styleEl = document.getElementById('toast-keyframes');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'toast-keyframes';
            styleEl.textContent = keyframes;
            document.head.appendChild(styleEl);
        }

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastFadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
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
