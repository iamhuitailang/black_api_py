const Toast = {
    show(message, duration = 2000) {
        const container = document.createElement('div');
        container.className = 'toast-container';
        container.innerHTML = `<div class="toast">${message}</div>`;
        document.body.appendChild(container);

        setTimeout(() => {
            container.remove();
        }, duration);
    },

    success(message) {
        this.show(message);
    },

    error(message) {
        this.show(message);
    },

    info(message) {
        this.show(message);
    }
};

window.Toast = Toast;