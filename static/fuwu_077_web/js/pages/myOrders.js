const MyOrdersPage = {
    orders: [],
    currentStatus: '',

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page-container">
                <header class="header">
                    <div class="header-content">
                        <button class="back-btn" onclick="Router.navigate('home')">←</button>
                        <h1 class="header-title">我的订单</h1>
                        <div style="width:40px;"></div>
                    </div>
                </header>

                <div class="order-tabs" id="orderTabs">
                    <button class="order-tab active" data-status="">全部</button>
                    <button class="order-tab" data-status="0">待派单</button>
                    <button class="order-tab" data-status="1">已派单</button>
                    <button class="order-tab" data-status="2">进行中</button>
                    <button class="order-tab" data-status="3">已完成</button>
                </div>

                <div class="order-list" id="orderList">
                    <div class="loading">加载中...</div>
                </div>

                <nav class="bottom-nav">
                    <a href="#home" class="nav-item">
                        <span class="nav-icon">🏠</span>
                        <span class="nav-text">首页</span>
                    </a>
                    <a href="#myOrders" class="nav-item active">
                        <span class="nav-icon">📋</span>
                        <span class="nav-text">订单</span>
                    </a>
                    <a href="#notifications" class="nav-item">
                        <span class="nav-icon">🔔</span>
                        <span class="nav-text">消息</span>
                    </a>
                    <a href="#profile" class="nav-item">
                        <span class="nav-icon">👤</span>
                        <span class="nav-text">我的</span>
                    </a>
                </nav>
            </div>
        `;

        this.bindTabEvents();
        await this.loadOrders();
    },

    bindTabEvents() {
        const tabs = document.querySelectorAll('.order-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentStatus = e.target.dataset.status;
                this.loadOrders();
            });
        });
    },

    async loadOrders() {
        document.getElementById('orderList').innerHTML = '<div class="loading">加载中...</div>';
        try {
            const result = await OrderApi.myList({ status: this.currentStatus });
            if (result.code === 0) {
                this.orders = result.data.items || [];
                this.renderOrders();
            } else {
                document.getElementById('orderList').innerHTML = '<div class="empty">加载失败</div>';
            }
        } catch (error) {
            document.getElementById('orderList').innerHTML = '<div class="empty">加载失败</div>';
        }
    },

    renderOrders() {
        const container = document.getElementById('orderList');

        if (this.orders.length === 0) {
            container.innerHTML = '<div class="empty">暂无订单</div>';
            return;
        }

        let html = '';
        this.orders.forEach(order => {
            const apptTime = order.appointment_time || '';
            const normalized = apptTime.replace('T', ' ');
            const apptParts = normalized.split(' ');
            const apptDate = apptParts[0] || '';
            const apptHour = (apptParts[1] || '').substring(0, 5);

            html += `
                <div class="order-card" data-id="${order.id}">
                    <div class="order-header">
                        <span class="order-no">订单号：${order.order_no}</span>
                        <span class="status-badge ${Utils.getStatusClass(order.status)}">${order.status_text || Utils.getStatusText(order.status)}</span>
                    </div>
                    <div class="order-content">
                        <div class="order-service">
                            <h3>${order.service_name}</h3>
                            <p class="order-time">预约时间：${apptDate} ${apptHour}</p>
                            <p class="order-address">地址：${order.address}</p>
                        </div>
                        <div class="order-price">${Utils.formatPrice(order.total_amount)}</div>
                    </div>
                    <div class="order-actions">
                        ${order.status === 2 ? `
                            <button class="btn btn-primary btn-sm" data-action="complete" data-id="${order.id}">确认完成</button>
                        ` : ''}
                        ${order.status === 3 && !order.has_review ? `
                            <button class="btn btn-primary btn-sm" data-action="review" data-id="${order.id}">去评价</button>
                        ` : ''}
                        ${order.status === 0 ? `
                            <button class="btn btn-danger btn-sm" data-action="cancel" data-id="${order.id}">取消订单</button>
                        ` : ''}
                        <button class="btn btn-outline btn-sm" data-action="detail" data-id="${order.id}">查看详情</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        this.bindOrderEvents();
    },

    bindOrderEvents() {
        const container = document.getElementById('orderList');

        container.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const id = btn.dataset.id;

                if (action === 'cancel') {
                    const confirmed = await Utils.confirm('确认取消该订单吗？');
                    if (!confirmed) return;
                    try {
                        const result = await OrderApi.cancel(id);
                        if (result.code === 0) {
                            Utils.showToast('订单已取消');
                            this.loadOrders();
                        } else {
                            Utils.showToast(result.msg || '操作失败', 'error');
                        }
                    } catch (error) {
                        Utils.showToast('操作失败', 'error');
                    }
                } else if (action === 'complete') {
                    const confirmed = await Utils.confirm('确认服务已完成吗？');
                    if (!confirmed) return;
                    try {
                        const result = await OrderApi.complete(id);
                        if (result.code === 0) {
                            Utils.showToast('订单已完成');
                            this.loadOrders();
                        } else {
                            Utils.showToast(result.msg || '操作失败', 'error');
                        }
                    } catch (error) {
                        Utils.showToast('操作失败', 'error');
                    }
                } else if (action === 'review') {
                    Router.navigate('reviewCreate', { orderId: id });
                } else if (action === 'detail') {
                    Router.navigate('orderDetail', { id });
                }
            });
        });

        container.querySelectorAll('.order-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('[data-action]')) {
                    const id = card.dataset.id;
                    Router.navigate('orderDetail', { id });
                }
            });
        });
    }
};
