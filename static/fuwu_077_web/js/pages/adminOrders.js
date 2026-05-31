const AdminOrdersPage = {
    orders: [],
    currentStatus: '',
    showAssignModal: false,
    assignOrderId: null,
    staffList: [],

    async render() {
        const app = document.getElementById('app');
        const admin = AuthService.getCurrentUser();

        app.innerHTML = `
            <div class="admin-container">
                <aside class="admin-sidebar">
                    <div class="admin-logo">🏠 家政管理</div>
                    <nav class="admin-menu">
                        <a href="#admin/dashboard" class="menu-item">
                            <span class="menu-icon">📊</span>
                            <span class="menu-text">数据概览</span>
                        </a>
                        <a href="#admin/services" class="menu-item">
                            <span class="menu-icon">🛠️</span>
                            <span class="menu-text">服务管理</span>
                        </a>
                        <a href="#admin/orders" class="menu-item active">
                            <span class="menu-icon">📋</span>
                            <span class="menu-text">订单管理</span>
                        </a>
                        <a href="#admin/staff" class="menu-item">
                            <span class="menu-icon">👥</span>
                            <span class="menu-text">人员管理</span>
                        </a>
                    </nav>
                    <div class="admin-user">
                        <span class="admin-avatar">${admin?.name?.charAt(0) || 'A'}</span>
                        <div class="admin-info">
                            <p class="admin-name">${admin?.name || '管理员'}</p>
                            <a href="#" class="logout-link" id="adminLogout">退出登录</a>
                        </div>
                    </div>
                </aside>

                <main class="admin-main">
                    <header class="admin-header">
                        <h1>订单管理</h1>
                    </header>

                    <div class="admin-content">
                        <div class="filter-bar">
                            <select id="statusFilter">
                                <option value="">全部状态</option>
                                <option value="pending">待分配</option>
                                <option value="assigned">已分配</option>
                                <option value="confirmed">进行中</option>
                                <option value="completed">已完成</option>
                                <option value="cancelled">已取消</option>
                            </select>
                            <button class="btn btn-outline" id="refreshBtn">刷新</button>
                        </div>

                        <div class="admin-table-container">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>订单号</th>
                                        <th>服务项目</th>
                                        <th>用户</th>
                                        <th>预约时间</th>
                                        <th>价格</th>
                                        <th>状态</th>
                                        <th>服务人员</th>
                                        <th>创建时间</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody id="orderTableBody">
                                    <tr><td colspan="9"><div class="loading">加载中...</div></td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            <div class="modal" id="assignModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>分配服务人员</h3>
                        <button class="modal-close" id="assignModalClose">&times;</button>
                    </div>
                    <form id="assignForm" class="modal-body">
                        <div class="form-group">
                            <label>选择服务人员 *</label>
                            <select id="staffSelect" required>
                                <option value="">请选择服务人员</option>
                            </select>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" id="assignCancel">取消</button>
                            <button type="submit" class="btn btn-primary">确认分配</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        await this.loadData();
        this.bindEvents();
    },

    async loadData() {
        try {
            const [ordersResult, staffResult] = await Promise.all([
                OrderApi.list({ status: this.currentStatus }),
                StaffApi.list()
            ]);

            if (ordersResult.code === 0) {
                this.orders = ordersResult.data.items || [];
            }
            if (staffResult.code === 0) {
                this.staffList = staffResult.data.items || [];
            }

            this.renderTable();
        } catch (error) {
            document.getElementById('orderTableBody').innerHTML = '<tr><td colspan="9"><div class="empty">加载失败</div></td></tr>';
        }
    },

    renderTable() {
        const tbody = document.getElementById('orderTableBody');

        if (this.orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9"><div class="empty">暂无数据</div></td></tr>';
            return;
        }

        let html = '';
        this.orders.forEach(order => {
            html += `
                <tr>
                    <td>${order.order_no}</td>
                    <td>${order.service_name}</td>
                    <td>${order.user_name || '-'}</td>
                    <td>${order.appointment_date} ${order.appointment_time}</td>
                    <td>${Utils.formatPrice(order.price)}</td>
                    <td>
                        <span class="status-badge ${Utils.getStatusClass(order.status)}">
                            ${Utils.getStatusText(order.status)}
                        </span>
                    </td>
                    <td>${order.staff_name || '-'}</td>
                    <td>${Utils.formatDate(order.created_at, 'YYYY-MM-DD HH:mm')}</td>
                    <td>
                        ${order.status === 'pending' ? `
                            <button class="btn btn-sm btn-primary" data-action="assign" data-id="${order.id}">派单</button>
                        ` : ''}
                        ${order.status === 'assigned' ? `
                            <button class="btn btn-sm btn-primary" data-action="confirm" data-id="${order.id}">确认上门</button>
                        ` : ''}
                        ${order.status === 'pending' || order.status === 'assigned' ? `
                            <button class="btn btn-sm btn-danger" data-action="cancel" data-id="${order.id}">取消</button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" data-action="detail" data-id="${order.id}">详情</button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
        this.bindTableEvents();
    },

    bindTableEvents() {
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const action = btn.dataset.action;
                const id = parseInt(btn.dataset.id);

                if (action === 'assign') {
                    this.assignOrderId = id;
                    this.openAssignModal();
                } else if (action === 'confirm') {
                    const confirmed = await Utils.confirm('确认服务人员已上门吗？');
                    if (!confirmed) return;
                    try {
                        const result = await OrderApi.confirm(id);
                        if (result.code === 0) {
                            Utils.showToast('操作成功');
                            this.loadData();
                        } else {
                            Utils.showToast(result.msg || '操作失败', 'error');
                        }
                    } catch (error) {
                        Utils.showToast('操作失败', 'error');
                    }
                } else if (action === 'cancel') {
                    const confirmed = await Utils.confirm('确认取消该订单吗？');
                    if (!confirmed) return;
                    try {
                        const result = await OrderApi.cancel(id);
                        if (result.code === 0) {
                            Utils.showToast('订单已取消');
                            this.loadData();
                        } else {
                            Utils.showToast(result.msg || '操作失败', 'error');
                        }
                    } catch (error) {
                        Utils.showToast('操作失败', 'error');
                    }
                } else if (action === 'detail') {
                    Router.navigate('orderDetail', { id });
                }
            });
        });
    },

    openAssignModal() {
        const select = document.getElementById('staffSelect');
        let options = '<option value="">请选择服务人员</option>';

        this.staffList.forEach(staff => {
            if (staff.status === 1) {
                options += `<option value="${staff.id}">${staff.name} - ${staff.skill || ''}</option>`;
            }
        });

        select.innerHTML = options;
        document.getElementById('assignModal').classList.add('show');
    },

    closeAssignModal() {
        document.getElementById('assignModal').classList.remove('show');
        this.assignOrderId = null;
    },

    bindEvents() {
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.currentStatus = e.target.value;
            this.loadData();
        });

        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadData();
        });

        document.getElementById('assignModalClose').addEventListener('click', () => this.closeAssignModal());
        document.getElementById('assignCancel').addEventListener('click', () => this.closeAssignModal());

        document.getElementById('assignForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const staffId = parseInt(document.getElementById('staffSelect').value);

            if (!staffId) {
                Utils.showToast('请选择服务人员', 'error');
                return;
            }

            try {
                const result = await OrderApi.assign({
                    id: this.assignOrderId,
                    staff_id: staffId
                });

                if (result.code === 0) {
                    Utils.showToast('派单成功');
                    this.closeAssignModal();
                    this.loadData();
                } else {
                    Utils.showToast(result.msg || '派单失败', 'error');
                }
            } catch (error) {
                Utils.showToast('派单失败', 'error');
            }
        });

        document.getElementById('adminLogout').addEventListener('click', async (e) => {
            e.preventDefault();
            const confirmed = await Utils.confirm('确认退出登录吗？');
            if (!confirmed) return;

            await AuthService.logout();
            Utils.showToast('已退出登录');
            Router.navigate('login');
        });
    }
};
