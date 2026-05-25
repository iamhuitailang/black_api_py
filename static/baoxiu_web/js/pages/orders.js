const OrdersPage = {
    currentPage: 1,
    pageSize: 10,
    currentFilter: {
        status: null,
        category: null
    },

    render() {
        const params = Router.getParams() || {};
        if (params.status !== undefined) {
            this.currentFilter.status = params.status;
        }

        const user = AuthService.getCurrentUser();
        const role = user?.role;
        const app = document.getElementById('app');
        
        const tabbarHtml = this.getTabbarHtml(role);
        const title = role === 'repairman' ? '工单' : '报修单';
        
        app.className = 'page has-header';
        app.innerHTML = `
            <div class="header">
                <div class="header-back" onclick="Router.back()">←</div>
                <div class="header-title">${title}</div>
            </div>
            <div class="filter-bar">
                <div class="filter-item ${this.currentFilter.status === null ? 'active' : ''}" data-status="">全部</div>
                <div class="filter-item ${this.currentFilter.status == 0 ? 'active' : ''}" data-status="0">待分配</div>
                <div class="filter-item ${this.currentFilter.status == 1 ? 'active' : ''}" data-status="1">已分配</div>
                <div class="filter-item ${this.currentFilter.status == 2 ? 'active' : ''}" data-status="2">维修中</div>
                <div class="filter-item ${this.currentFilter.status == 3 ? 'active' : ''}" data-status="3">已完成</div>
                <div class="filter-item ${this.currentFilter.status == 4 ? 'active' : ''}" data-status="4">已取消</div>
            </div>
            <div id="ordersContent"></div>
            ${tabbarHtml}
        `;

        this.bindEvents();
        this.loadOrders();
    },

    getTabbarHtml(role) {
        if (role === 'admin') {
            return `
            <div class="tabbar tabbar-5">
                <div class="tabbar-item" data-route="home">
                    <div class="tabbar-icon">🏠</div>
                    <div class="tabbar-label">首页</div>
                </div>
                <div class="tabbar-item active" data-route="orders">
                    <div class="tabbar-icon">📋</div>
                    <div class="tabbar-label">报修</div>
                </div>
                <div class="tabbar-item" data-route="users">
                    <div class="tabbar-icon">👥</div>
                    <div class="tabbar-label">用户</div>
                </div>
                <div class="tabbar-item" data-route="statistics">
                    <div class="tabbar-icon">📊</div>
                    <div class="tabbar-label">统计</div>
                </div>
                <div class="tabbar-item" data-route="profile">
                    <div class="tabbar-icon">👤</div>
                    <div class="tabbar-label">我的</div>
                </div>
            </div>
            `;
        } else if (role === 'repairman') {
            return `
            <div class="tabbar">
                <div class="tabbar-item" data-route="home">
                    <div class="tabbar-icon">🏠</div>
                    <div class="tabbar-label">首页</div>
                </div>
                <div class="tabbar-item active" data-route="orders">
                    <div class="tabbar-icon">📋</div>
                    <div class="tabbar-label">工单</div>
                </div>
                <div class="tabbar-item" data-route="notifications">
                    <div class="tabbar-icon">🔔</div>
                    <div class="tabbar-label">消息</div>
                </div>
                <div class="tabbar-item" data-route="profile">
                    <div class="tabbar-icon">👤</div>
                    <div class="tabbar-label">我的</div>
                </div>
            </div>
            `;
        } else {
            return `
            <div class="tabbar">
                <div class="tabbar-item" data-route="home">
                    <div class="tabbar-icon">🏠</div>
                    <div class="tabbar-label">首页</div>
                </div>
                <div class="tabbar-item active" data-route="orders">
                    <div class="tabbar-icon">📋</div>
                    <div class="tabbar-label">报修单</div>
                </div>
                <div class="tabbar-item" data-route="notifications">
                    <div class="tabbar-icon">🔔</div>
                    <div class="tabbar-label">消息</div>
                </div>
                <div class="tabbar-item" data-route="profile">
                    <div class="tabbar-icon">👤</div>
                    <div class="tabbar-label">我的</div>
                </div>
            </div>
            `;
        }
    },

    bindEvents() {
        document.querySelectorAll('.filter-item').forEach(item => {
            item.onclick = () => {
                document.querySelectorAll('.filter-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.currentFilter.status = item.dataset.status === '' ? null : parseInt(item.dataset.status);
                this.currentPage = 1;
                this.loadOrders();
            };
        });

        document.querySelectorAll('.tabbar-item').forEach(item => {
            item.onclick = () => {
                const route = item.dataset.route;
                if (route) {
                    Router.navigate(route);
                }
            };
        });
    },

    async loadOrders() {
        const user = AuthService.getCurrentUser();
        const container = document.getElementById('ordersContent');
        Utils.showLoading(container);

        const params = {
            page: this.currentPage,
            page_size: this.pageSize
        };

        if (this.currentFilter.status !== null) {
            params.status = this.currentFilter.status;
        }

        if (user.role === 'student') {
            params.student_id = user.id;
        } else if (user.role === 'repairman') {
            params.repairman_id = user.id;
            params.include_pending = true;
        }

        try {
            const result = await ApiService.get('/baoxiu/order/list/get', params);
            if (result.code === 0) {
                this.renderOrders(result.data);
            } else {
                Utils.showEmpty(container, '加载失败');
            }
        } catch (error) {
            Utils.showEmpty(container, '加载失败');
        }
    },

    renderOrders(data) {
        const container = document.getElementById('ordersContent');
        const items = data.items || [];

        if (items.length === 0) {
            Utils.showEmpty(container, '暂无报修单');
            return;
        }

        container.innerHTML = items.map(order => `
            <div class="list-item" onclick="Router.navigate('orderDetail', {id: ${order.id}})">
                <div class="list-item-content">
                    <div class="list-item-title">${order.title}</div>
                    <div class="list-item-desc">
                        ${order.category ? `[${order.category}] ` : ''}
                        ${order.student_name || ''} · ${Utils.formatDate(order.created_at)}
                    </div>
                </div>
                <div class="list-item-extra">
                    <span class="status-badge ${Utils.getStatusClass(order.status)}">${Utils.getStatusText(order.status)}</span>
                    <span class="badge ${Utils.getUrgencyClass(order.urgency)}" style="margin-top: 4px;">${Utils.getUrgencyText(order.urgency)}</span>
                </div>
            </div>
        `).join('');
    }
};
