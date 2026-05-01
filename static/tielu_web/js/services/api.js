(function() {
    'use strict';

    var API_BASE = '/api/tielu';

    function request(url, options) {
        options = options || {};
        options.headers = options.headers || {};
        
        if (options.method && options.method !== 'GET') {
            options.headers['Content-Type'] = 'application/json';
        }
        
        var token = Storage.getToken();
        if (token) {
            options.headers['Authorization'] = 'Bearer ' + token;
        }

        return fetch(API_BASE + url, options)
            .then(function(response) {
                return response.json();
            })
            .then(function(result) {
                if (result.code === 0) {
                    return result;
                } else {
                    throw new Error(result.msg || '请求失败');
                }
            })
            .catch(function(error) {
                console.error('API Error:', error);
                throw error;
            });
    }

    window.API = {
        get: function(url) {
            return request(url, { method: 'GET' });
        },

        post: function(url, data) {
            return request(url, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        put: function(url, data) {
            return request(url, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        del: function(url) {
            return request(url, { method: 'DELETE' });
        },

        auth: {
            register: function(username, password) {
                return API.post('/auth/register', {
                    username: username,
                    password: password
                });
            },

            login: function(username, password) {
                return API.post('/auth/login', {
                    username: username,
                    password: password
                });
            },

            logout: function() {
                return API.post('/auth/logout', {});
            },

            getCurrent: function() {
                return API.get('/auth/current/get');
            }
        },

        game: {
            getGameData: function() {
                return API.get('/game/data/get');
            },

            getCities: function() {
                return API.get('/game/cities/get');
            },

            unlockCity: function(cityName) {
                return API.post('/game/cities/unlock', { city_name: cityName });
            },

            getTrains: function() {
                return API.get('/game/trains/get');
            },

            upgradeTrain: function(trainId) {
                return API.post('/game/trains/upgrade', { train_id: trainId });
            },

            startTransport: function(trainId, destination, cargo) {
                return API.post('/game/transport/start', {
                    train_id: trainId,
                    destination: destination,
                    cargo: cargo
                });
            },

            checkTransport: function() {
                return API.get('/game/transport/check');
            },

            collectArrived: function() {
                return API.post('/game/transport/collect', {});
            },

            getWarehouse: function() {
                return API.get('/game/warehouse/get');
            },

            getShop: function() {
                return API.get('/game/shop/get');
            },

            buyTrain: function(trainType) {
                return API.post('/game/shop/buy/train', { train_type: trainType });
            }
        }
    };
})();
