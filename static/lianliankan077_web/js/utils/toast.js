const Toast = {
    show(msg, duration = 2000) {
        const container = document.getElementById('toast-container') || this._createContainer()
        const el = document.createElement('div')
        el.className = 'toast-item'
        el.textContent = msg
        container.appendChild(el)
        setTimeout(() => {
            el.classList.add('toast-fade-out')
            setTimeout(() => el.remove(), 300)
        }, duration)
    },

    _createContainer() {
        const container = document.createElement('div')
        container.id = 'toast-container'
        container.className = 'toast-container'
        document.body.appendChild(container)
        return container
    },

    success(msg) { this.show(msg) },
    error(msg) { this.show(msg) },
    info(msg) { this.show(msg) }
}
