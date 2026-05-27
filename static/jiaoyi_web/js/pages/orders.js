const OrdersPage = {
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
                    <div class="header-title">我的订单</div>
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
                    <div class="tabbar-item active" data-page="orders">
                        <div class="tabbar-icon">📋</div>
                        <div class="tabbar-text">订单</div>
                    </div>
                    <div class="tabbar-item" data-page="favorites">
                        <div class="tabbar-icon">❤️</div>
                        <div class="tabbar-text">收藏</div>
                    </div>
                    <div class="tabbar-item" data-page="profile">
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

            const result = await ApiService.order.getList(params);
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
                    <div class="empty-state-icon">📋</div>
                    <div class="empty-state-text">暂无订单</div>
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
        const user = AuthService.getUser();
        const isBuyer = order.buyer_id === user?.id;
        const status = order.status;

        if (isBuyer) {
            switch (status) {
                case 0: 
                    return `
                        <button class="btn btn-outline btn-sm" data-action="cancel" data-id="${order.id}">取消</button>
                        <button class="btn btn-primary btn-sm" data-action="pay" data-id="${order.id}">付款</button>
                    `;
                case 2:
                    return `<button class="btn btn-primary btn-sm" data-action="receive" data-id="${order.id}">确认收货</button>`;
                case 3:
                    return `<button class="btn btn-primary btn-sm" data-action="complete" data-id="${order.id}">评价</button>`;
                default:
                    return '';
            }
        } else {
            switch (status) {
                case 1:
                    return `<button class="btn btn-primary btn-sm" data-action="ship" data-id="${order.id}">发货</button>`;
                default:
                    return '';
            }
        }
    },

    bindOrderEvents() {
        const container = document.getElementById('orderList');

        container.querySelectorAll('[data-action="pay"]').forEach(btn => {
            btn.addEventListener('click', () => this.handlePay(parseInt(btn.dataset.id)));
        });

        container.querySelectorAll('[data-action="cancel"]').forEach(btn => {
            btn.addEventListener('click', () => this.handleCancel(parseInt(btn.dataset.id)));
        });

        container.querySelectorAll('[data-action="receive"]').forEach(btn => {
            btn.addEventListener('click', () => this.handleReceive(parseInt(btn.dataset.id)));
        });

        container.querySelectorAll('[data-action="ship"]').forEach(btn => {
            btn.addEventListener('click', () => {
                Toast.info('发货功能开发中');
            });
        });

        container.querySelectorAll('[data-action="complete"]').forEach(btn => {
            btn.addEventListener('click', () => {
                Toast.info('评价功能开发中');
            });
        });
    },

    async handlePay(orderId) {
        Utils.showLoading();
        try {
            const result = await ApiService.order.pay(orderId);
            if (result.code === 0) {
                Toast.success('支付成功');
                this.loadOrders();
            } else {
                Toast.error(result.msg || '支付失败');
            }
        } catch (e) {
            Toast.error('支付失败');
        } finally {
            Utils.hideLoading();
        }
    },

    async handleCancel(orderId) {
        Utils.showLoading();
        try {
            const result = await ApiService.order.cancel(orderId, { reason: '用户取消' });
            if (result.code === 0) {
                Toast.success('已取消');
                this.loadOrders();
            } else {
                Toast.error(result.msg || '取消失败');
            }
        } catch (e) {
            Toast.error('取消失败');
        } finally {
            Utils.hideLoading();
        }
    },

    async handleReceive(orderId) {
        Utils.showLoading();
        try {
            const result = await ApiService.order.receive(orderId);
            if (result.code === 0) {
                Toast.success('已确认收货');
                this.loadOrders();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (e) {
            Toast.error('操作失败');
        } finally {
            Utils.hideLoading();
        }
    }
};

window.OrdersPage = OrdersPage;
