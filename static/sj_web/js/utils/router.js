const SjRouter = {
    _routes: {},
    _currentRoute: '',
    _onNavigate: null,

    register(path, handler) {
        this._routes[path] = handler
    },

    navigate(path, params = {}) {
        this._currentRoute = path
        window.location.hash = `#${path}`
        if (this._onNavigate) {
            this._onNavigate(path, params)
        }
    },

    getCurrentRoute() {
        return window.location.hash.slice(1) || 'home'
    },

    getParams() {
        const hash = window.location.hash.slice(1)
        const parts = hash.split('?')
        if (parts.length > 1) {
            const params = {}
            parts[1].split('&').forEach(p => {
                const [key, val] = p.split('=')
                params[decodeURIComponent(key)] = decodeURIComponent(val || '')
            })
            return params
        }
        return {}
    },

    init(onNavigate) {
        this._onNavigate = onNavigate
        window.addEventListener('hashchange', () => {
            const route = this.getCurrentRoute()
            this._currentRoute = route
            if (this._onNavigate) {
                this._onNavigate(route, this.getParams())
            }
        })

        const route = this.getCurrentRoute()
        this._currentRoute = route
        if (this._onNavigate) {
            this._onNavigate(route, this.getParams())
        }
    }
}
