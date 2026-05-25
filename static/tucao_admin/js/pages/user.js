const UserPage = {
    currentPage: 1,
    pageSize: 10,
    keyword: '',
    status: null,

    async render() {
        Layout.render(`
            <div class="page-header">
                <h2>用户管理</h2>
            </div>

            <div class="search-bar">
                <input type="text" id="searchKeyword" placeholder="搜索用户名/昵称..." onkeypress="if(event.key==='Enter')UserPage.search()">
                <select id="searchStatus" onchange="UserPage.search()">
                    <option value="">全部状态</option>
                    <option value="0">正常</option>
                    <option value="1">禁言</option>
                    <option value="2">封号</option>
                </select>
                <button class="btn btn-primary" onclick="UserPage.search()">搜索</button>
                <button class="btn btn-secondary" onclick="UserPage.resetSearch()">重置</button>
            </div>

            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>用户名</th>
                            <th>昵称</th>
                            <th>状态</th>
                            <th>注册时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="userTableBody">
                        <tr><td colspan="6" class="text-center">加载中...</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="pagination" id="pagination"></div>
        `, 'user');

        await this.loadData();
    },

    search() {
        this.keyword = document.getElementById('searchKeyword').value.trim();
        const statusVal = document.getElementById('searchStatus').value;
        this.status = statusVal !== '' ? parseInt(statusVal) : null;
        this.currentPage = 1;
        this.loadData();
    },

    resetSearch() {
        this.keyword = '';
        this.status = null;
        this.currentPage = 1;
        document.getElementById('searchKeyword').value = '';
        document.getElementById('searchStatus').value = '';
        this.loadData();
    },

    async loadData() {
        try {
            const params = {
                page: this.currentPage,
                page_size: this.pageSize
            };
            if (this.keyword) params.keyword = this.keyword;
            if (this.status !== null) params.status = this.status;

            const result = await ApiService.get('/tucao/admin/user/list/get', params);

            const tbody = document.getElementById('userTableBody');
            if (result.code === 0 && result.data.items.length > 0) {
                tbody.innerHTML = result.data.items.map(user => `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.username}</td>
                        <td>${user.nickname || '-'}</td>
                        <td><span class="badge ${this.getStatusBadge(user.status)}">${user.status_text}</span></td>
                        <td>${this.formatTime(user.created_at)}</td>
                        <td>
                            ${user.status === 2 ? 
                                `<button class="btn btn-sm btn-success" onclick="UserPage.unban(${user.id})">解封</button>` :
                                `<button class="btn btn-sm btn-danger" onclick="UserPage.ban(${user.id})">封号</button>`
                            }
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">暂无数据</td></tr>';
            }

            this.renderPagination(result.data);
        } catch (error) {
            console.error('加载数据失败:', error);
            Toast.error('加载数据失败');
        }
    },

    async ban(id) {
        if (!confirm('确定要封号此用户吗？')) return;

        try {
            const result = await ApiService.post(`/tucao/admin/user/ban?user_id=${id}`);
            if (result.code === 0) {
                Toast.success('封号成功');
                this.loadData();
            } else {
                Toast.error(result.msg || '封号失败');
            }
        } catch (error) {
            Toast.error('封号失败');
        }
    },

    async unban(id) {
        if (!confirm('确定要解封此用户吗？')) return;

        try {
            const result = await ApiService.post(`/tucao/admin/user/unban?user_id=${id}`);
            if (result.code === 0) {
                Toast.success('解封成功');
                this.loadData();
            } else {
                Toast.error(result.msg || '解封失败');
            }
        } catch (error) {
            Toast.error('解封失败');
        }
    },

    renderPagination(data) {
        const pagination = document.getElementById('pagination');
        const { total, page, total_pages } = data;

        if (total_pages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = `<span>共 ${total} 条，第 ${page}/${total_pages} 页</span>`;
        html += `<button class="btn btn-sm ${page <= 1 ? 'disabled' : ''}" onclick="UserPage.goPage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>上一页</button>`;

        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(total_pages, page + 2);

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="btn btn-sm ${i === page ? 'active' : ''}" onclick="UserPage.goPage(${i})">${i}</button>`;
        }

        html += `<button class="btn btn-sm ${page >= total_pages ? 'disabled' : ''}" onclick="UserPage.goPage(${page + 1})" ${page >= total_pages ? 'disabled' : ''}>下一页</button>`;

        pagination.innerHTML = html;
    },

    goPage(page) {
        this.currentPage = page;
        this.loadData();
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
