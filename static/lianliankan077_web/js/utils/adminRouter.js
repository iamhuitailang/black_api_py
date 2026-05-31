const AdminRouter = {
    currentRoute: null,
    routes: {},
    params: {},

    init() {
        window.addEventListener('hashchange', () => this.handleRoute())
        window.addEventListener('load', () => this.handleRoute())
    },

    register(path, handler) {
        this.routes[path] = handler
    },

    navigate(path, params = {}) {
        this.params = params
        window.location.hash = path
    },

    getParams() {
        return this.params
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'login'
        const [path, ...args] = hash.split('/')

        if (!AdminAuthService.isLoggedIn() && path !== 'login') {
            this.navigate('login')
            return
        }

        if (path === 'login' && AdminAuthService.isLoggedIn()) {
            this.navigate('dashboard')
            return
        }

        this.currentRoute = path
        const handler = this.routes[path]

        if (handler) {
            handler(args)
        } else {
            this.navigate('dashboard')
        }
    },

    getCurrentRoute() {
        return this.currentRoute
    },

    back() {
        window.history.back()
    }
}

window.AdminRouter = AdminRouter
