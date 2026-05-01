(function() {
    'use strict';

    var TransportPage = {
        selectedTrainId: null,
        selectedTrain: null,
        selectedDestination: null,
        selectedGoods: {},
        idleTrains: [],
        cities: [],
        warehouse: [],

        onShow: function(params) {
            if (!Auth.isLoggedIn()) {
                Router.navigate('login');
                return;
            }
            this.selectedTrainId = params && params.trainId ? params.trainId : null;
            this.selectedTrain = null;
            this.selectedDestination = null;
            this.selectedGoods = {};
            this.loadData();
        },

        render: function() {
            var app = document.getElementById('app');
            app.innerHTML = this.getTemplate();
            this.bindEvents();
        },

        getTemplate: function() {
            return [
                '<div class="transport-modal">',
                    '<div class="transport-header">',
                        '<button class="transport-close" onclick="Router.back();">&#10005;</button>',
                        '<h2 class="transport-title">📦 安排运输</h2>',
                    '</div>',
                    '<div class="transport-body" id="transport-body"></div>',
                    '<div class="transport-footer">',
                        '<div class="transport-summary" id="transport-summary"></div>',
                        '<button class="btn btn-primary btn-block btn-lg" id="startTransportBtn" disabled>',
                            '开始运输',
                        '</button>',
                    '</div>',
                '</div>'
            ].join('');
        },

        loadData: function() {
            var self = this;
            Promise.all([
                API.game.getTrains(),
                API.game.getCities(),
                API.game.getWarehouse()
            ]).then(function(results) {
                var trainsResult = results[0];
                var citiesResult = results[1];
                var warehouseResult = results[2];

                if (trainsResult.code === 0) {
                    var allTrains = trainsResult.data || [];
                    self.idleTrains = allTrains.filter(function(t) { return t.status === 'idle'; });
                }
                if (citiesResult.code === 0) {
                    self.cities = citiesResult.data || [];
                }
                if (warehouseResult.code === 0) {
                    self.warehouse = warehouseResult.data || [];
                }

                if (self.selectedTrainId && self.idleTrains.length > 0) {
                    self.selectedTrain = self.idleTrains.find(function(t) { 
                        return t.id === self.selectedTrainId; 
                    });
                    if (!self.selectedTrain) {
                        self.selectedTrain = self.idleTrains[0];
                    }
                } else if (self.idleTrains.length > 0) {
                    self.selectedTrain = self.idleTrains[0];
                }

                self.renderContent();
            }).catch(function(error) {
                console.error('Load transport data error:', error);
                self.renderEmpty();
            });
        },

        renderEmpty: function() {
            var body = document.getElementById('transport-body');
            if (body) {
                body.innerHTML = [
                    '<div class="empty-state">',
                        '<div class="empty-state-icon">🚂</div>',
                        '<div class="empty-state-text">暂无可用的火车</div>',
                        '<div class="empty-state-text" style="font-size:12px;margin-top:8px;">请确保有空闲的火车</div>',
                    '</div>'
                ].join('');
            }
        },

        renderContent: function() {
            var self = this;
            var body = document.getElementById('transport-body');
            if (!body) return;

            if (this.idleTrains.length === 0) {
                this.renderEmpty();
                return;
            }

            var unlockedCities = this.cities.filter(function(c) { return c.unlocked; });
            var currentCity = this.selectedTrain ? this.selectedTrain.current_city : null;
            var availableDestinations = unlockedCities.filter(function(c) { 
                return c.name !== currentCity; 
            });

            var html = '';

            html += '<div class="transport-section">';
            html += '<div class="transport-section-title">选择火车</div>';
            html += '<div class="city-selector">';
            this.idleTrains.forEach(function(train) {
                var emoji = Utils.getTrainEmoji(train.train_type);
                var isSelected = self.selectedTrain && self.selectedTrain.id === train.id;
                var capacity = train.level * 10 + 10;
                html += [
                    '<div class="city-option ', (isSelected ? 'selected' : ''), '" data-train-id="', train.id, '">',
                        '<div class="city-option-emoji">', emoji, '</div>',
                        '<div class="city-option-name">', train.train_type, '</div>',
                        '<div style="font-size:10px;color:var(--punk-text-dim);margin-top:4px;">',
                            '载重 ', capacity, '吨 · Lv.', train.level,
                        '</div>',
                    '</div>'
                ].join('');
            });
            html += '</div>';
            html += '</div>';

            if (this.selectedTrain) {
                html += '<div class="transport-section">';
                html += '<div class="transport-section-title">当前位置</div>';
                var currentCityInfo = this.cities.find(function(c) { return c.name === self.selectedTrain.current_city; });
                var currentEmoji = currentCityInfo ? Utils.getCityEmoji(currentCityInfo.name) : '🏙️';
                html += [
                    '<div class="city-option" style="opacity:0.7;">',
                        '<div class="city-option-emoji">', currentEmoji, '</div>',
                        '<div class="city-option-name">', self.selectedTrain.current_city, '</div>',
                    '</div>'
                ].join('');
                html += '</div>';

                html += '<div class="transport-section">';
                html += '<div class="transport-section-title">选择目的地</div>';
                if (availableDestinations.length === 0) {
                    html += '<div class="empty-state" style="padding:20px;"><div class="empty-state-text">暂无可用目的地</div></div>';
                } else {
                    html += '<div class="city-selector">';
                    availableDestinations.forEach(function(city) {
                        var emoji = Utils.getCityEmoji(city.name);
                        var isSelected = self.selectedDestination === city.name;
                        html += [
                            '<div class="city-option ', (isSelected ? 'selected' : ''), '" data-city="', city.name, '" data-distance="', city.distance, '">',
                                '<div class="city-option-emoji">', emoji, '</div>',
                                '<div class="city-option-name">', city.name, '</div>',
                                '<div style="font-size:10px;color:var(--punk-text-dim);margin-top:4px;">',
                                    city.distance, ' km · 特产: ', city.goods_type,
                                '</div>',
                            '</div>'
                        ].join('');
                    });
                    html += '</div>';
                }
                html += '</div>';

                if (this.selectedDestination) {
                    var destInfo = this.cities.find(function(c) { return c.name === self.selectedDestination; });
                    var currentCityName = self.selectedTrain.current_city;
                    var availableGoods = self.warehouse.filter(function(w) {
                        return w.city_name === currentCityName;
                    });

                    html += '<div class="transport-section">';
                    html += '<div class="transport-section-title">选择货物</div>';
                    if (availableGoods.length === 0) {
                        html += [
                            '<div class="empty-state" style="padding:20px;">',
                                '<div class="empty-state-text">', currentCityName, '暂无货物</div>',
                                '<div style="font-size:11px;color:var(--punk-text-dim);margin-top:4px;">',
                                    '该城市特产将自动装载',
                                '</div>',
                            '</div>'
                        ].join('');
                    } else {
                        html += '<div class="goods-selector">';
                        var capacity = self.selectedTrain.level * 10 + 10;
                        var totalSelected = self.getSelectedTotal();
                        
                        availableGoods.forEach(function(item) {
                            var emoji = Utils.getGoodsEmoji(item.goods_type);
                            var selectedAmount = self.selectedGoods[item.goods_type] || 0;
                            var canIncrease = totalSelected < capacity && selectedAmount < item.amount;
                            var canDecrease = selectedAmount > 0;

                            html += [
                                '<div class="goods-option">',
                                    '<div class="goods-option-emoji">', emoji, '</div>',
                                    '<div class="goods-option-info">',
                                        '<div class="goods-option-name">', item.goods_type, '</div>',
                                        '<div class="goods-option-stock">库存: ', item.amount, ' 吨 · 单价: ', item.goods_price, ' 金币</div>',
                                    '</div>',
                                    '<div class="goods-option-amount">',
                                        '<button class="amount-btn" data-goods="', item.goods_type, '" data-action="decrease" ', 
                                            (canDecrease ? '' : 'disabled'), '>-</button>',
                                        '<span class="amount-text">', selectedAmount, '</span>',
                                        '<button class="amount-btn" data-goods="', item.goods_type, '" data-action="increase" ',
                                            (canIncrease ? '' : 'disabled'), '>+</button>',
                                    '</div>',
                                '</div>'
                            ].join('');
                        });
                        html += '</div>';
                    }
                    html += '</div>';
                }
            }

            body.innerHTML = html;
            this.updateSummary();
            this.bindContentEvents();
        },

        getSelectedTotal: function() {
            var total = 0;
            for (var type in this.selectedGoods) {
                total += this.selectedGoods[type];
            }
            return total;
        },

        updateSummary: function() {
            var summaryEl = document.getElementById('transport-summary');
            var btn = document.getElementById('startTransportBtn');
            if (!summaryEl || !btn) return;

            if (!this.selectedTrain || !this.selectedDestination) {
                summaryEl.innerHTML = '<div style="color:var(--punk-text-dim);text-align:center;">请选择火车和目的地</div>';
                btn.disabled = true;
                return;
            }

            var capacity = this.selectedTrain.level * 10 + 10;
            var speed = this.selectedTrain.level * 30 + 60;
            var destInfo = this.cities.find(function(c) { return c.name === TransportPage.selectedDestination; });
            var currentCityName = this.selectedTrain.current_city;
            var currentCityInfo = this.cities.find(function(c) { return c.name === currentCityName; });
            
            var distance = destInfo && currentCityInfo ? 
                Math.abs(destInfo.distance - currentCityInfo.distance) : 100;
            var travelTime = Math.ceil((distance / speed) * 3600);

            var totalSelected = this.getSelectedTotal();
            var totalValue = 0;
            var cargoHtml = '';

            for (var type in this.selectedGoods) {
                if (this.selectedGoods[type] > 0) {
                    var goodsInfo = this.warehouse.find(function(w) { return w.goods_type === type; });
                    var price = goodsInfo ? goodsInfo.goods_price : 20;
                    totalValue += this.selectedGoods[type] * price;
                    cargoHtml += type + ' x' + this.selectedGoods[type] + ' ';
                }
            }

            summaryEl.innerHTML = [
                '<div class="transport-summary-row">',
                    '<span>载重量</span>',
                    '<span class="summary-value">', totalSelected, '/', capacity, ' 吨</span>',
                '</div>',
                '<div class="transport-summary-row">',
                    '<span>预计时间</span>',
                    '<span class="summary-value time">', Utils.formatTime(travelTime), '</span>',
                '</div>',
                (totalValue > 0 ?
                    '<div class="transport-summary-row">' +
                        '<span>预计收益</span>' +
                        '<span class="summary-value gold">' + Utils.formatNumber(totalValue) + ' 金币</span>' +
                    '</div>' : '')
            ].join('');

            var canStart = totalSelected > 0 || totalSelected === 0;
            btn.disabled = false;
        },

        bindContentEvents: function() {
            var self = this;

            var trainOptions = document.querySelectorAll('[data-train-id]');
            trainOptions.forEach(function(el) {
                el.addEventListener('click', function() {
                    var trainId = parseInt(el.dataset.trainId);
                    self.selectedTrain = self.idleTrains.find(function(t) { return t.id === trainId; });
                    self.selectedDestination = null;
                    self.selectedGoods = {};
                    self.renderContent();
                });
            });

            var cityOptions = document.querySelectorAll('[data-city]');
            cityOptions.forEach(function(el) {
                el.addEventListener('click', function() {
                    self.selectedDestination = el.dataset.city;
                    self.selectedGoods = {};
                    self.renderContent();
                });
            });

            var amountBtns = document.querySelectorAll('.amount-btn');
            amountBtns.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var goodsType = btn.dataset.goods;
                    var action = btn.dataset.action;
                    if (!goodsType || !action) return;

                    var current = self.selectedGoods[goodsType] || 0;
                    var capacity = self.selectedTrain ? self.selectedTrain.level * 10 + 10 : 10;
                    var totalSelected = self.getSelectedTotal();
                    
                    var warehouseItem = self.warehouse.find(function(w) { return w.goods_type === goodsType; });
                    var stock = warehouseItem ? warehouseItem.amount : 0;

                    if (action === 'increase') {
                        if (totalSelected < capacity && current < stock) {
                            self.selectedGoods[goodsType] = current + 1;
                        }
                    } else if (action === 'decrease') {
                        if (current > 0) {
                            self.selectedGoods[goodsType] = current - 1;
                            if (self.selectedGoods[goodsType] === 0) {
                                delete self.selectedGoods[goodsType];
                            }
                        }
                    }
                    self.renderContent();
                });
            });
        },

        startTransport: function() {
            var self = this;
            if (!this.selectedTrain || !this.selectedDestination) {
                Utils.showToast('请选择火车和目的地');
                return;
            }

            var cargo = [];
            for (var type in this.selectedGoods) {
                if (this.selectedGoods[type] > 0) {
                    cargo.push({
                        goods_type: type,
                        amount: this.selectedGoods[type]
                    });
                }
            }

            Utils.showLoading();
            API.game.startTransport(this.selectedTrain.id, this.selectedDestination, cargo)
                .then(function(result) {
                    Utils.hideLoading();
                    if (result.code === 0) {
                        Utils.showToast('运输已开始！');
                        Router.back();
                    }
                })
                .catch(function(error) {
                    Utils.hideLoading();
                    Utils.showToast(error.message || '开始运输失败');
                });
        },

        bindEvents: function() {
            var self = this;
            var startBtn = document.getElementById('startTransportBtn');
            if (startBtn) {
                startBtn.addEventListener('click', function() {
                    self.startTransport();
                });
            }
        },

        onHide: function() {
        }
    };

    window.TransportPage = TransportPage;
    Router.register('transport', TransportPage);
})();
