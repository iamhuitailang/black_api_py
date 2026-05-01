(function() {
    'use strict';

    var HomePage = {
        gameData: null,
        refreshTimer: null,

        onShow: function(params) {
            if (!Auth.isLoggedIn()) {
                Router.navigate('login');
                return;
            }
            this.loadData();
            this.startRefreshTimer();
        },

        render: function() {
            var app = document.getElementById('app');
            app.innerHTML = this.getTemplate();
            this.updateUI();
            this.bindEvents();
        },

        getTemplate: function() {
            var user = Auth.getUser();
            return [
                '<div class="page has-header">',
                    '<div class="header">',
                        '<h1 class="header-title">🚂 铁道大亨</h1>',
                        '<button class="header-action" id="logoutBtn">退出</button>',
                    '</div>',
                    
                    '<div class="home-banner">',
                        '<div class="home-banner-content">',
                            '<div class="home-banner-title">欢迎回来，', (user ? user.username : '玩家'), '</div>',
                            '<div class="home-stats">',
                                '<div class="stat-card">',
                                    '<div class="stat-value" id="stat-gold">', (user ? Utils.formatNumber(user.gold) : 0), '</div>',
                                    '<div class="stat-label">💰 金币</div>',
                                '</div>',
                                '<div class="stat-card">',
                                    '<div class="stat-value" id="stat-level">LV.', (user ? user.level : 1), '</div>',
                                    '<div class="stat-label">⭐ 等级</div>',
                                '</div>',
                                '<div class="stat-card">',
                                    '<div class="stat-value" id="stat-trains">0</div>',
                                    '<div class="stat-label">🚂 火车</div>',
                                '</div>',
                                '<div class="stat-card">',
                                    '<div class="stat-value" id="stat-cities">1</div>',
                                    '<div class="stat-label">🏙️ 城市</div>',
                                '</div>',
                            '</div>',
                        '</div>',
                    '</div>',

                    '<div class="home-sections">',
                        '<div class="section-header">',
                            '<span class="section-title">行驶中的火车</span>',
                            '<span class="section-more" onclick="Router.navigate(\'trains\')">查看全部 &rarr;</span>',
                        '</div>',
                        '<div id="moving-trains-list"></div>',

                        '<div class="section-header">',
                            '<span class="section-title">空闲火车</span>',
                            '<span class="section-more" onclick="Router.navigate(\'trains\')">查看全部 &rarr;</span>',
                        '</div>',
                        '<div id="idle-trains-list"></div>',
                    '</div>',

                    '<button class="fab" id="fabTransport" title="开始运输">',
                        '📦',
                        '<span class="notification-dot hidden" id="arrival-dot"></span>',
                    '</button>',

                    '<div class="tabbar">',
                        '<div class="tabbar-item active" data-page="home">',
                            '<span class="tabbar-icon">🏠</span>',
                            '<span class="tabbar-text">首页</span>',
                        '</div>',
                        '<div class="tabbar-item" data-page="cities">',
                            '<span class="tabbar-icon">🏙️</span>',
                            '<span class="tabbar-text">城市</span>',
                        '</div>',
                        '<div class="tabbar-item" data-page="warehouse">',
                            '<span class="tabbar-icon">📦</span>',
                            '<span class="tabbar-text">仓库</span>',
                        '</div>',
                        '<div class="tabbar-item" data-page="shop">',
                            '<span class="tabbar-icon">🛒</span>',
                            '<span class="tabbar-text">商店</span>',
                        '</div>',
                    '</div>',
                '</div>'
            ].join('');
        },

        updateUI: function() {
            var self = this;
            var user = Auth.getUser();
            if (!user) return;

            var goldEl = document.getElementById('stat-gold');
            var levelEl = document.getElementById('stat-level');
            if (goldEl) goldEl.textContent = Utils.formatNumber(user.gold);
            if (levelEl) levelEl.textContent = 'LV.' + user.level;
        },

        loadData: function() {
            var self = this;
            API.game.getGameData()
                .then(function(result) {
                    if (result.code === 0) {
                        self.gameData = result.data;
                        self.renderTrainsList();
                        self.checkArrivals();
                    }
                })
                .catch(function(error) {
                    console.error('Load game data error:', error);
                });
        },

        renderTrainsList: function() {
            var self = this;
            var data = this.gameData;
            if (!data) return;

            var trains = data.trains || [];
            var movingTrains = trains.filter(function(t) { return t.status === 'moving'; });
            var idleTrains = trains.filter(function(t) { return t.status === 'idle'; });

            var trainsCountEl = document.getElementById('stat-trains');
            if (trainsCountEl) trainsCountEl.textContent = trains.length;

            var citiesCountEl = document.getElementById('stat-cities');
            if (citiesCountEl && data.cities) {
                var unlocked = data.cities.filter(function(c) { return c.unlocked; }).length;
                citiesCountEl.textContent = unlocked;
            }

            var movingListEl = document.getElementById('moving-trains-list');
            var idleListEl = document.getElementById('idle-trains-list');

            if (movingListEl) {
                if (movingTrains.length === 0) {
                    movingListEl.innerHTML = '<div class="empty-state"><div class="empty-state-text">暂无行驶中的火车</div></div>';
                } else {
                    var html = '';
                    movingTrains.forEach(function(train) {
                        html += self.renderTrainCard(train, true);
                    });
                    movingListEl.innerHTML = html;
                }
            }

            if (idleListEl) {
                if (idleTrains.length === 0) {
                    idleListEl.innerHTML = '<div class="empty-state"><div class="empty-state-text">暂无空闲火车</div></div>';
                } else {
                    var html = '';
                    idleTrains.forEach(function(train) {
                        html += self.renderTrainCard(train, false);
                    });
                    idleListEl.innerHTML = html;
                }
            }
        },

        renderTrainCard: function(train, isMoving) {
            var emoji = Utils.getTrainEmoji(train.train_type);
            var statusClass = Utils.getStatusBadgeClass(train.status);
            var statusText = Utils.getStatusText(train.status);
            
            var html = [
                '<div class="train-item ', (isMoving ? 'moving' : ''), '">',
                    '<div class="train-header">',
                        '<span class="train-icon">', emoji, '</span>',
                        '<div class="train-info">',
                            '<div class="train-name">', train.train_type, ' Lv.', train.level, '</div>',
                            '<div class="train-level">', train.current_city, (isMoving ? ' &rarr; ' + train.destination : ''), '</div>',
                        '</div>',
                        '<span class="train-status badge ', statusClass, '">', statusText, '</span>',
                    '</div>'
            ];

            if (isMoving && train.estimated_arrival) {
                var now = Date.now();
                var estimated = new Date(train.estimated_arrival).getTime();
                var remaining = Math.max(0, Math.floor((estimated - now) / 1000));
                var total = train.departure_time ? 
                    Math.max(1, Math.floor((estimated - new Date(train.departure_time).getTime()) / 1000)) : 3600;
                var progress = Math.min(100, Math.max(0, ((total - remaining) / total) * 100));
                
                html.push(
                    '<div class="train-progress">',
                        '<div class="train-progress-bar">',
                            '<div class="train-progress-fill" style="width:', progress, '%"></div>',
                        '</div>',
                        '<div class="train-progress-text">',
                            '<span>预计剩余: ', Utils.formatTime(remaining), '</span>',
                            '<span>到达: ', train.destination, '</span>',
                        '</div>',
                    '</div>'
                );
            } else {
                html.push(
                    '<div class="train-stats">',
                        '<span>载重量: ', (train.level * 10 + 10), '吨</span>',
                        '<span>速度: ', (train.level * 30 + 60), 'km/h</span>',
                    '</div>'
                );
            }

            html.push('</div>');
            return html.join('');
        },

        checkArrivals: function() {
            var self = this;
            var data = this.gameData;
            if (!data || !data.trains) return;

            var now = Date.now();
            var hasArrived = data.trains.some(function(train) {
                if (train.status !== 'moving' || !train.estimated_arrival) {
                    return false;
                }
                var estimated = new Date(train.estimated_arrival).getTime();
                return now >= estimated;
            });

            var dot = document.getElementById('arrival-dot');
            if (dot) {
                if (hasArrived) {
                    dot.classList.remove('hidden');
                } else {
                    dot.classList.add('hidden');
                }
            }
        },

        collectArrivals: function() {
            Utils.showLoading();
            API.game.collectArrived()
                .then(function(result) {
                    Utils.hideLoading();
                    if (result.code === 0) {
                        var data = result.data;
                        if (data.total_gold_earned > 0) {
                            Utils.showToast('获得 ' + data.total_gold_earned + ' 金币！');
                        }
                        if (data.leveled_up) {
                            Utils.showToast('🎉 升级了！当前等级: ' + data.new_level);
                        }
                        Auth.updateGold(data.user_gold || 0);
                        if (data.new_level) {
                            Auth.updateLevel(data.new_level, data.new_exp || 0);
                        }
                        HomePage.updateUI();
                        HomePage.loadData();
                    }
                })
                .catch(function(error) {
                    Utils.hideLoading();
                    Utils.showToast(error.message || '收集失败');
                });
        },

        startRefreshTimer: function() {
            var self = this;
            if (this.refreshTimer) clearInterval(this.refreshTimer);
            this.refreshTimer = setInterval(function() {
                self.loadData();
            }, 10000);
        },

        bindEvents: function() {
            var self = this;

            var logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function() {
                    Auth.logout();
                    Router.navigate('login');
                });
            }

            var fabBtn = document.getElementById('fabTransport');
            if (fabBtn) {
                fabBtn.addEventListener('click', function() {
                    var dot = document.getElementById('arrival-dot');
                    if (dot && !dot.classList.contains('hidden')) {
                        self.collectArrivals();
                    } else {
                        Router.navigate('transport');
                    }
                });
            }

            var tabbarItems = document.querySelectorAll('.tabbar-item');
            tabbarItems.forEach(function(item) {
                item.addEventListener('click', function() {
                    var page = item.dataset.page;
                    if (page && page !== 'home') {
                        Router.navigate(page);
                    }
                });
            });
        },

        onHide: function() {
            if (this.refreshTimer) {
                clearInterval(this.refreshTimer);
                this.refreshTimer = null;
            }
        }
    };

    Router.register('home', HomePage);
})();
