var API = {
    baseURL: '/api',
    
    request: function(url, options) {
        var token = Storage.getToken();
        var headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        
        var defaultOptions = {
            headers: headers,
            credentials: 'include'
        };
        
        return fetch(this.baseURL + url, Object.assign({}, defaultOptions, options))
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (data.code !== 0 && data.code !== 200) {
                    if (data.code === 401) {
                        Storage.removeToken();
                        Storage.removeUser();
                        if (window.location.hash !== '#/login') {
                            Toast.show('登录已过期，请重新登录', 'error');
                            setTimeout(function() {
                                Router.navigate('/login');
                            }, 1000);
                        }
                    }
                    throw new Error(data.msg || '请求失败');
                }
                return data;
            })
            .catch(function(error) {
                console.error('API Error:', error);
                throw error;
            });
    },
    
    get: function(url) {
        return this.request(url, {
            method: 'GET'
        });
    },
    
    post: function(url, data) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    put: function(url, data) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    delete: function(url) {
        return this.request(url, {
            method: 'DELETE'
        });
    }
};

var Toast = {
    container: null,
    
    init: function() {
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },
    
    show: function(message, type) {
        if (!this.container) this.init();
        
        type = type || 'info';
        var toast = document.createElement('div');
        toast.className = 'toast ' + type;
        toast.innerHTML = '<span class="toast-message">' + message + '</span><button class="toast-close" onclick="Toast.close(this.parentElement)">&times;</button>';
        
        this.container.appendChild(toast);
        
        var self = this;
        setTimeout(function() {
            self.close(toast);
        }, 3000);
    },
    
    close: function(toast) {
        if (!toast || !toast.parentElement) return;
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(function() {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    },
    
    success: function(message) {
        this.show(message, 'success');
    },
    
    error: function(message) {
        this.show(message, 'error');
    },
    
    warning: function(message) {
        this.show(message, 'warning');
    },
    
    info: function(message) {
        this.show(message, 'info');
    }
};
