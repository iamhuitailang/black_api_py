const SellOrdersPage = {
    orders: [],
    currentTab: 'all',
    tabs: [
        { value: 'all', label: '全部' },
        { value: '0', label: '待付款' },
        { value: '1', label: '待发货' },
        { value: '2', label: '待收货' },
        { value: '4', label: '已完成' }
    ],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <div class="header">
                    <div class="header-back" onclick="Router.navigate('profile')">‹</div>
                    <div class="header-title">我卖出的</div>
                </div>
                
                <div class="home-tabs">
                    ${this.tabs.map(tab => `
                        <div class="home-tab ${this.currentTab === tab.value ? 'active' : ''}" data-tab="${tab.value}">
                            ${tab.label}
                        </div>
                    `).join('')}
                </div>
                
                <div class="order-list" id="orderList">
                    <div class="text-center text-secondary" style="padding:40px;">加载中...</div>
                </div>
                
                <div class="tabbar">
                    <div class="tabbar-item" data-page="home">
                        <div class="tabbar-icon">🏠</div>
                        <div class="tabbar-text">首页</div>
                    </div>
                    <div class="tabbar-item" data-page="orders">
                        <div class="tabbar-icon">📋</div>
                        <div class="tabbar-text">订单</div>
                    </div>
                    <div class="tabbar-item" data-page="favorites">
                        <div class="tabbar-icon">❤️</div>
                        <div class="tabbar-text">收藏</div>
                    </div>
                    <div class="tabbar-item active" data-page="profile">
                        <div class="tabbar-icon">👤</div>
                        <div class="tabbar-text">我的</div>
                    </div>
                </div>
            </div>
        `;
        this.bindEvents();
        await this.loadOrders();
    },

    bindEvents() {
        document.querySelectorAll('.tabbar-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                Router.navigate(page);
            });
        });

        document.querySelectorAll('.home-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentTab = tab.dataset.tab;
                document.querySelectorAll('.home-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.loadOrders();
            });
        });
    },

    async loadOrders() {
        try {
            const params = { page: 1, page_size: 20 };
            if (this.currentTab !== 'all') {
                params.status = parseInt(this.currentTab);
            }

            const result = await ApiService.order.getSellerList(params);
            if (result.code === 0) {
                this.orders = result.data.items;
                this.renderOrders();
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (e) {
            Toast.error('加载失败');
        }
    },

    renderOrders() {
        const container = document.getElementById('orderList');
        
        if (this.orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💰</div>
                    <div class="empty-state-text">暂无卖出订单</div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.orders.map(order => `
            <div class="order-item" data-order-id="${order.id}">
                <div class="order-header">
                    <span class="order-no">订单号：${order.order_no}</span>
                    <span class="order-status">${Utils.getOrderStatusText(order.status)}</span>
                </div>
                <div class="order-book">
                    <div class="order-book-image">📖</div>
                    <div class="order-book-info">
                        <div class="order-book-title">${Utils.escapeHtml(order.book_title || '教材')}</div>
                        <div class="order-book-author">x${order.quantity || 1}</div>
                        <div class="order-book-price">¥${Utils.formatPrice(order.price)}</div>
                    </div>
                </div>
                <div class="order-footer">
                    <span class="order-total">共${order.quantity || 1}件商品 合计：<span class="price">¥${Utils.formatPrice(order.total_price)}</span></span>
                    <div class="order-actions">
                        ${this.getOrderActions(order)}
                    </div>
                </div>
            </div>
        `).join('');

        this.bindOrderEvents();
    },

    getOrderActions(order) {
        const status = order.status;

        switch (status) {
            case 1:
                return `<button class="btn btn-primary btn-sm" data-action="ship" data-id="${order.id}">发货</button>`;
            case 2:
                return `<span class="text-secondary" style="font-size:12px;">等待买家收货</span>`;
            default:
                return '';
        }
    },

    bindOrderEvents() {
        const container = document.getElementById('orderList');

        container.querySelectorAll('[data-action="ship"]').forEach(btn => {
            btn.addEventListener('click', () => this.handleShip(parseInt(btn.dataset.id)));
        });
    },

    async handleShip(orderId) {
        Utils.showLoading();
        try {
            const result = await ApiService.order.ship(orderId, {});
            if (result.code === 0) {
                Toast.success('已发货');
                this.loadOrders();
            } else {
                Toast.error(result.msg || '发货失败');
            }
        } catch (e) {
            Toast.error('发货失败');
        } finally {
            Utils.hideLoading();
        }
    }
};

window.SellOrdersPage = SellOrdersPage;
