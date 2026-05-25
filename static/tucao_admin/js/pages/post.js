const PostPage = {
    currentPage: 1,
    pageSize: 10,
    keyword: '',
    status: null,

    async render() {
        Layout.render(`
            <div class="page-header">
                <h2>吐槽管理</h2>
            </div>

            <div class="search-bar">
                <input type="text" id="searchKeyword" placeholder="搜索内容..." onkeypress="if(event.key==='Enter')PostPage.search()">
                <select id="searchStatus" onchange="PostPage.search()">
                    <option value="">全部状态</option>
                    <option value="1">已通过</option>
                    <option value="0">待审核</option>
                    <option value="2">已拒绝</option>
                    <option value="3">已删除</option>
                </select>
                <button class="btn btn-primary" onclick="PostPage.search()">搜索</button>
                <button class="btn btn-secondary" onclick="PostPage.resetSearch()">重置</button>
            </div>

            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>匿名ID</th>
                            <th>内容</th>
                            <th>分类</th>
                            <th>删除码</th>
                            <th>点赞</th>
                            <th>回复</th>
                            <th>状态</th>
                            <th>发布时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="postTableBody">
                        <tr><td colspan="10" class="text-center">加载中...</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="pagination" id="pagination"></div>
        `, 'post');

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

            const result = await ApiService.get('/tucao/admin/post/list/get', params);

            const tbody = document.getElementById('postTableBody');
            if (result.code === 0 && result.data.items.length > 0) {
                tbody.innerHTML = result.data.items.map(post => `
                    <tr>
                        <td>${post.id}</td>
                        <td>${post.anonymous_id}</td>
                        <td class="text-truncate" style="max-width: 200px;" title="${post.content}">${post.content}</td>
                        <td>${post.category || '-'}</td>
                        <td>${post.delete_code}</td>
                        <td>${post.like_count}</td>
                        <td>${post.reply_count}</td>
                        <td><span class="badge ${this.getStatusBadge(post.status)}">${post.status_text}</span></td>
                        <td>${this.formatTime(post.created_at)}</td>
                        <td>
                            ${post.status === 3 ? 
                                `<button class="btn btn-sm btn-success" onclick="PostPage.restore(${post.id})">恢复</button>` :
                                `<button class="btn btn-sm btn-danger" onclick="PostPage.delete(${post.id})">删除</button>`
                            }
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="10" class="text-center">暂无数据</td></tr>';
            }

            this.renderPagination(result.data);
        } catch (error) {
            console.error('加载数据失败:', error);
            Toast.error('加载数据失败');
        }
    },

    renderPagination(data) {
        const pagination = document.getElementById('pagination');
        const { total, page, page_size, total_pages } = data;

        if (total_pages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = `<span>共 ${total} 条，第 ${page}/${total_pages} 页</span>`;
        html += `<button class="btn btn-sm ${page <= 1 ? 'disabled' : ''}" onclick="PostPage.goPage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>上一页</button>`;

        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(total_pages, page + 2);

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="btn btn-sm ${i === page ? 'active' : ''}" onclick="PostPage.goPage(${i})">${i}</button>`;
        }

        html += `<button class="btn btn-sm ${page >= total_pages ? 'disabled' : ''}" onclick="PostPage.goPage(${page + 1})" ${page >= total_pages ? 'disabled' : ''}>下一页</button>`;

        pagination.innerHTML = html;
    },

    goPage(page) {
        this.currentPage = page;
        this.loadData();
    },

    async delete(id) {
        if (!confirm('确定要删除这条吐槽吗？')) return;

        try {
            const result = await ApiService.post(`/tucao/admin/post/delete?post_id=${id}`);
            if (result.code === 0) {
                Toast.success('删除成功');
                this.loadData();
            } else {
                Toast.error(result.msg || '删除失败');
            }
        } catch (error) {
            Toast.error('删除失败');
        }
    },

    async restore(id) {
        if (!confirm('确定要恢复这条吐槽吗？')) return;

        try {
            const result = await ApiService.post(`/tucao/admin/post/restore?post_id=${id}`);
            if (result.code === 0) {
                Toast.success('恢复成功');
                this.loadData();
            } else {
                Toast.error(result.msg || '恢复失败');
            }
        } catch (error) {
            Toast.error('恢复失败');
        }
    },

    getStatusBadge(status) {
        const badges = {
            0: 'badge-warning',
            1: 'badge-success',
            2: 'badge-danger',
            3: 'badge-secondary'
        };
        return badges[status] || 'badge-secondary';
    },

    formatTime(time) {
        if (!time) return '-';
        const date = new Date(time);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
};
