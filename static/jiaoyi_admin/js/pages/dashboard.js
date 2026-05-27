const DashboardPage = {
    data: {
        userCount: 0,
        bookCount: 0,
        orderCount: 0,
        saleAmount: 0
    },

    render() {
        const token = Storage.getToken();
        if (!token) {
            Router.navigate('login');
            return;
        }

        const content = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-card-value" id="userCount">0</div>
                    <div class="stat-card-label">用户总数</div>
                </div>
                <div class="stat-card success">
                    <div class="stat-card-value" id="bookCount">0</div>
                    <div class="stat-card-label">教材总数</div>
                </div>
                <div class="stat-card warning">
                    <div class="stat-card-value" id="orderCount">0</div>
                    <div class="stat-card-label">订单总数</div>
                </div>
                <div class="stat-card danger">
                    <div class="stat-card-value">¥<span id="saleAmount">0</span></div>
                    <div class="stat-card-label">交易总额</div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">最近订单</h3>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>订单编号</th>
                                    <th>教材名称</th>
                                    <th>买家</th>
                                    <th>金额</th>
                                    <th>状态</th>
                                    <th>创建时间</th>
                                </tr>
                            </thead>
                            <tbody id="recentOrders">
                                <tr><td colspan="6" class="text-center text-secondary">加载中...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        Layout.render(content, 'dashboard');
        this.loadData();
    },

    async loadData() {
        try {
            const [statsResult, ordersResult] = await Promise.all([
                Api.get('/statistics/overall/get'),
                Api.get('/order/all/list/get', { page: 1, page_size: 5 })
            ]);

            if (statsResult.code === 0) {
                this.data = statsResult.data;
                this.updateStats();
            }

            if (ordersResult.code === 0) {
                this.renderRecentOrders(ordersResult.data.items || []);
            }
        } catch (error) {
            console.error('加载数据失败:', error);
        }
    },

    updateStats() {
        document.getElementById('userCount').textContent = this.data.userCount || 0;
        document.getElementById('bookCount').textContent = this.data.bookCount || 0;
        document.getElementById('orderCount').textContent = this.data.orderCount || 0;
        document.getElementById('saleAmount').textContent = (this.data.saleAmount || 0).toFixed(2);
    },

    renderRecentOrders(orders) {
        const tbody = document.getElementById('recentOrders');
        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary">暂无订单数据</td></tr>';
            return;
        }

        const statusMap = {
            0: { text: '待支付', class: 'badge-warning' },
            1: { text: '已支付', class: 'badge-info' },
            2: { text: '已发货', class: 'badge-primary' },
            3: { text: '已完成', class: 'badge-success' },
            4: { text: '已取消', class: 'badge-secondary' }
        };

        tbody.innerHTML = orders.map(order => {
            const status = statusMap[order.status] || { text: '未知', class: 'badge-secondary' };
            return `
                <tr>
                    <td>${order.order_no || '-'}</td>
                    <td>${Layout.escapeHtml(order.book_title || '-')}</td>
                    <td>${Layout.escapeHtml(order.buyer_name || '-')}</td>
                    <td>¥${(order.price || 0).toFixed(2)}</td>
                    <td><span class="badge ${status.class}">${status.text}</span></td>
                    <td>${Layout.formatDate(order.created_at)}</td>
                </tr>
            `;
        }).join('');
    }
};
