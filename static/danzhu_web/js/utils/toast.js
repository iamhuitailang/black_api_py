const Toast = {
    toasts: [],
    nextId: 1,

    show(message, type = 'info', duration = 3000) {
        const id = this.nextId++;
        const toast = { id, message, type };
        this.toasts.push(toast);

        if (this.onUpdate) {
            this.onUpdate([...this.toasts]);
        }

        setTimeout(() => {
            this.remove(id);
        }, duration);
    },

    remove(id) {
        this.toasts = this.toasts.filter(t => t.id !== id);
        if (this.onUpdate) {
            this.onUpdate([...this.toasts]);
        }
    },

    success(message) {
        this.show(message, 'success');
    },

    error(message) {
        this.show(message, 'error');
    },

    warning(message) {
        this.show(message, 'warning');
    },

    info(message) {
        this.show(message, 'info');
    },

    onUpdate: null
};
