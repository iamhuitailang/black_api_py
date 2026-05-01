const OrderPage = {
    currentTab: 'all',
    orders: [],

    async render() {
        if (!Auth.checkAuth()) return;

        const user = Auth.getUser();
        const isCollector = user && user.role === 'collector';

        if (isCollector) {
            this.renderCollectorOrders();
        } else {
            this.renderUserOrders();
        }
    },

    async renderUserOrders() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <div class="header">
                    <span class="header-title">我的订单</span>
                </div>

                <div style="display: flex; background-color: var(--card-bg); padding: 8px 12px; gap: 8px;">
                    <button class="btn btn-sm ${this.currentTab === 'all' ? 'btn-primary' : 'btn-outline'}" data-tab="all">
                        全部
                    </button>
                    <button class="btn btn-sm ${this.currentTab === 'pending' ? 'btn-primary' : 'btn-outline'}" data-tab="pending">
                        待接单
                    </button>
                    <button class="btn btn-sm ${this.currentTab === 'accepted' ? 'btn-primary' : 'btn-outline'}" data-tab="accepted">
                        进行中
                    </button>
                    <button class="btn btn-sm ${this.currentTab === 'completed' ? 'btn-primary' : 'btn-outline'}" data-tab="completed">
                        已完成
                    </button>
                </div>

                <div class="order-list" id="orderList">
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <div class="empty-state-text">暂无订单</div>
                    </div>
                </div>

                ${this.getTabbar()}
            </div>
        `;

        this.bindEvents();
        await this.loadOrders();
    },

    async renderCollectorOrders() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <div class="header">
                    <span class="header-title">我的订单</span>
                </div>

                <div style="display: flex; background-color: var(--card-bg); padding: 8px 12px; gap: 8px;">
                    <button class="btn btn-sm ${this.currentTab === 'all' ? 'btn-primary' : 'btn-outline'}" data-tab="all">
                        全部
                    </button>
                    <button class="btn btn-sm ${this.currentTab === 'accepted' ? 'btn-primary' : 'btn-outline'}" data-tab="accepted">
                        进行中
                    </button>
                    <button class="btn btn-sm ${this.currentTab === 'completed' ? 'btn-primary' : 'btn-outline'}" data-tab="completed">
                        已完成
                    </button>
                </div>

                <div class="order-list" id="orderList">
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <div class="empty-state-text">暂无订单</div>
                    </div>
                </div>

                ${this.getCollectorTabbar()}
            </div>
        `;

        this.bindEvents();
        await this.loadCollectorOrders();
    },

    getTabbar() {
        return `
            <div class="tabbar">
                <div class="tabbar-item" data-route="home">
                    <span class="tabbar-icon">🏠</span>
                    <span class="tabbar-text">首页</span>
                </div>
                <div class="tabbar-item" data-route="price">
                    <span class="tabbar-icon">💰</span>
                    <span class="tabbar-text">价格</span>
                </div>
                <div class="tabbar-item active" data-route="order">
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

    getCollectorTabbar() {
        return `
            <div class="tabbar">
                <div class="tabbar-item" data-route="home">
                    <span class="tabbar-icon">🏠</span>
                    <span class="tabbar-text">首页</span>
                </div>
                <div class="tabbar-item" data-route="order-hall">
                    <span class="tabbar-icon">📋</span>
                    <span class="tabbar-text">订单大厅</span>
                </div>
                <div class="tabbar-item active" data-route="collector-orders">
                    <span class="tabbar-icon">📦</span>
                    <span class="tabbar-text">我的订单</span>
                </div>
                <div class="tabbar-item" data-route="profile">
                    <span class="tabbar-icon">👤</span>
                    <span class="tabbar-text">我的</span>
                </div>
            </div>
        `;
    },

    async loadOrders() {
        try {
            const result = await API.get('/order/user/get');
            if (result.code === 200) {
                this.orders = result.data || [];
                this.renderOrderList();
            }
        } catch (e) {
            console.error('Load orders error:', e);
            this.renderOrderList();
        }
    },

    async loadCollectorOrders() {
        try {
            const result = await API.get('/order/collector/get');
            if (result.code === 200) {
                this.orders = result.data || [];
                this.renderOrderList();
            }
        } catch (e) {
            console.error('Load collector orders error:', e);
            this.renderOrderList();
        }
    },

    renderOrderList() {
        const listEl = document.getElementById('orderList');
        if (!listEl) return;

        let filteredOrders = this.orders;
        if (this.currentTab !== 'all') {
            filteredOrders = this.orders.filter(o => o.status === this.currentTab);
        }

        if (filteredOrders.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">暂无订单</div>
                </div>
            `;
            return;
        }

        listEl.innerHTML = filteredOrders.map(order => this.renderOrderItem(order)).join('');
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
                    <button class="btn btn-outline btn-sm cancel-btn" data-id="${order.id}">取消订单</button>
                </div>
                ` : ''}
                ${order.status === 'accepted' ? `
                <div class="order-footer">
                    <button class="btn btn-primary btn-sm contact-btn" data-id="${order.id}">联系回收员</button>
                </div>
                ` : ''}
                ${order.status === 'completed' ? `
                <div class="order-footer">
                    <button class="btn btn-outline btn-sm detail-btn" data-id="${order.id}">查看详情</button>
                    <button class="btn btn-primary btn-sm review-btn" data-id="${order.id}">去评价</button>
                </div>
                ` : ''}
            </div>
        `;
    },

    bindEvents() {
        const tabButtons = document.querySelectorAll('[data-tab]');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentTab = btn.dataset.tab;
                tabButtons.forEach(b => {
                    b.classList.remove('btn-primary');
                    b.classList.add('btn-outline');
                });
                btn.classList.remove('btn-outline');
                btn.classList.add('btn-primary');
                this.renderOrderList();
            });
        });

        const tabbarItems = document.querySelectorAll('.tabbar-item');
        tabbarItems.forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                Router.navigate(route);
            });
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('cancel-btn')) {
                const orderId = e.target.dataset.id;
                this.cancelOrder(orderId);
            }

            if (e.target.classList.contains('contact-btn')) {
                Toast.info('回收员电话: 13800138002');
            }

            if (e.target.classList.contains('detail-btn')) {
                const orderId = e.target.dataset.id;
                Router.navigate('order-detail', { id: orderId });
            }

            if (e.target.classList.contains('review-btn')) {
                const orderId = e.target.dataset.id;
                Router.navigate('review', { id: orderId });
            }

            const orderItem = e.target.closest('.order-item');
            if (orderItem && !e.target.closest('button')) {
                const orderId = orderItem.dataset.id;
                Router.navigate('order-detail', { id: orderId });
            }
        });
    },

    async cancelOrder(orderId) {
        try {
            const result = await API.post('/order/cancel', { order_id: parseInt(orderId) });
            if (result.code === 200) {
                Toast.success('订单已取消');
                await this.loadOrders();
            } else {
                Toast.error(result.msg || '取消失败');
            }
        } catch (e) {
            Toast.error('取消失败，请稍后重试');
        }
    }
};
