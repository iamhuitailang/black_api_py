(function() {
    'use strict';

    var ShopPage = {
        shopItems: [],
        user: null,

        onShow: function(params) {
            if (!Auth.isLoggedIn()) {
                Router.navigate('login');
                return;
            }
            this.user = Auth.getUser();
            this.loadShop();
        },

        render: function() {
            var app = document.getElementById('app');
            app.innerHTML = this.getTemplate();
            this.bindEvents();
        },

        getTemplate: function() {
            var userGold = (this.user && this.user.gold) || 0;
            return [
                '<div class="page has-header">',
                    '<div class="header">',
                        '<button class="header-back" onclick="Router.back();">&#8592;</button>',
                        '<h1 class="header-title">商店</h1>',
                        '<span class="header-action">💰 ', Utils.formatNumber(userGold), '</span>',
                    '</div>',
                    
                    '<div class="home-banner" style="padding:12px 16px;">',
                        '<div class="home-banner-content">',
                            '<div class="home-banner-title" style="margin-bottom:4px;">火车商店</div>',
                            '<div style="font-size:12px;color:var(--punk-text-dim);">购买更高级的火车，提升运输效率！</div>',
                        '</div>',
                    '</div>',

                    '<div class="home-sections" id="shop-container"></div>',

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
                        '<div class="tabbar-item active" data-page="shop">',
                            '<span class="tabbar-icon">🛒</span>',
                            '<span class="tabbar-text">商店</span>',
                        '</div>',
                    '</div>',
                '</div>'
            ].join('');
        },

        loadShop: function() {
            var self = this;
            API.game.getShop()
                .then(function(result) {
                    if (result.code === 0) {
                        self.shopItems = result.data || [];
                        self.renderShop();
                    }
                })
                .catch(function(error) {
                    console.error('Load shop error:', error);
                });
        },

        renderShop: function() {
            var container = document.getElementById('shop-container');
            if (!container) return;

            var userGold = (this.user && this.user.gold) || 0;
            var userLevel = (this.user && this.user.level) || 1;

            var html = '';
            this.shopItems.forEach(function(item) {
                var emoji = Utils.getTrainEmoji(item.train_type);
                var isLocked = item.required_level > userLevel;
                var canBuy = !isLocked && userGold >= item.price;

                html += [
                    '<div class="shop-item ', (isLocked ? 'locked' : ''), '" data-train-type="', item.train_type, '">',
                        '<div class="shop-header">',
                            '<span class="shop-icon">', emoji, '</span>',
                            '<div class="shop-info">',
                                '<div class="shop-name">', item.train_type, '</div>',
                                '<div class="shop-desc">', item.description, '</div>',
                            '</div>',
                        '</div>',
                        '<div class="shop-stats">',
                            '<span>🚀 速度 ', item.speed, 'km/h</span>',
                            '<span>📦 载重 ', item.capacity, '吨</span>',
                        '</div>',
                        (isLocked ? 
                            '<div style="position:absolute;top:0;left:0;right:0;bottom:0;background-color:rgba(10,10,15,0.7);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--punk-text-dim);font-size:14px;z-index:10;">',
                                '🔒 需要等级 ', item.required_level,
                            '</div>' : 
                            ''),
                        '<div class="shop-price" style="', (isLocked ? 'opacity:0.5;' : ''), '">',
                            '<span class="price-text">💰 ', Utils.formatNumber(item.price), '</span>',
                            '<button class="btn ', (canBuy ? 'btn-primary' : 'btn-outline'), ' btn-sm" ', 
                                (canBuy ? 'onclick="ShopPage.buyTrain(\'' + item.train_type + '\')"' : 'disabled'), '>',
                                '购买',
                            '</button>',
                        '</div>',
                    '</div>'
                ].join('');
            });

            container.innerHTML = html;
        },

        buyTrain: function(trainType) {
            var self = this;
            Utils.showLoading();
            API.game.buyTrain(trainType)
                .then(function(result) {
                    Utils.hideLoading();
                    if (result.code === 0) {
                        var data = result.data;
                        if (data.user_gold !== undefined) {
                            Auth.updateGold(data.user_gold);
                            ShopPage.user = Auth.getUser();
                        }
                        Utils.showToast('购买成功！已添加到车库');
                        ShopPage.loadShop();
                    }
                })
                .catch(function(error) {
                    Utils.hideLoading();
                    Utils.showToast(error.message || '购买失败');
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

    window.ShopPage = ShopPage;
    Router.register('shop', ShopPage);
})();
