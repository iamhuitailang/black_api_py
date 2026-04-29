const PostPage = {
    currentPage: 1,
    pageSize: 10,
    currentType: null,
    currentStatus: null,
    currentIsChecked: null,
    keyword: '',

    async render() {
        Layout.render(`
            <div class="page-header">
                <h1 class="page-title">内容管理</h1>
                <p class="page-subtitle">审核和管理用户发布的求助、帮助内容</p>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="toolbar">
                        <div class="toolbar-left">
                            <div class="search-box">
                                <span class="search-icon">🔍</span>
                                <input type="text" class="form-control" id="searchKeyword" placeholder="搜索标题/内容">
                            </div>
                            <select class="form-control" id="typeFilter" style="width: 100px;">
                                <option value="">全部类型</option>
                                <option value="need">求助</option>
                                <option value="help">提供帮助</option>
                            </select>
                            <select class="form-control" id="statusFilter" style="width: 100px;">
                                <option value="">全部状态</option>
                                <option value="0">进行中</option>
                                <option value="1">已接单</option>
                                <option value="2">已完成</option>
                                <option value="3">已取消</option>
                            </select>
                            <select class="form-control" id="checkFilter" style="width: 100px;">
                                <option value="">全部审核</option>
                                <option value="1">已通过</option>
                                <option value="0">待审核</option>
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
                                    <th>标题</th>
                                    <th>类型</th>
                                    <th>分类</th>
                                    <th>发布者</th>
                                    <th>浏览数</th>
                                    <th>状态</th>
                                    <th>审核</th>
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
                </div>
            </div>

            <div class="modal-overlay" id="detailModal">
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <h3 class="modal-title">详情查看</h3>
                        <button class="modal-close" onclick="PostPage.closeDetailModal()">&times;</button>
                    </div>
                    <div class="modal-body" id="detailModalBody"></div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="PostPage.closeDetailModal()">关闭</button>
                    </div>
                </div>
            </div>
        `, 'post');

        this.bindEvents();
        await this.loadPosts();
    },

    bindEvents() {
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.currentPage = 1;
            this.keyword = document.getElementById('searchKeyword').value.trim();
            this.currentType = document.getElementById('typeFilter').value || null;
            this.currentStatus = document.getElementById('statusFilter').value === '' ? null : parseInt(document.getElementById('statusFilter').value);
            this.currentIsChecked = document.getElementById('checkFilter').value === '' ? null : parseInt(document.getElementById('checkFilter').value);
            this.loadPosts();
        });

        document.getElementById('searchKeyword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('searchBtn').click();
            }
        });
    },

    async loadPosts() {
        try {
            const params = {
                page: this.currentPage,
                page_size: this.pageSize
            };

            if (this.keyword) {
                params.keyword = this.keyword;
            }

            if (this.currentType) {
                params.type = this.currentType;
            }

            if (this.currentStatus !== null) {
                params.status = this.currentStatus;
            }

            if (this.currentIsChecked !== null) {
                params.is_checked = this.currentIsChecked;
            }

            const result = await ApiService.get('/xq/post/admin/list/get', params);

            const tbody = document.getElementById('postTableBody');
            if (result.code === 0 && result.data.items.length > 0) {
                tbody.innerHTML = result.data.items.map(post => `
                    <tr>
                        <td>${post.id}</td>
                        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${post.title}">${post.title}</td>
                        <td><span class="badge ${post.type === 'need' ? 'badge-warning' : 'badge-info'}">${post.type_text}</span></td>
                        <td>${post.category_name}</td>
                        <td>${post.publisher?.nickname || '-'}<br><small style="color: var(--text-secondary);">${post.publisher?.phone || ''}</small></td>
                        <td>${post.view_count || 0}</td>
                        <td><span class="badge ${this.getStatusBadge(post.status)}">${post.status_text}</span></td>
                        <td><span class="badge ${post.is_checked === 1 ? 'badge-success' : 'badge-warning'}">${post.is_checked === 1 ? '已通过' : '待审核'}</span></td>
                        <td>${this.formatTime(post.created_at)}</td>
                        <td>
                            <div class="table-actions">
                                <button class="btn btn-sm btn-secondary" onclick="PostPage.viewDetail(${post.id})">查看</button>
                                ${post.is_checked !== 1 ? `
                                    <button class="btn btn-sm btn-primary" onclick="PostPage.approvePost(${post.id})">通过</button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `).join('');

                this.renderPagination(result.data);
            } else {
                tbody.innerHTML = '<tr><td colspan="10" class="text-center">暂无数据</td></tr>';
                document.getElementById('pagination').innerHTML = '';
            }
        } catch (error) {
            console.error('加载内容列表失败:', error);
            Toast.error('加载内容列表失败');
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

        html += `<button class="pagination-btn" ${page === 1 ? 'disabled' : ''} onclick="PostPage.goToPage(${page - 1})">上一页</button>`;

        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(total_pages, page + 2);

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === page ? 'active' : ''}" onclick="PostPage.goToPage(${i})">${i}</button>`;
        }

        html += `<button class="pagination-btn" ${page === total_pages ? 'disabled' : ''} onclick="PostPage.goToPage(${page + 1})">下一页</button>`;

        pagination.innerHTML = html;
    },

    goToPage(page) {
        this.currentPage = page;
        this.loadPosts();
    },

    async viewDetail(postId) {
        try {
            const result = await ApiService.get('/xq/post/detail/get', { post_id: postId });

            if (result.code === 0) {
                const post = result.data;
                const modalBody = document.getElementById('detailModalBody');

                modalBody.innerHTML = `
                    <div class="form-group">
                        <label class="form-label">标题</label>
                        <div style="font-size: 16px; font-weight: 500;">${post.title}</div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">类型</label>
                            <span class="badge ${post.type === 'need' ? 'badge-warning' : 'badge-info'}">${post.type_text}</span>
                        </div>
                        <div class="form-group">
                            <label class="form-label">分类</label>
                            <span>${post.category_name}</span>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">状态</label>
                            <span class="badge ${this.getStatusBadge(post.status)}">${post.status_text}</span>
                        </div>
                        <div class="form-group">
                            <label class="form-label">浏览数</label>
                            <span>${post.view_count || 0}</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">描述内容</label>
                        <div style="padding: 12px; background-color: var(--bg-color); border-radius: var(--radius-sm); white-space: pre-wrap;">${post.content || '-'}</div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">发布者</label>
                        <div>
                            ${post.publisher?.nickname || '-'}
                            <small style="color: var(--text-secondary);">(${post.publisher?.phone || '-'})</small>
                        </div>
                    </div>
                    ${post.claims && post.claims.length > 0 ? `
                        <div class="form-group">
                            <label class="form-label">申请记录 (${post.claims.length}条)</label>
                            <div style="max-height: 200px; overflow-y: auto;">
                                ${post.claims.map(claim => `
                                    <div style="padding: 12px; border-bottom: 1px solid var(--border-color);">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <span>帮助者ID: ${claim.helper_id}</span>
                                            <span class="badge ${this.getClaimStatusBadge(claim.status)}">${claim.status_text}</span>
                                        </div>
                                        ${claim.comment ? `<div style="margin-top: 8px; color: var(--text-secondary);">留言: ${claim.comment}</div>` : ''}
                                        <div style="margin-top: 4px; font-size: 12px; color: var(--text-light);">申请时间: ${this.formatTime(claim.created_at)}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">发布时间</label>
                            <span>${this.formatTime(post.created_at)}</span>
                        </div>
                        <div class="form-group">
                            <label class="form-label">期望时间</label>
                            <span>${post.expect_time ? this.formatTime(post.expect_time) : '-'}</span>
                        </div>
                    </div>
                `;

                document.getElementById('detailModal').classList.add('show');
            } else {
                Toast.error(result.msg || '获取详情失败');
            }
        } catch (error) {
            console.error('获取详情失败:', error);
            Toast.error('获取详情失败');
        }
    },

    closeDetailModal() {
        document.getElementById('detailModal').classList.remove('show');
    },

    async approvePost(postId) {
        try {
            const response = await ApiService.post(`/xq/post/check?post_id=${postId}&is_checked=1`);

            if (response.code === 0) {
                Toast.success('审核通过');
                this.loadPosts();
            } else {
                Toast.error(response.msg || '操作失败');
            }
        } catch (error) {
            console.error('审核失败:', error);
            Toast.error('操作失败');
        }
    },

    getStatusBadge(status) {
        const badges = {
            0: 'badge-warning',
            1: 'badge-info',
            2: 'badge-success',
            3: 'badge-secondary'
        };
        return badges[status] || 'badge-secondary';
    },

    getClaimStatusBadge(status) {
        const badges = {
            0: 'badge-warning',
            1: 'badge-info',
            2: 'badge-danger',
            3: 'badge-success'
        };
        return badges[status] || 'badge-secondary';
    },

    formatTime(time) {
        if (!time) return '-';
        const date = new Date(time);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
};
