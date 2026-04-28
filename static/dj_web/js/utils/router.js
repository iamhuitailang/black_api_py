const Router = {
    currentRoute: null,
    currentParams: {},
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
        
        if (path !== 'login' && path !== 'register' && !AuthService.isLoggedIn()) {
            this.navigate('login');
            return;
        }
        
        if ((path === 'login' || path === 'register') && AuthService.isLoggedIn()) {
            this.navigate('market');
            return;
        }
        
        this.currentRoute = path;
        this.currentParams = {};
        
        const handler = this.routes[path];
        
        if (handler) {
            handler(params);
        } else {
            this.navigate('market');
        }
    },
    
    getCurrentRoute() {
        return this.currentRoute;
    },
    
    getParam(key) {
        return this.currentParams[key];
    },
    
    setParams(params) {
        this.currentParams = params || {};
    }
};

window.Router = Router;
