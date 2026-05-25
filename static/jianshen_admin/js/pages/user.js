const UserPage = {
    state: { page: 1, pageSize: 10, keyword: '', status: '' },

    async render() {
        if (!AuthService.requireAuth()) return;
        Layout.render('<div class="loading"><div class="spinner"></div></div>', '用户管理');
        await this.load();
    },

    async load() {
        try {
            const params = { page: this.state.page, page_size: this.state.pageSize };
            if (this.state.keyword) params.keyword = this.state.keyword;
            if (this.state.status !== '') params.status = this.state.status;
            const res = await ApiService.get('/jianshen/admin/user/list/get', params);
            if (res.code === 0) {
                this.renderList(res.data);
            }
        } catch (e) {
            console.error(e);
        }
    },

    renderList(data) {
        const items = data.items || [];
        const rows = items.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${u.username}</td>
                <td>${u.nickname || '-'}</td>
                <td>${u.email || '-'}</td>
                <td>Lv.${u.level} (${u.exp} exp)</td>
                <td>${u.total_checkins || 0}</td>
                <td>${u.consecutive_days || 0}</td>
                <td><span class="badge ${u.status === 0 ? 'badge-active' : 'badge-disabled'}">${u.status === 0 ? '正常' : '禁用'}</span></td>
                <td style="white-space: nowrap;">
                    ${u.status === 0
                        ? `<button class="btn btn-warning btn-sm" onclick="UserPage.disable(${u.id})">禁用</button>`
                        : `<button class="btn btn-success btn-sm" onclick="UserPage.enable(${u.id})">启用</button>`
                    }
                    <button class="btn btn-danger btn-sm" onclick="UserPage.remove(${u.id})">删除</button>
                </td>
            </tr>
        `).join('');
        Layout.renderPage(`
            <div class="card">
                <div class="card-header">
                    <h2>👥 用户列表 (${data.total})</h2>
                </div>
                <div class="toolbar">
                    <input class="search-input" placeholder="搜索用户名/昵称/邮箱" value="${this.state.keyword}" id="user-search">
                    <select class="select-input" id="user-status">
                        <option value="">全部状态</option>
                        <option value="0" ${this.state.status === '0' ? 'selected' : ''}>正常</option>
                        <option value="1" ${this.state.status === '1' ? 'selected' : ''}>禁用</option>
                    </select>
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th><th>用户名</th><th>昵称</th><th>邮箱</th>
                                <th>等级</th><th>总打卡</th><th>连续天数</th><th>状态</th><th>操作</th>
                            </tr>
                        </thead>
                        <tbody>${rows || '<tr><td colspan="9" class="empty">暂无数据</td></tr>'}</tbody>
                    </table>
                </div>
                <div class="pagination">
                    <span class="info">共 ${data.total} 条</span>
                    <button class="page-btn" ${data.page <= 1 ? 'disabled' : ''} onclick="UserPage.changePage(${data.page - 1})">上一页</button>
                    <button class="page-btn active">${data.page} / ${data.total_pages || 1}</button>
                    <button class="page-btn" ${data.page >= data.total_pages ? 'disabled' : ''} onclick="UserPage.changePage(${data.page + 1})">下一页</button>
                </div>
            </div>
        `, '用户管理');
        document.getElementById('user-search').addEventListener('change', (e) => {
            this.state.keyword = e.target.value;
            this.state.page = 1;
            this.load();
        });
        document.getElementById('user-status').addEventListener('change', (e) => {
            this.state.status = e.target.value;
            this.state.page = 1;
            this.load();
        });
    },

    changePage(page) {
        this.state.page = page;
        this.load();
    },

    async disable(id) {
        if (!confirm('确定要禁用该用户吗？')) return;
        const res = await ApiService.post(`/jianshen/admin/user/disable?user_id=${id}`);
        if (res.code === 0) { Toast.success('已禁用'); this.load(); } else Toast.error(res.msg);
    },

    async enable(id) {
        const res = await ApiService.post(`/jianshen/admin/user/enable?user_id=${id}`);
        if (res.code === 0) { Toast.success('已启用'); this.load(); } else Toast.error(res.msg);
    },

    async remove(id) {
        if (!confirm('确定要删除该用户吗？此操作不可恢复！')) return;
        const res = await ApiService.post(`/jianshen/admin/user/delete?user_id=${id}`);
        if (res.code === 0) { Toast.success('已删除'); this.load(); } else Toast.error(res.msg);
    }
};
