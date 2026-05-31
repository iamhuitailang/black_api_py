const AdminOrdersPage = {
    currentPage: 1, pageSize: 10, currentStatus: null,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div style="display:flex;min-height:100vh">
                ${AdminDashboardPage.renderSidebar('orders')}
                <div class="admin-main">
                    <div class="admin-header">
                        <h2 class="admin-page-title">订单管理</h2>
                        <select class="admin-form-control" id="orderStatusFilter" style="width:auto;padding:6px 12px">
                            <option value="">全部状态</option>
                            <option value="0">待支付</option><option value="1">已支付</option>
                            <option value="2">服务中</option><option value="3">已完成</option>
                            <option value="4">已退款</option><option value="5">已取消</option>
                        </select>
                    </div>
                    <div id="orderTable">加载中...</div>
                </div>
            </div>
        `;
        AdminDashboardPage.bindSidebar();
        document.getElementById('orderStatusFilter').addEventListener('change', (e) => {
            this.currentStatus = e.target.value === '' ? null : parseInt(e.target.value);
            this.currentPage = 1;
            this.loadOrders();
        });
        await this.loadOrders();
    },

    async loadOrders() {
        try {
            const params = { page: this.currentPage, page_size: this.pageSize };
            if (this.currentStatus !== null) params.status = this.currentStatus;
            const result = await ApiService.get('/chongwu09/order/admin/list/get', params);
            if (result.code === 0) {
                const items = result.data.items || [];
                document.getElementById('orderTable').innerHTML = `
                    <table class="admin-table">
                        <thead><tr><th>订单号</th><th>用户</th><th>服务</th><th>宠物</th><th>金额</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead>
                        <tbody>
                            ${items.map(o => `
                                <tr>
                                    <td style="font-size:12px">${o.order_no}</td>
                                    <td>${o.user ? o.user.nickname : '-'}</td>
                                    <td>${o.service ? o.service.title : '-'}</td>
                                    <td>${o.pet ? o.pet.name : '-'}</td>
                                    <td>¥${o.amount}</td>
                                    <td><span class="badge ${Utils.getOrderStatusClass(o.status)}">${o.status_text}</span></td>
                                    <td style="font-size:12px">${Utils.formatTime(o.created_at)}</td>
                                    <td>
                                        ${o.status === 1 ? `<button class="btn btn-primary btn-sm" data-process="${o.id}" data-status="2">开始服务</button>` : ''}
                                        ${o.status === 2 ? `<button class="btn btn-success btn-sm" data-process="${o.id}" data-status="3">完成</button>` : ''}
                                        ${o.status === 1 ? `<button class="btn btn-outline btn-sm" data-process="${o.id}" data-status="4" style="color:var(--danger-color);border-color:var(--danger-color)">退款</button>` : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="pagination">共 ${result.data.total} 条</div>
                `;
                document.querySelectorAll('[data-process]').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const status = parseInt(btn.dataset.status);
                        const action = status === 2 ? '开始服务' : status === 3 ? '完成' : '退款';
                        if (!confirm(`确定${action}？`)) return;
                        try {
                            const result = await ApiService.post('/chongwu09/order/process', { order_id: parseInt(btn.dataset.process), status });
                            if (result.code === 0) { Toast.success('操作成功'); this.loadOrders(); }
                            else { Toast.error(result.msg); }
                        } catch (e) { Toast.error('操作失败'); }
                    });
                });
            }
        } catch (e) { document.getElementById('orderTable').innerHTML = '加载失败'; }
    }
};
