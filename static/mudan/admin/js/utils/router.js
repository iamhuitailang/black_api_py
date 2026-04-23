const Router = {
    currentRoute: null,
    routes: {},
    
    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    },
    
    register(path, handler) {
        this.routes[path] = handler;
    },
    
    navigate(path) {
        window.location.hash = path;
    },
    
    handleRoute() {
        const hash = window.location.hash.slice(1) || 'login';
        const [path, ...params] = hash.split('/');
        
        if (path !== 'login' && !AuthService.isLoggedIn()) {
            this.navigate('login');
            return;
        }
        
        if (path === 'login' && AuthService.isLoggedIn()) {
            this.navigate('dashboard');
            return;
        }
        
        this.currentRoute = path;
        const handler = this.routes[path];
        
        if (handler) {
            handler(params);
        } else {
            this.navigate('dashboard');
        }
    },
    
    getCurrentRoute() {
        return this.currentRoute;
    }
};

window.Router = Router;
