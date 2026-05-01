(function() {
    'use strict';

    var CitiesPage = {
        cities: [],
        user: null,

        onShow: function(params) {
            if (!Auth.isLoggedIn()) {
                Router.navigate('login');
                return;
            }
            this.user = Auth.getUser();
            this.loadCities();
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
                        '<h1 class="header-title">城市地图</h1>',
                    '</div>',
                    
                    '<div class="home-sections" id="cities-container"></div>',

                    '<div class="tabbar">',
                        '<div class="tabbar-item" data-page="home">',
                            '<span class="tabbar-icon">🏠</span>',
                            '<span class="tabbar-text">首页</span>',
                        '</div>',
                        '<div class="tabbar-item active" data-page="cities">',
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

        loadCities: function() {
            var self = this;
            API.game.getCities()
                .then(function(result) {
                    if (result.code === 0) {
                        self.cities = result.data || [];
                        self.renderCities();
                    }
                })
                .catch(function(error) {
                    console.error('Load cities error:', error);
                });
        },

        renderCities: function() {
            var container = document.getElementById('cities-container');
            if (!container) return;

            var html = '';
            this.cities.forEach(function(city) {
                var emoji = Utils.getCityEmoji(city.name);
                var goodsEmoji = Utils.getGoodsEmoji(city.goods_type);
                var isUnlocked = city.unlocked;
                var unlockCost = city.unlock_cost || 0;

                html += [
                    '<div class="city-item ', (!isUnlocked ? 'locked' : ''), '">',
                        '<div class="city-header">',
                            '<span class="city-emoji">', emoji, '</span>',
                            '<div class="city-info">',
                                '<div class="city-name">', city.name, '</div>',
                                '<div class="city-distance">📍 距离起点 ', city.distance, ' km</div>',
                            '</div>',
                        '</div>',
                        '<div class="city-details">',
                            '<span class="city-goods">', goodsEmoji, ' 特产: ', city.goods_type, ' (', city.goods_price, '金币/吨)</span>',
                        '</div>'
                ].join('');

                if (!isUnlocked) {
                    var userGold = (CitiesPage.user && CitiesPage.user.gold) || 0;
                    var canUnlock = userGold >= unlockCost;
                    html += [
                        '<div class="card-footer" style="padding:12px 0 0;margin-top:12px;border-top:1px solid var(--punk-border);">',
                            '<button class="btn ', (canUnlock ? 'btn-primary' : 'btn-outline btn-disabled'), ' btn-block" onclick="CitiesPage.unlockCity(\'', city.name, '\')">',
                                '🔓 解锁 (', Utils.formatNumber(unlockCost), ' 金币)',
                            '</button>',
                        '</div>'
                    ].join('');
                } else {
                    html += [
                        '<div class="city-details" style="margin-top:8px;">',
                            '<span class="badge badge-green">已解锁</span>',
                            '<span style="margin-left:8px;">车站等级: Lv.', city.station_level, '</span>',
                        '</div>'
                    ].join('');
                }

                html += '</div>';
            });

            container.innerHTML = html;
        },

        unlockCity: function(cityId) {
            Utils.showLoading();
            API.game.unlockCity(cityId)
                .then(function(result) {
                    Utils.hideLoading();
                    if (result.code === 0) {
                        var data = result.data;
                        if (data.user_gold !== undefined) {
                            Auth.updateGold(data.user_gold);
                            CitiesPage.user = Auth.getUser();
                        }
                        Utils.showToast('解锁成功！');
                        CitiesPage.loadCities();
                    }
                })
                .catch(function(error) {
                    Utils.hideLoading();
                    Utils.showToast(error.message || '解锁失败');
                });
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
        }
    };

    window.CitiesPage = CitiesPage;
    Router.register('cities', CitiesPage);
})();
