const Toast = {
    container: null,
    timer: null,

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    show(message, duration = 2000) {
        this.init();

        if (this.timer) {
            clearTimeout(this.timer);
        }

        this.container.innerHTML = `<div class="toast">${message}</div>`;

        this.timer = setTimeout(() => {
            this.container.innerHTML = '';
        }, duration);
    },

    success(message, duration = 2000) {
        this.show(message, duration);
    },

    error(message, duration = 2000) {
        this.show(message, duration);
    },

    warning(message, duration = 2000) {
        this.show(message, duration);
    },

    info(message, duration = 2000) {
        this.show(message, duration);
    }
};
