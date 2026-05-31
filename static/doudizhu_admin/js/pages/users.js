const UsersPage = {
    page: 1,
    pageSize: 20,
    data: null,

    render() {
        if (!AuthService.requireAuth()) return;

        const content = `
            <div class="page-container">
                <div class="page-toolbar">
                    <div class="search-box">
                        <input type="text" id="searchKeyword" placeholder="搜索用户名/昵称" />
                        <select id="statusFilter">
                            <option value="">全部状态</option>
                            <option value="0">正常</option>
                            <option value="1">禁言</option>
                            <option value="2">封号</option>
                        </select>
                        <button class="btn btn-primary" id="searchBtn">搜索</button>
                    </div>
                </div>

                <div class="table-card">
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>用户名</th>
                                    <th>昵称</th>
                                    <th>等级</th>
                                    <th>金币</th>
                                    <th>胜场</th>
                                    <th>状态</th>
                                    <th>注册时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="userTableBody">
                                <tr><td colspan="9"><div class="loading">加载中...</div></td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination" id="pagination"></div>
                </div>
            </div>
        `;

        const app = document.getElementById('app');
        app.innerHTML = Layout.render(content);
        Layout.setPageTitle('👥 用户管理');
        Layout.init();

        this.bindEvents();
        this.loadData();
    },

    bindEvents() {
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.page = 1;
            this.loadData();
        });

        document.getElementById('searchKeyword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.page = 1;
                this.loadData();
            }
        });
    },

    async loadData() {
        const keyword = document.getElementById('searchKeyword').value;
        const status = document.getElementById('statusFilter').value;
        const params = {
            page: this.page,
            page_size: this.pageSize
        };
        if (keyword) params.keyword = keyword;
        if (status !== '') params.status = parseInt(status);

        const result = await Api.get('/admin/user/list/get', params);
        const tbody = document.getElementById('userTableBody');

        if (result.code === 0 && result.data) {
            this.data = result.data;
            tbody.innerHTML = this.renderTable(result.data.items || []);
            this.renderPagination(result.data);
            this.bindActionEvents();
        } else {
            tbody.innerHTML = '<tr><td colspan="9"><div class="empty">暂无数据</div></td></tr>';
        }
    },

    renderTable(items) {
        if (!items || items.length === 0) {
            return '<tr><td colspan="9"><div class="empty">暂无数据</div></td></tr>';
        }

        const statusMap = { 0: '正常', 1: '禁言', 2: '封号' };
        const statusClassMap = { 0: 'badge-success', 1: 'badge-warning', 2: 'badge-danger' };

        return items.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.nickname || '-'}</td>
                <td>Lv.${user.level || 1}</td>
                <td>${user.coins || 0}</td>
                <td>${user.wins || 0}</td>
                <td>
                    <span class="badge ${statusClassMap[user.status] || 'badge-secondary'}">
                        ${statusMap[user.status] || '未知'}
                    </span>
                </td>
                <td>${new Date(user.created_at).toLocaleString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-small btn-outline" data-action="status" data-id="${user.id}" data-status="0">启用</button>
                        <button class="btn btn-small btn-warning" data-action="status" data-id="${user.id}" data-status="1">禁言</button>
                        <button class="btn btn-small btn-danger" data-action="status" data-id="${user.id}" data-status="2">封号</button>
                        <button class="btn btn-small btn-danger" data-action="delete" data-id="${user.id}">删除</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    renderPagination(data) {
        const pagination = document.getElementById('pagination');
        const total = data.total || 0;
        const totalPages = Math.ceil(total / this.pageSize);

        if (totalPages <= 1) {
            pagination.innerHTML = `<div class="pagination-info">共 ${total} 条</div>`;
            return;
        }

        let html = `<div class="pagination-info">共 ${total} 条</div>`;
        html += '<div class="pagination-buttons">';

        if (this.page > 1) {
            html += `<button class="btn btn-small btn-outline" data-page="${this.page - 1}">上一页</button>`;
        }

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.page - 2 && i <= this.page + 2)) {
                html += `<button class="btn btn-small ${i === this.page ? 'btn-primary' : 'btn-outline'}" data-page="${i}">${i}</button>`;
            } else if (i === this.page - 3 || i === this.page + 3) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
        }

        if (this.page < totalPages) {
            html += `<button class="btn btn-small btn-outline" data-page="${this.page + 1}">下一页</button>`;
        }

        html += '</div>';
        pagination.innerHTML = html;

        pagination.querySelectorAll('button[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.page = parseInt(btn.dataset.page);
                this.loadData();
            });
        });
    },

    bindActionEvents() {
        document.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const action = btn.dataset.action;
                const id = parseInt(btn.dataset.id);

                if (action === 'status') {
                    const status = parseInt(btn.dataset.status);
                    if (!confirm(`确定要更新该用户状态吗？`)) return;

                    const result = await Api.post('/admin/user/status/update', { user_id: id, status });
                    if (result.code === 0) {
                        Toast.success('操作成功');
                        this.loadData();
                    } else {
                        Toast.error(result.msg || '操作失败');
                    }
                } else if (action === 'delete') {
                    if (!confirm('确定要删除该用户吗？此操作不可恢复！')) return;

                    const result = await Api.post('/admin/user/delete', { user_id: id });
                    if (result.code === 0) {
                        Toast.success('删除成功');
                        this.loadData();
                    } else {
                        Toast.error(result.msg || '删除失败');
                    }
                }
            });
        });
    }
};
