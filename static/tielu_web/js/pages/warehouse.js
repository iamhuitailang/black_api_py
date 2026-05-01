(function() {
    'use strict';

    var WarehousePage = {
        warehouse: [],
        cities: [],

        onShow: function(params) {
            if (!Auth.isLoggedIn()) {
                Router.navigate('login');
                return;
            }
            this.loadWarehouse();
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
                        '<h1 class="header-title">我的仓库</h1>',
                    '</div>',
                    
                    '<div class="home-sections" id="warehouse-container"></div>',

                    '<div class="tabbar">',
                        '<div class="tabbar-item" data-page="home">',
                            '<span class="tabbar-icon">🏠</span>',
                            '<span class="tabbar-text">首页</span>',
                        '</div>',
                        '<div class="tabbar-item" data-page="cities">',
                            '<span class="tabbar-icon">🏙️</span>',
                            '<span class="tabbar-text">城市</span>',
                        '</div>',
                        '<div class="tabbar-item active" data-page="warehouse">',
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

        loadWarehouse: function() {
            var self = this;
            API.game.getWarehouse()
                .then(function(result) {
                    if (result.code === 0) {
                        self.warehouse = result.data || [];
                        self.renderWarehouse();
                    }
                })
                .catch(function(error) {
                    console.error('Load warehouse error:', error);
                });
        },

        renderWarehouse: function() {
            var container = document.getElementById('warehouse-container');
            if (!container) return;

            if (this.warehouse.length === 0) {
                container.innerHTML = [
                    '<div class="empty-state">',
                        '<div class="empty-state-icon">📦</div>',
                        '<div class="empty-state-text">仓库空空如也</div>',
                        '<div class="empty-state-text" style="font-size:12px;margin-top:8px;">运输货物后可以在这里查看</div>',
                    '</div>'
                ].join('');
                return;
            }

            var cityGroups = {};
            this.warehouse.forEach(function(item) {
                var cityName = item.city_name || '未知城市';
                if (!cityGroups[cityName]) {
                    cityGroups[cityName] = [];
                }
                cityGroups[cityName].push(item);
            });

            var html = '';
            for (var cityName in cityGroups) {
                var items = cityGroups[cityName];
                var cityEmoji = Utils.getCityEmoji(cityName);
                
                html += '<div class="warehouse-section">';
                html += '<div class="warehouse-city-header">';
                html += '<span class="warehouse-city-name">' + cityEmoji + ' ' + cityName + '</span>';
                html += '</div>';
                html += '<div class="list" style="margin:0;border-radius:0;border-top:none;">';

                items.forEach(function(item) {
                    var goodsEmoji = Utils.getGoodsEmoji(item.goods_type);
                    html += [
                        '<div class="warehouse-goods-item">',
                            '<span class="warehouse-goods-emoji">', goodsEmoji, '</span>',
                            '<div class="warehouse-goods-info">',
                                '<div class="warehouse-goods-name">', item.goods_type, '</div>',
                                '<div class="warehouse-goods-price">单价: ', item.goods_price, ' 金币/吨</div>',
                            '</div>',
                            '<span class="warehouse-goods-amount">', item.amount, ' 吨</span>',
                        '</div>'
                    ].join('');
                });

                html += '</div>';
                html += '</div>';
            }

            container.innerHTML = html;
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

    window.WarehousePage = WarehousePage;
    Router.register('warehouse', WarehousePage);
})();
