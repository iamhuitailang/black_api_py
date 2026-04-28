var ExchangePage = {
    activeTab: 'received',
    currentPage: 1,
    pageSize: 10,
    hasMore: true,
    
    statusMap: {
        1: { text: '待处理', class: 'badge-warning' },
        2: { text: '已同意', class: 'badge-info' },
        3: { text: '已完成', class: 'badge-success' },
        4: { text: '已拒绝', class: 'badge-danger' },
        5: { text: '已取消', class: 'badge-secondary' }
    },
    
    render: function() {
        if (!Auth.checkAuth()) return;
        
        var app = document.getElementById('app');
        
        app.innerHTML = `
            <div class="page-container with-tabbar">
                <div class="header">
                    <div class="header-left"></div>
                    <div class="header-title">交换管理</div>
                    <div class="header-right"></div>
                </div>
                <div class="filter-section" style="padding: 0; border-bottom: none;">
                    <div class="filter-item ` + (this.activeTab === 'received' ? 'active' : '') + `" onclick="ExchangePage.switchTab('received')">
                        我收到的
                    </div>
                    <div class="filter-item ` + (this.activeTab === 'sent' ? 'active' : '') + `" onclick="ExchangePage.switchTab('sent')">
                        我发起的
                    </div>
                    <div class="filter-item ` + (this.activeTab === 'history' ? 'active' : '') + `" onclick="ExchangePage.switchTab('history')">
                        历史记录
                    </div>
                </div>
                <div class="page-content" id="exchangeContent" style="padding-top: 12px;">
                    <div class="text-center" style="padding: 40px;">
                        <span class="loading"></span> 加载中...
                    </div>
                </div>
                ` + this.renderTabBar('exchange') + `
            </div>
        `;
        
        this.loadExchanges(true);
    },
    
    switchTab: function(tab) {
        this.activeTab = tab;
        this.currentPage = 1;
        this.hasMore = true;
        
        var items = document.querySelectorAll('.filter-item');
        items.forEach(function(item, index) {
            var isActive = (tab === 'received' && index === 0) ||
                          (tab === 'sent' && index === 1) ||
                          (tab === 'history' && index === 2);
            item.classList.toggle('active', isActive);
        });
        
        var container = document.getElementById('exchangeContent');
        container.innerHTML = `<div class="text-center" style="padding: 40px;"><span class="loading"></span> 加载中...</div>`;
        
        this.loadExchanges(true);
    },
    
    loadExchanges: function(refresh) {
        if (refresh) {
            this.currentPage = 1;
            this.hasMore = true;
        }
        
        var url = '';
        if (this.activeTab === 'received') {
            url = '/ex/exchange/received/list/get?page=' + this.currentPage + '&limit=' + this.pageSize;
        } else if (this.activeTab === 'sent') {
            url = '/ex/exchange/sent/list/get?page=' + this.currentPage + '&limit=' + this.pageSize;
        } else {
            url = '/ex/exchange/received/list/get?page=' + this.currentPage + '&limit=' + this.pageSize;
        }
        
        var self = this;
        API.get(url)
            .then(function(response) {
                var data = response.data;
                var exchanges = data.list || data;
                
                var container = document.getElementById('exchangeContent');
                
                if (refresh) {
                    container.innerHTML = '';
                }
                
                if (exchanges.length === 0 && refresh) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="icon">🔄</div>
                            <p>暂无交换记录</p>
                            <button class="btn btn-primary btn-sm" onclick="Router.navigate('/')">去逛逛</button>
                        </div>
                    `;
                } else {
                    exchanges.forEach(function(exchange) {
                        container.innerHTML += self.renderExchangeCard(exchange);
                    });
                }
                
                self.currentPage++;
                if (exchanges.length < self.pageSize) {
                    self.hasMore = false;
                }
            })
            .catch(function(error) {
                var container = document.getElementById('exchangeContent');
                if (refresh) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="icon">❌</div>
                            <p>加载失败: ` + (error.message || '未知错误') + `</p>
                            <button class="btn btn-primary btn-sm" onclick="ExchangePage.loadExchanges(true)">重试</button>
                        </div>
                    `;
                }
            });
    },
    
    renderExchangeCard: function(exchange) {
        var status = this.statusMap[exchange.status] || { text: '未知', class: 'badge-secondary' };
        
        var senderImg = exchange.sender_item_images && exchange.sender_item_images.length > 0 
            ? exchange.sender_item_images[0] 
            : '';
        var receiverImg = exchange.receiver_item_images && exchange.receiver_item_images.length > 0 
            ? exchange.receiver_item_images[0] 
            : '';
        
        var actionsHtml = '';
        
        if (exchange.status === 1) {
            if (this.activeTab === 'received') {
                actionsHtml = `
                    <div class="exchange-actions">
                        <button class="btn btn-sm btn-primary" onclick="ExchangePage.agreeExchange(` + exchange.id + `)">同意</button>
                        <button class="btn btn-sm btn-secondary" onclick="ExchangePage.rejectExchange(` + exchange.id + `)">拒绝</button>
                    </div>
                `;
            } else {
                actionsHtml = `
                    <div class="exchange-actions">
                        <button class="btn btn-sm btn-secondary" onclick="ExchangePage.cancelExchange(` + exchange.id + `)">取消</button>
                    </div>
                `;
            }
        } else if (exchange.status === 2) {
            if (this.activeTab === 'received') {
                actionsHtml = `
                    <div class="exchange-actions">
                        <button class="btn btn-sm btn-primary" onclick="ExchangePage.completeExchange(` + exchange.id + `)">确认完成</button>
                    </div>
                `;
            }
        } else if (exchange.status === 3) {
            actionsHtml = `
                <div class="exchange-actions">
                    <button class="btn btn-sm btn-info" onclick="ExchangePage.reviewExchange(` + exchange.id + `)">去评价</button>
                </div>
            `;
        }
        
        return `
            <div class="exchange-card">
                <div class="exchange-header">
                    <span style="font-size: 13px; color: var(--text-secondary);">
                        ` + (this.activeTab === 'received' 
                            ? (exchange.initiator_nickname || exchange.initiator_phone || '用户') + ' 发起交换'
                            : '向 ' + (exchange.receiver_nickname || exchange.receiver_phone || '用户') + ' 发起交换') + `
                    </span>
                    <span class="badge ` + status.class + `">` + status.text + `</span>
                </div>
                <div class="exchange-items">
                    <div class="exchange-item-left">
                        <img src="` + senderImg + `" class="exchange-item-img" alt="" onerror="this.style.display='none'">
                        <div class="exchange-item-info">
                            <div class="exchange-item-title">` + (exchange.sender_item_title || '-') + `</div>
                        </div>
                    </div>
                    <div class="exchange-arrow">⇄</div>
                    <div class="exchange-item-right">
                        <img src="` + receiverImg + `" class="exchange-item-img" alt="" onerror="this.style.display='none'">
                        <div class="exchange-item-info">
                            <div class="exchange-item-title">` + (exchange.receiver_item_title || '-') + `</div>
                        </div>
                    </div>
                </div>
                ` + (exchange.message ? `<div style="font-size: 13px; color: var(--text-secondary); padding: 0 4px;">💬 ` + exchange.message + `</div>` : '') + `
                <div class="exchange-footer">
                    <span class="exchange-time">` + (exchange.created_at || '') + `</span>
                    ` + actionsHtml + `
                </div>
            </div>
        `;
    },
    
    agreeExchange: function(exchangeId) {
        var self = this;
        API.post('/ex/exchange/agree', { exchange_id: exchangeId })
            .then(function() {
                Toast.success('已同意交换');
                self.loadExchanges(true);
            })
            .catch(function(error) {
                Toast.error(error.message || '操作失败');
            });
    },
    
    rejectExchange: function(exchangeId) {
        var self = this;
        API.post('/ex/exchange/reject', { exchange_id: exchangeId })
            .then(function() {
                Toast.success('已拒绝交换');
                self.loadExchanges(true);
            })
            .catch(function(error) {
                Toast.error(error.message || '操作失败');
            });
    },
    
    cancelExchange: function(exchangeId) {
        var self = this;
        API.post('/ex/exchange/cancel', { exchange_id: exchangeId })
            .then(function() {
                Toast.success('已取消交换');
                self.loadExchanges(true);
            })
            .catch(function(error) {
                Toast.error(error.message || '操作失败');
            });
    },
    
    completeExchange: function(exchangeId) {
        var self = this;
        API.post('/ex/exchange/complete', { exchange_id: exchangeId })
            .then(function() {
                Toast.success('已确认完成交换');
                self.loadExchanges(true);
            })
            .catch(function(error) {
                Toast.error(error.message || '操作失败');
            });
    },
    
    reviewExchange: function(exchangeId) {
        var self = this;
        
        var modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.innerHTML = `
            <div class="modal" style="max-width: 90%;">
                <div class="modal-header">
                    <h3 class="modal-title">评价交换</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').classList.remove('show'); this.closest('.modal-overlay').remove();">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">物品描述相符度</label>
                        <div class="rating-stars" data-type="description">
                            <span class="rating-star" data-value="1">★</span>
                            <span class="rating-star" data-value="2">★</span>
                            <span class="rating-star" data-value="3">★</span>
                            <span class="rating-star" data-value="4">★</span>
                            <span class="rating-star" data-value="5">★</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">沟通态度</label>
                        <div class="rating-stars" data-type="attitude">
                            <span class="rating-star" data-value="1">★</span>
                            <span class="rating-star" data-value="2">★</span>
                            <span class="rating-star" data-value="3">★</span>
                            <span class="rating-star" data-value="4">★</span>
                            <span class="rating-star" data-value="5">★</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">交换效率</label>
                        <div class="rating-stars" data-type="efficiency">
                            <span class="rating-star" data-value="1">★</span>
                            <span class="rating-star" data-value="2">★</span>
                            <span class="rating-star" data-value="3">★</span>
                            <span class="rating-star" data-value="4">★</span>
                            <span class="rating-star" data-value="5">★</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">评语</label>
                        <textarea class="form-control" id="reviewComment" placeholder="写下你的评价..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').classList.remove('show'); this.closest('.modal-overlay').remove();">取消</button>
                    <button class="btn btn-primary" id="submitReview">提交评价</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        var ratings = { description: 0, attitude: 0, efficiency: 0 };
        
        modal.querySelectorAll('.rating-stars').forEach(function(group) {
            var type = group.getAttribute('data-type');
            group.querySelectorAll('.rating-star').forEach(function(star) {
                star.addEventListener('click', function() {
                    var value = parseInt(this.getAttribute('data-value'));
                    ratings[type] = value;
                    group.querySelectorAll('.rating-star').forEach(function(s, i) {
                        s.classList.toggle('active', i < value);
                    });
                });
            });
        });
        
        document.getElementById('submitReview').addEventListener('click', function() {
            if (ratings.description === 0 || ratings.attitude === 0 || ratings.efficiency === 0) {
                Toast.error('请完成所有评分');
                return;
            }
            
            var comment = document.getElementById('reviewComment').value.trim();
            
            var submitBtn = this;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-small"></span> 提交中...';
            
            API.post('/ex/exchange/review', {
                exchange_id: exchangeId,
                description_rating: ratings.description,
                attitude_rating: ratings.attitude,
                efficiency_rating: ratings.efficiency,
                comment: comment || undefined
            })
                .then(function() {
                    Toast.success('评价成功');
                    modal.classList.remove('show');
                    setTimeout(function() {
                        modal.remove();
                    }, 300);
                })
                .catch(function(error) {
                    Toast.error(error.message || '提交失败');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '提交评价';
                });
        });
    },
    
    renderTabBar: function(active) {
        return `
            <div class="tab-bar safe-bottom">
                <div class="tab-item ` + (active === 'home' ? 'active' : '') + `" onclick="Router.navigate('/')">
                    <div class="icon">🏠</div>
                    <div class="label">首页</div>
                </div>
                <div class="tab-item ` + (active === 'exchange' ? 'active' : '') + `" onclick="Router.navigate('/exchange')">
                    <div class="icon">🔄</div>
                    <div class="label">交换</div>
                </div>
                <div class="tab-item ` + (active === 'publish' ? 'active' : '') + `" onclick="Router.navigate('/publish')">
                    <div class="icon">➕</div>
                    <div class="label">发布</div>
                </div>
                <div class="tab-item ` + (active === 'message' ? 'active' : '') + `" onclick="Router.navigate('/message')">
                    <div class="icon">💬</div>
                    <div class="label">消息</div>
                </div>
                <div class="tab-item ` + (active === 'profile' ? 'active' : '') + `" onclick="Router.navigate('/profile')">
                    <div class="icon">👤</div>
                    <div class="label">我的</div>
                </div>
            </div>
        `;
    }
};
