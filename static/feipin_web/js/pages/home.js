const HomePage = {
    categories: [
        { id: 1, name: '纸类', icon: '📦', color: '#f59e0b' },
        { id: 2, name: '塑料', icon: '🧴', color: '#3b82f6' },
        { id: 3, name: '金属', icon: '⚙️', color: '#6366f1' },
        { id: 4, name: '电子', icon: '📱', color: '#8b5cf6' },
        { id: 5, name: '织物', icon: '👕', color: '#ec4899' },
        { id: 6, name: '家电', icon: '📺', color: '#14b8a6' },
        { id: 7, name: '家具', icon: '🪑', color: '#f97316' },
        { id: 8, name: '更多', icon: '➕', color: '#64748b' }
    ],

    priceReferences: [],

    async render() {
        if (!Auth.checkAuth()) return;

        const user = Auth.getUser();
        const isCollector = user && user.role === 'collector';

        if (isCollector) {
            this.renderCollectorHome();
        } else {
            this.renderUserHome();
        }
    },

    async renderUserHome() {
        const app = document.getElementById('app');
        app.innerHTML = this.getHomeLayout('user');

        await this.loadPriceData();
        this.bindEvents();
    },

    async renderCollectorHome() {
        const app = document.getElementById('app');
        app.innerHTML = this.getHomeLayout('collector');

        await this.loadCollectorStats();
        this.bindCollectorEvents();
    },

    getHomeLayout(mode) {
        if (mode === 'collector') {
            return `
                <div class="page">
                    <div class="collector-dashboard-header">
                        <div class="collector-dashboard-title">今日业绩</div>
                        <div class="collector-dashboard-stats">
                            <div class="collector-dashboard-stat">
                                <div class="collector-dashboard-stat-value" id="todayOrders">0</div>
                                <div class="collector-dashboard-stat-label">今日订单</div>
                            </div>
                            <div class="collector-dashboard-stat">
                                <div class="collector-dashboard-stat-value">¥<span id="todayIncome">0</span></div>
                                <div class="collector-dashboard-stat-label">今日收入</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="collector-dashboard-actions">
                        <div class="collector-dashboard-action" data-route="order-hall">
                            <div class="collector-dashboard-action-icon">📋</div>
                            <div class="collector-dashboard-action-text">订单大厅</div>
                        </div>
                        <div class="collector-dashboard-action" data-route="collector-orders">
                            <div class="collector-dashboard-action-icon">📦</div>
                            <div class="collector-dashboard-action-text">我的订单</div>
                        </div>
                        <div class="collector-dashboard-action" data-route="income">
                            <div class="collector-dashboard-action-icon">💰</div>
                            <div class="collector-dashboard-action-text">收入记录</div>
                        </div>
                        <div class="collector-dashboard-action" data-route="stats">
                            <div class="collector-dashboard-action-icon">📊</div>
                            <div class="collector-dashboard-action-text">我的业绩</div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">
                            <span class="section-title-text">待处理订单</span>
                            <a href="#order-hall" class="section-title-more">查看全部 ></a>
                        </div>
                        <div class="order-list" id="pendingOrdersList">
                            <div class="empty-state">
                                <div class="empty-state-icon">📭</div>
                                <div class="empty-state-text">暂无可接订单</div>
                            </div>
                        </div>
                    </div>

                    ${this.getTabbar()}
                </div>
            `;
        }

        return `
            <div class="page">
                <div class="home-banner">
                    <div class="home-banner-content">
                        <h2 class="home-banner-title">回收宝</h2>
                        <p class="home-banner-subtitle">让每件废品都变废为宝</p>
                        <div class="home-price">
                            <span class="home-price-icon">💰</span>
                            <span class="home-price-text">今日回收参考价格</span>
                        </div>
                    </div>
                </div>

                <div class="home-categories" id="categoriesList">
                    ${this.renderCategories()}
                </div>

                <div class="section">
                    <div class="section-title">
                        <span class="section-title-text">回收参考价格</span>
                        <a href="#price" class="section-title-more">查看全部 ></a>
                    </div>
                    <div class="price-list" id="priceList">
                        ${this.renderPriceLoading()}
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">
                        <span class="section-title-text">附近回收员</span>
                        <a href="#collector" class="section-title-more">查看更多 ></a>
                    </div>
                    <div class="collector-list" id="collectorList">
                        ${this.renderCollectorPreview()}
                    </div>
                </div>

                ${this.getTabbar()}
            </div>
        `;
    },

    renderCategories() {
        return this.categories.map(cat => `
            <div class="home-category" data-id="${cat.id}">
                <div class="home-category-icon">${cat.icon}</div>
                <div class="home-category-text">${cat.name}</div>
            </div>
        `).join('');
    },

    renderPriceLoading() {
        return `
            <div class="price-item">
                <div class="price-item-icon" style="background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;"></div>
                <div class="price-item-info">
                    <div class="price-item-name" style="width: 80px; height: 16px; background: #f0f0f0; border-radius: 4px;"></div>
                    <div class="price-item-desc" style="width: 120px; height: 12px; background: #f0f0f0; border-radius: 4px; margin-top: 6px;"></div>
                </div>
            </div>
        `;
    },

    renderCollectorPreview() {
        const collectors = [
            { name: '张师傅', rating: 4.8, reviews: 156, status: '在线' },
            { name: '李师傅', rating: 4.9, reviews: 203, status: '服务中' },
            { name: '王师傅', rating: 4.7, reviews: 98, status: '在线' }
        ];

        return collectors.map(c => `
            <div class="collector-item">
                <div class="collector-avatar">${c.name.charAt(0)}</div>
                <div class="collector-info">
                    <div class="collector-name">${c.name}</div>
                    <div class="collector-rating">
                        <span class="collector-stars">★★★★★</span>
                        <span class="collector-review-count">${c.rating}分 · ${c.reviews}单</span>
                    </div>
                </div>
                <div class="collector-status">
                    <span class="badge ${c.status === '在线' ? 'badge-success' : 'badge-warning'}">
                        ${c.status}
                    </span>
                </div>
            </div>
        `).join('');
    },

    getTabbar() {
        const user = Auth.getUser();
        const isCollector = user && user.role === 'collector';
        
        if (isCollector) {
            return `
                <div class="tabbar">
                    <div class="tabbar-item active" data-route="home">
                        <span class="tabbar-icon">🏠</span>
                        <span class="tabbar-text">首页</span>
                    </div>
                    <div class="tabbar-item" data-route="order-hall">
                        <span class="tabbar-icon">📋</span>
                        <span class="tabbar-text">订单大厅</span>
                    </div>
                    <div class="tabbar-item" data-route="collector-orders">
                        <span class="tabbar-icon">📦</span>
                        <span class="tabbar-text">我的订单</span>
                    </div>
                    <div class="tabbar-item" data-route="profile">
                        <span class="tabbar-icon">👤</span>
                        <span class="tabbar-text">我的</span>
                    </div>
                </div>
            `;
        }

        return `
            <div class="tabbar">
                <div class="tabbar-item active" data-route="home">
                    <span class="tabbar-icon">🏠</span>
                    <span class="tabbar-text">首页</span>
                </div>
                <div class="tabbar-item" data-route="price">
                    <span class="tabbar-icon">💰</span>
                    <span class="tabbar-text">价格</span>
                </div>
                <div class="tabbar-item" data-route="order">
                    <span class="tabbar-icon">📦</span>
                    <span class="tabbar-text">订单</span>
                </div>
                <div class="tabbar-item" data-route="profile">
                    <span class="tabbar-icon">👤</span>
                    <span class="tabbar-text">我的</span>
                </div>
            </div>
        `;
    },

    async loadPriceData() {
        try {
            const result = await API.get('/category/price/get');
            if (result.code === 200) {
                this.priceReferences = result.data || [];
                this.renderPriceList();
            }
        } catch (e) {
            console.error('Load price error:', e);
            this.renderPriceList();
        }
    },

    renderPriceList() {
        const priceList = document.getElementById('priceList');
        if (!priceList) return;

        const defaultPrices = [
            { name: '纸类', icon: '📦', price: '1.00', unit: '元/公斤', desc: '纸箱、报纸、书本' },
            { name: '塑料', icon: '🧴', price: '2.00', unit: '元/公斤', desc: 'PET、PE、泡沫' },
            { name: '金属', icon: '⚙️', price: '3.50', unit: '元/公斤', desc: '铁、铜、铝' },
            { name: '旧衣服', icon: '👕', price: '0.80', unit: '元/公斤', desc: '衣服、床单' }
        ];

        const prices = this.priceReferences.length > 0 ? 
            this.priceReferences.slice(0, 4).map(p => ({
                name: p.name,
                icon: '📦',
                price: p.price ? p.price.toFixed(2) : '0.00',
                unit: '元/公斤',
                desc: '上门回收'
            })) : defaultPrices;

        priceList.innerHTML = prices.map(p => `
            <div class="price-item">
                <div class="price-item-icon">${p.icon}</div>
                <div class="price-item-info">
                    <div class="price-item-name">${p.name}</div>
                    <div class="price-item-desc">${p.desc}</div>
                </div>
                <div class="price-item-price">
                    <div class="price-item-amount">¥${p.price}</div>
                    <div class="price-item-unit">${p.unit}</div>
                </div>
            </div>
        `).join('');
    },

    async loadCollectorStats() {
        try {
            const user = Auth.getUser();
            if (user && user.balance !== undefined) {
                const balanceEl = document.getElementById('todayIncome');
                if (balanceEl) balanceEl.textContent = user.balance.toFixed(2);
            }

            const result = await API.get('/order/collector/get');
            if (result.code === 200) {
                const orders = result.data || [];
                const today = new Date().toDateString();
                const todayOrders = orders.filter(o => {
                    const orderDate = new Date(o.created_at).toDateString();
                    return orderDate === today;
                });

                const todayOrdersEl = document.getElementById('todayOrders');
                if (todayOrdersEl) todayOrdersEl.textContent = todayOrders.length;

                this.loadPendingOrders();
            }
        } catch (e) {
            console.error('Load stats error:', e);
        }
    },

    async loadPendingOrders() {
        try {
            const result = await API.get('/order/pending/get');
            if (result.code === 200) {
                const orders = result.data || [];
                const listEl = document.getElementById('pendingOrdersList');
                if (listEl) {
                    if (orders.length === 0) {
                        listEl.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-state-icon">📭</div>
                                <div class="empty-state-text">暂无可接订单</div>
                            </div>
                        `;
                    } else {
                        listEl.innerHTML = orders.slice(0, 3).map(order => this.renderOrderItem(order)).join('');
                    }
                }
            }
        } catch (e) {
            console.error('Load pending orders error:', e);
        }
    },

    renderOrderItem(order) {
        const statusMap = {
            'pending': { text: '待接单', class: 'badge-warning' },
            'accepted': { text: '已接单', class: 'badge-info' },
            'completed': { text: '已完成', class: 'badge-success' },
            'cancelled': { text: '已取消', class: 'badge-secondary' }
        };

        const status = statusMap[order.status] || statusMap['pending'];
        const categoryName = order.category_name || '废品回收';
        const totalPrice = order.total_price ? order.total_price.toFixed(2) : '0.00';

        return `
            <div class="order-item" data-id="${order.id}">
                <div class="order-header">
                    <span class="order-id">订单号: ${order.id}</span>
                    <span class="badge ${status.class}">${status.text}</span>
                </div>
                <div class="order-body">
                    <div class="order-category">
                        <div class="order-category-icon">📦</div>
                        <div class="order-category-info">
                            <div class="order-category-name">${categoryName}</div>
                            <div class="order-weight">预估 ${order.weight || 0} 公斤</div>
                        </div>
                        <div class="order-price">
                            <div class="order-price-amount">¥${totalPrice}</div>
                            <div class="order-price-label">预估总价</div>
                        </div>
                    </div>
                    <div class="order-address">
                        <span class="order-address-icon">📍</span>
                        <span class="order-address-text">${order.address || '待填写'}</span>
                    </div>
                </div>
                ${order.status === 'pending' ? `
                <div class="order-footer">
                    <button class="btn btn-primary btn-sm accept-btn" data-id="${order.id}">立即接单</button>
                </div>
                ` : ''}
            </div>
        `;
    },

    bindEvents() {
        const categories = document.querySelectorAll('.home-category');
        categories.forEach(cat => {
            cat.addEventListener('click', () => {
                Router.navigate('create-order', { category: cat.dataset.id });
            });
        });

        const tabbarItems = document.querySelectorAll('.tabbar-item');
        tabbarItems.forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                Router.navigate(route);
            });
        });

        const priceItems = document.querySelectorAll('.price-item');
        priceItems.forEach(item => {
            item.addEventListener('click', () => {
                Router.navigate('price');
            });
        });
    },

    bindCollectorEvents() {
        const actionItems = document.querySelectorAll('.collector-dashboard-action');
        actionItems.forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                Router.navigate(route);
            });
        });

        const tabbarItems = document.querySelectorAll('.tabbar-item');
        tabbarItems.forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                Router.navigate(route);
            });
        });

        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('accept-btn')) {
                const orderId = e.target.dataset.id;
                await this.acceptOrder(orderId);
            }
        });
    },

    async acceptOrder(orderId) {
        try {
            const result = await API.post('/order/accept', { order_id: parseInt(orderId) });
            if (result.code === 200) {
                Toast.success('接单成功');
                setTimeout(() => {
                    Router.navigate('collector-orders');
                }, 500);
            } else {
                Toast.error(result.msg || '接单失败');
            }
        } catch (e) {
            Toast.error('接单失败，请稍后重试');
        }
    }
};
