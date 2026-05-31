const AdminBookingsPage = {
    currentPage: 1, pageSize: 10, currentStatus: null,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div style="display:flex;min-height:100vh">
                ${AdminDashboardPage.renderSidebar('bookings')}
                <div class="admin-main">
                    <div class="admin-header">
                        <h2 class="admin-page-title">预约管理</h2>
                        <select class="admin-form-control" id="statusFilter" style="width:auto;padding:6px 12px">
                            <option value="">全部状态</option>
                            <option value="0">待确认</option><option value="1">已确认</option>
                            <option value="2">寄养中</option><option value="3">已完成</option><option value="4">已取消</option>
                        </select>
                    </div>
                    <div id="bookingTable">加载中...</div>
                </div>
            </div>
        `;
        AdminDashboardPage.bindSidebar();
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.currentStatus = e.target.value === '' ? null : parseInt(e.target.value);
            this.currentPage = 1;
            this.loadBookings();
        });
        await this.loadBookings();
    },

    async loadBookings() {
        try {
            const params = { page: this.currentPage, page_size: this.pageSize };
            if (this.currentStatus !== null) params.status = this.currentStatus;
            const result = await ApiService.get('/chongwu09/booking/admin/list/get', params);
            if (result.code === 0) {
                const items = result.data.items || [];
                document.getElementById('bookingTable').innerHTML = `
                    <table class="admin-table">
                        <thead><tr><th>ID</th><th>用户</th><th>服务</th><th>宠物</th><th>日期</th><th>状态</th><th>操作</th></tr></thead>
                        <tbody>
                            ${items.map(b => `
                                <tr>
                                    <td>${b.id}</td>
                                    <td>${b.user ? b.user.nickname : '-'}</td>
                                    <td>${b.service ? b.service.title : '-'}</td>
                                    <td>${b.pet ? b.pet.name : '-'}</td>
                                    <td>${b.start_date}~${b.end_date}</td>
                                    <td><span class="badge ${Utils.getBookingStatusClass(b.status)}">${b.status_text}</span></td>
                                    <td>
                                        ${b.status === 0 ? `<button class="btn btn-success btn-sm" data-confirm="${b.id}">确认</button><button class="btn btn-outline btn-sm" data-reject="${b.id}" style="color:var(--danger-color);border-color:var(--danger-color)">拒绝</button>` : ''}
                                        ${b.status === 1 ? `<button class="btn btn-primary btn-sm" data-start="${b.id}">开始寄养</button>` : ''}
                                        ${b.status === 2 ? `<button class="btn btn-success btn-sm" data-complete="${b.id}">完成</button>` : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="pagination">共 ${result.data.total} 条</div>
                `;
                this.bindEvents();
            }
        } catch (e) { document.getElementById('bookingTable').innerHTML = '加载失败'; }
    },

    bindEvents() {
        document.querySelectorAll('[data-confirm]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const notes = prompt('管理员备注(可选)') || '';
                try {
                    const result = await ApiService.post('/chongwu09/booking/confirm', { booking_id: parseInt(btn.dataset.confirm), admin_notes: notes });
                    if (result.code === 0) { Toast.success('已确认'); this.loadBookings(); }
                    else { Toast.error(result.msg); }
                } catch (e) { Toast.error('操作失败'); }
            });
        });
        document.querySelectorAll('[data-reject]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const notes = prompt('拒绝原因') || '';
                try {
                    const result = await ApiService.post('/chongwu09/booking/reject', { booking_id: parseInt(btn.dataset.reject), admin_notes: notes });
                    if (result.code === 0) { Toast.success('已拒绝'); this.loadBookings(); }
                    else { Toast.error(result.msg); }
                } catch (e) { Toast.error('操作失败'); }
            });
        });
        document.querySelectorAll('[data-start]').forEach(btn => {
            btn.addEventListener('click', async () => {
                try {
                    const result = await ApiService.post('/chongwu09/booking/start', { booking_id: parseInt(btn.dataset.start) });
                    if (result.code === 0) { Toast.success('操作成功'); this.loadBookings(); }
                    else { Toast.error(result.msg); }
                } catch (e) { Toast.error('操作失败'); }
            });
        });
        document.querySelectorAll('[data-complete]').forEach(btn => {
            btn.addEventListener('click', async () => {
                try {
                    const result = await ApiService.post('/chongwu09/booking/complete', { booking_id: parseInt(btn.dataset.complete) });
                    if (result.code === 0) { Toast.success('操作成功'); this.loadBookings(); }
                    else { Toast.error(result.msg); }
                } catch (e) { Toast.error('操作失败'); }
            });
        });
    }
};
