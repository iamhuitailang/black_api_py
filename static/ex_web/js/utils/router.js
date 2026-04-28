var Router = {
    routes: {},
    currentRoute: null,
    
    register: function(path, handler) {
        this.routes[path] = handler;
    },
    
    navigate: function(path) {
        window.location.hash = path;
    },
    
    getCurrentPath: function() {
        var hash = window.location.hash.slice(1) || '/';
        return hash.split('?')[0];
    },
    
    getParams: function() {
        var hash = window.location.hash.slice(1);
        var queryIndex = hash.indexOf('?');
        var params = {};
        
        if (queryIndex !== -1) {
            var queryString = hash.substring(queryIndex + 1);
            var pairs = queryString.split('&');
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i].split('=');
                var key = decodeURIComponent(pair[0]);
                var value = pair[1] ? decodeURIComponent(pair[1]) : '';
                params[key] = value;
            }
        }
        
        return params;
    },
    
    parse: function(path) {
        var cleanPath = path.split('?')[0];
        
        if (this.routes[cleanPath]) {
            return {
                handler: this.routes[cleanPath],
                params: {}
            };
        }
        
        for (var route in this.routes) {
            var routeParts = route.split('/');
            var pathParts = cleanPath.split('/');
            
            if (routeParts.length !== pathParts.length) continue;
            
            var params = {};
            var match = true;
            
            for (var i = 0; i < routeParts.length; i++) {
                if (routeParts[i].startsWith(':')) {
                    params[routeParts[i].slice(1)] = pathParts[i];
                } else if (routeParts[i] !== pathParts[i]) {
                    match = false;
                    break;
                }
            }
            
            if (match) {
                return {
                    handler: this.routes[route],
                    params: params
                };
            }
        }
        
        return null;
    },
    
    dispatch: function() {
        var path = this.getCurrentPath();
        var parsed = this.parse(path);
        
        if (parsed) {
            this.currentRoute = path;
            parsed.handler(parsed.params);
        } else {
            console.error('Route not found:', path);
            var app = document.getElementById('app');
            if (app) {
                app.innerHTML = '<div class="page-container"><div class="page-content"><div class="empty-state"><div class="icon">🔍</div><p>页面不存在</p><button class="btn btn-primary" onclick="Router.navigate(\'/\')">返回首页</button></div></div></div>';
            }
        }
    },
    
    init: function() {
        var self = this;
        window.addEventListener('hashchange', function() {
            self.dispatch();
        });
        
        this.dispatch();
    }
};
