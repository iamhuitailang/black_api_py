const OrderHallPage = {
    orders: [],

    async render() {
        if (!Auth.checkAuth()) return;

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <div class="header">
                    <span class="header-title">订单大厅</span>
                    <div class="header-action" id="refreshBtn">刷新</div>
                </div>

                <div class="order-list" id="orderList">
                    <div class="empty-state">
                        <div class="empty-state-icon">⏳</div>
                        <div class="empty-state-text">加载中...</div>
                    </div>
                </div>

                ${this.getTabbar()}
            </div>
        `;

        this.bindEvents();
        await this.loadOrders();
    },

    getTabbar() {
        return `
            <div class="tabbar">
                <div class="tabbar-item" data-route="home">
                    <span class="tabbar-icon">🏠</span>
                    <span class="tabbar-text">首页</span>
                </div>
                <div class="tabbar-item active" data-route="order-hall">
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
    },

    async loadOrders() {
        try {
            const result = await API.get('/order/pending/get');
            if (result.code === 200) {
                this.orders = result.data || [];
                this.renderOrderList();
            }
        } catch (e) {
            console.error('Load orders error:', e);
            this.renderDemoOrders();
        }
    },

    renderDemoOrders() {
        const demoOrders = [
            { 
                id: 101, 
                category_name: '纸类', 
                weight: 15, 
                total_price: 15.00, 
                address: '阳光小区3栋2单元501室',
                contact_name: '张先生',
                contact_phone: '13800138001',
                created_at: new Date().toISOString()
            },
            { 
                id: 102, 
                category_name: '塑料', 
                weight: 8, 
                total_price: 16.00, 
                address: '幸福家园1栋1单元1002室',
                contact_name: '李女士',
                contact_phone: '13800138002',
                created_at: new Date().toISOString()
            },
            { 
                id: 103, 
                category_name: '金属', 
                weight: 20, 
                total_price: 70.00, 
                address: '温馨花园5栋3单元301室',
                contact_name: '王女士',
                contact_phone: '13800138003',
                created_at: new Date().toISOString()
            }
        ];

        this.orders = demoOrders;
        this.renderOrderList();
    },

    renderOrderList() {
        const listEl = document.getElementById('orderList');
        if (!listEl) return;

        if (this.orders.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">暂无可接订单</div>
                </div>
            `;
            return;
        }

        listEl.innerHTML = this.orders.map(order => this.renderOrderItem(order)).join('');
    },

    renderOrderItem(order) {
        const categoryName = order.category_name || '废品回收';
        const totalPrice = order.total_price ? order.total_price.toFixed(2) : '0.00';
        const time = this.formatTime(order.created_at);

        return `
            <div class="order-item" data-id="${order.id}">
                <div class="order-header">
                    <span class="order-id">订单号: ${order.id}</span>
                    <span class="badge badge-warning">待接单</span>
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
                            <div class="order-price-label">预估收入</div>
                        </div>
                    </div>
                    <div class="order-address">
                        <span class="order-address-icon">📍</span>
                        <span class="order-address-text">${order.address || '待填写'}</span>
                    </div>
                    ${order.contact_name ? `
                    <div style="display: flex; align-items: center; padding-top: 10px; border-top: 1px solid var(--border-color); margin-top: 10px;">
                        <span style="font-size: 16px; margin-right: 8px;">👤</span>
                        <span style="font-size: 13px; color: var(--text-secondary); flex: 1;">
                            ${order.contact_name} · ${order.contact_phone || ''}
                        </span>
                    </div>
                    ` : ''}
                </div>
                <div class="order-footer">
                    <button class="btn btn-primary btn-sm accept-btn" data-id="${order.id}">立即接单</button>
                    <button class="btn btn-outline btn-sm view-btn" data-id="${order.id}">查看详情</button>
                </div>
            </div>
        `;
    },

    formatTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = (now - date) / 1000;

        if (diff < 60) return '刚刚';
        if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
        return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },

    bindEvents() {
        const tabbarItems = document.querySelectorAll('.tabbar-item');
        tabbarItems.forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                Router.navigate(route);
            });
        });

        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadOrders();
        });

        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('accept-btn')) {
                const orderId = e.target.dataset.id;
                await this.acceptOrder(orderId);
            }

            if (e.target.classList.contains('view-btn')) {
                const orderId = e.target.dataset.id;
                Router.navigate('order-detail', { id: orderId });
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
