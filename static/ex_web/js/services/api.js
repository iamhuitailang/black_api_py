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
                        if (window.location.hash !== '#/login' && window.location.hash !== '#/register') {
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
    timeoutId: null,
    
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
        
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        
        this.container.innerHTML = '';
        
        var toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        
        this.container.appendChild(toast);
        
        var self = this;
        this.timeoutId = setTimeout(function() {
            if (toast.parentElement) {
                toast.style.animation = 'fadeIn 0.2s ease reverse';
                setTimeout(function() {
                    if (toast.parentElement) {
                        toast.parentElement.removeChild(toast);
                    }
                }, 200);
            }
        }, 2000);
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

var Loading = {
    mask: null,
    
    init: function() {
        this.mask = document.getElementById('loading-mask');
        if (!this.mask) {
            this.mask = document.createElement('div');
            this.mask.id = 'loading-mask';
            this.mask.className = 'loading-mask hidden';
            this.mask.innerHTML = '<div class="loading-spinner"></div>';
            document.body.appendChild(this.mask);
        }
    },
    
    show: function() {
        if (!this.mask) this.init();
        this.mask.classList.remove('hidden');
    },
    
    hide: function() {
        if (this.mask) {
            this.mask.classList.add('hidden');
        }
    }
};
