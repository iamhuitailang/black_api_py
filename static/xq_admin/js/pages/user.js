const UserPage = {
    currentPage: 1,
    pageSize: 10,
    currentStatus: null,
    keyword: '',

    async render() {
        Layout.render(`
            <div class="page-header">
                <h1 class="page-title">用户管理</h1>
                <p class="page-subtitle">管理平台注册用户，可以进行禁言、封号等操作</p>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="toolbar">
                        <div class="toolbar-left">
                            <div class="search-box">
                                <span class="search-icon">🔍</span>
                                <input type="text" class="form-control" id="searchKeyword" placeholder="搜索手机号/昵称/小区">
                            </div>
                            <select class="form-control" id="statusFilter" style="width: 120px;">
                                <option value="">全部状态</option>
                                <option value="0">正常</option>
                                <option value="1">禁言</option>
                                <option value="2">封号</option>
                            </select>
                            <button class="btn btn-primary" id="searchBtn">搜索</button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>手机号</th>
                                    <th>昵称</th>
                                    <th>小区</th>
                                    <th>信用分</th>
                                    <th>状态</th>
                                    <th>注册时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="userTableBody">
                                <tr><td colspan="8" class="text-center">加载中...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination" id="pagination"></div>
                </div>
            </div>
        `, 'user');

        this.bindEvents();
        await this.loadUsers();
    },

    bindEvents() {
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.currentPage = 1;
            this.keyword = document.getElementById('searchKeyword').value.trim();
            this.currentStatus = document.getElementById('statusFilter').value || null;
            this.loadUsers();
        });

        document.getElementById('searchKeyword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('searchBtn').click();
            }
        });
    },

    async loadUsers() {
        try {
            const params = {
                page: this.currentPage,
                page_size: this.pageSize
            };

            if (this.keyword) {
                params.keyword = this.keyword;
            }

            if (this.currentStatus !== null && this.currentStatus !== '') {
                params.status = this.currentStatus;
            }

            const result = await ApiService.get('/xq/admin/user/list/get', params);

            const tbody = document.getElementById('userTableBody');
            if (result.code === 0 && result.data.items.length > 0) {
                tbody.innerHTML = result.data.items.map(user => `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.phone}</td>
                        <td>${user.nickname || '-'}</td>
                        <td>${user.community || '-'}</td>
                        <td><span class="badge ${user.credit >= 80 ? 'badge-success' : user.credit >= 60 ? 'badge-warning' : 'badge-danger'}">${user.credit}</span></td>
                        <td><span class="badge ${this.getStatusBadge(user.status)}">${user.status_text}</span></td>
                        <td>${this.formatTime(user.created_at)}</td>
                        <td>
                            <div class="table-actions">
                                ${user.status === 0 ? `
                                    <button class="btn btn-sm btn-warning" onclick="UserPage.muteUser(${user.id})">禁言</button>
                                    <button class="btn btn-sm btn-danger" onclick="UserPage.banUser(${user.id})">封号</button>
                                ` : `
                                    <button class="btn btn-sm btn-primary" onclick="UserPage.unbanUser(${user.id})">解封</button>
                                `}
                            </div>
                        </td>
                    </tr>
                `).join('');

                this.renderPagination(result.data);
            } else {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center">暂无数据</td></tr>';
                document.getElementById('pagination').innerHTML = '';
            }
        } catch (error) {
            console.error('加载用户列表失败:', error);
            Toast.error('加载用户列表失败');
        }
    },

    renderPagination(data) {
        const { total, page, total_pages } = data;
        const pagination = document.getElementById('pagination');

        if (total_pages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = `<span class="pagination-info">共 ${total} 条</span>`;

        html += `<button class="pagination-btn" ${page === 1 ? 'disabled' : ''} onclick="UserPage.goToPage(${page - 1})">上一页</button>`;

        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(total_pages, page + 2);

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === page ? 'active' : ''}" onclick="UserPage.goToPage(${i})">${i}</button>`;
        }

        html += `<button class="pagination-btn" ${page === total_pages ? 'disabled' : ''} onclick="UserPage.goToPage(${page + 1})">下一页</button>`;

        pagination.innerHTML = html;
    },

    goToPage(page) {
        this.currentPage = page;
        this.loadUsers();
    },

    async muteUser(userId) {
        if (!confirm('确定要禁言该用户吗？')) return;

        try {
            const result = await ApiService.post('/xq/admin/user/mute', null, { params: { user_id: userId } });
            const response = await ApiService.post(`/xq/admin/user/mute?user_id=${userId}`);

            if (response.code === 0) {
                Toast.success('禁言成功');
                this.loadUsers();
            } else {
                Toast.error(response.msg || '操作失败');
            }
        } catch (error) {
            console.error('禁言失败:', error);
            Toast.error('操作失败');
        }
    },

    async banUser(userId) {
        if (!confirm('确定要封号该用户吗？该操作会禁止用户登录。')) return;

        try {
            const response = await ApiService.post(`/xq/admin/user/ban?user_id=${userId}`);

            if (response.code === 0) {
                Toast.success('封号成功');
                this.loadUsers();
            } else {
                Toast.error(response.msg || '操作失败');
            }
        } catch (error) {
            console.error('封号失败:', error);
            Toast.error('操作失败');
        }
    },

    async unbanUser(userId) {
        if (!confirm('确定要解封该用户吗？')) return;

        try {
            const response = await ApiService.post(`/xq/admin/user/unban?user_id=${userId}`);

            if (response.code === 0) {
                Toast.success('解封成功');
                this.loadUsers();
            } else {
                Toast.error(response.msg || '操作失败');
            }
        } catch (error) {
            console.error('解封失败:', error);
            Toast.error('操作失败');
        }
    },

    getStatusBadge(status) {
        const badges = {
            0: 'badge-success',
            1: 'badge-warning',
            2: 'badge-danger'
        };
        return badges[status] || 'badge-secondary';
    },

    formatTime(time) {
        if (!time) return '-';
        const date = new Date(time);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
};
