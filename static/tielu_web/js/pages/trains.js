(function() {
    'use strict';

    var TrainsPage = {
        trains: [],
        refreshTimer: null,

        onShow: function(params) {
            if (!Auth.isLoggedIn()) {
                Router.navigate('login');
                return;
            }
            this.loadTrains();
            this.startRefreshTimer();
        },

        render: function() {
            var app = document.getElementById('app');
            app.innerHTML = this.getTemplate();
            this.bindEvents();
        },

        getTemplate: function() {
            return [
                '<div class="page has-header">',
                    '<div class="header">',
                        '<button class="header-back" onclick="Router.back();">&#8592;</button>',
                        '<h1 class="header-title">我的火车</h1>',
                    '</div>',
                    
                    '<div class="home-sections">',
                        '<div id="trains-list"></div>',
                    '</div>',

                    '<div class="tabbar">',
                        '<div class="tabbar-item" data-page="home">',
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

        loadTrains: function() {
            var self = this;
            API.game.getTrains()
                .then(function(result) {
                    if (result.code === 0) {
                        self.trains = result.data || [];
                        self.renderTrainsList();
                    }
                })
                .catch(function(error) {
                    console.error('Load trains error:', error);
                });
        },

        renderTrainsList: function() {
            var self = this;
            var listEl = document.getElementById('trains-list');
            if (!listEl) return;

            if (this.trains.length === 0) {
                listEl.innerHTML = [
                    '<div class="empty-state">',
                        '<div class="empty-state-icon">🚂</div>',
                        '<div class="empty-state-text">暂无火车</div>',
                        '<div class="empty-state-text" style="font-size:12px;margin-top:8px;">去商店购买你的第一辆火车吧</div>',
                        '<button class="btn btn-primary btn-sm mt-2" onclick="Router.navigate(\'shop\')">去商店</button>',
                    '</div>'
                ].join('');
                return;
            }

            var html = '';
            this.trains.forEach(function(train) {
                html += self.renderTrainItem(train);
            });
            listEl.innerHTML = html;
        },

        renderTrainItem: function(train) {
            var emoji = Utils.getTrainEmoji(train.train_type);
            var statusClass = Utils.getStatusBadgeClass(train.status);
            var statusText = Utils.getStatusText(train.status);
            var isMoving = train.status === 'moving';
            var isIdle = train.status === 'idle';

            var capacity = train.level * 10 + 10;
            var speed = train.level * 30 + 60;
            var upgradeCost = train.level * 200 + 100;

            var html = [
                '<div class="train-item ', (isMoving ? 'moving' : ''), '" data-train-id="', train.id, '">',
                    '<div class="train-header">',
                        '<span class="train-icon">', emoji, '</span>',
                        '<div class="train-info">',
                            '<div class="train-name">', train.train_type, '</div>',
                            '<div class="train-level">等级 ', train.level, ' · ', train.current_city, '</div>',
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
                        '<div class="train-progress-text">',
                            '<span>', train.current_city, ' &rarr; ', train.destination, '</span>',
                            '<span>剩余 ', Utils.formatTime(remaining), '</span>',
                        '</div>',
                        '<div class="train-progress-bar">',
                            '<div class="train-progress-fill" style="width:', progress, '%"></div>',
                        '</div>',
                    '</div>'
                );
            } else {
                html.push(
                    '<div class="train-stats">',
                        '<span>🚀 速度 ', speed, 'km/h</span>',
                        '<span>📦 载重 ', capacity, '吨</span>',
                    '</div>'
                );
            }

            if (isIdle || (!isMoving && !isIdle)) {
                html.push(
                    '<div class="card-footer" style="padding:12px 0 0;margin-top:12px;border-top:1px solid var(--punk-border);">',
                        '<div style="display:flex;gap:8px;">',
                            '<button class="btn btn-secondary btn-sm flex-1" onclick="TrainsPage.upgradeTrain(', train.id, ')">',
                                '升级 (', upgradeCost, '金币)',
                            '</button>',
                            '<button class="btn btn-primary btn-sm flex-1" onclick="Router.navigate(\'transport\',{trainId:', train.id,'})">',
                                '运输',
                            '</button>',
                        '</div>',
                    '</div>'
                );
            }

            html.push('</div>');
            return html.join('');
        },

        upgradeTrain: function(trainId) {
            Utils.showLoading();
            API.game.upgradeTrain(trainId)
                .then(function(result) {
                    Utils.hideLoading();
                    if (result.code === 0) {
                        var data = result.data;
                        if (data.user_gold !== undefined) {
                            Auth.updateGold(data.user_gold);
                        }
                        Utils.showToast('升级成功！');
                        TrainsPage.loadTrains();
                    }
                })
                .catch(function(error) {
                    Utils.hideLoading();
                    Utils.showToast(error.message || '升级失败');
                });
        },

        startRefreshTimer: function() {
            var self = this;
            if (this.refreshTimer) clearInterval(this.refreshTimer);
            this.refreshTimer = setInterval(function() {
                self.loadTrains();
            }, 10000);
        },

        bindEvents: function() {
            var tabbarItems = document.querySelectorAll('.tabbar-item');
            tabbarItems.forEach(function(item) {
                item.addEventListener('click', function() {
                    var page = item.dataset.page;
                    if (page) {
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

    window.TrainsPage = TrainsPage;
    Router.register('trains', TrainsPage);
})();
