const UserPage = {
    data: {
        list: [],
        total: 0,
        page: 1,
        pageSize: 10,
        keyword: ''
    },

    render() {
        const token = Storage.getToken();
        if (!token) {
            Router.navigate('login');
            return;
        }

        const content = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">用户列表</h3>
                </div>
                <div class="card-body">
                    <div class="search-bar">
                        <input type="text" class="form-control search-input" id="searchInput" placeholder="搜索用户名/邮箱/学号">
                        <button class="btn btn-primary" id="searchBtn">搜索</button>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>用户名</th>
                                    <th>学号</th>
                                    <th>邮箱</th>
                                    <th>电话</th>
                                    <th>状态</th>
                                    <th>注册时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="userTable">
                                <tr><td colspan="8" class="text-center text-secondary">加载中...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination">
                        <div class="pagination-info" id="paginationInfo"></div>
                        <div class="pagination-buttons" id="paginationButtons"></div>
                    </div>
                </div>
            </div>

            <div id="modalContainer"></div>
        `;

        Layout.render(content, 'user');
        this.bindEvents();
        this.loadData();
    },

    bindEvents() {
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.data.keyword = document.getElementById('searchInput').value;
            this.data.page = 1;
            this.loadData();
        });

        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('searchBtn').click();
            }
        });
    },

    async loadData() {
        try {
            const result = await Api.get('/users', {
                page: this.data.page,
                page_size: this.data.pageSize,
                keyword: this.data.keyword
            });

            if (result.code === 200) {
                this.data.list = result.data.list || [];
                this.data.total = result.data.total || 0;
                this.renderTable();
                this.renderPagination();
            }
        } catch (error) {
            console.error('加载用户数据失败:', error);
        }
    },

    renderTable() {
        const tbody = document.getElementById('userTable');
        if (this.data.list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-secondary">暂无用户数据</td></tr>';
            return;
        }

        tbody.innerHTML = this.data.list.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${Layout.escapeHtml(user.username || '-')}</td>
                <td>${Layout.escapeHtml(user.student_id || '-')}</td>
                <td>${Layout.escapeHtml(user.email || '-')}</td>
                <td>${Layout.escapeHtml(user.phone || '-')}</td>
                <td>
                    <span class="badge ${user.status === 1 ? 'badge-success' : 'badge-danger'}">
                        ${user.status === 1 ? '正常' : '禁用'}
                    </span>
                </td>
                <td>${Layout.formatDate(user.created_at)}</td>
                <td>
                    <div class="actions">
                        <button class="btn btn-outline btn-sm" onclick="UserPage.editUser(${user.id})">编辑</button>
                        <button class="btn ${user.status === 1 ? 'btn-warning' : 'btn-success'} btn-sm" onclick="UserPage.toggleStatus(${user.id}, ${user.status})">
                            ${user.status === 1 ? '禁用' : '启用'}
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    renderPagination() {
        const totalPages = Math.ceil(this.data.total / this.data.pageSize);
        const start = (this.data.page - 1) * this.data.pageSize + 1;
        const end = Math.min(this.data.page * this.data.pageSize, this.data.total);

        document.getElementById('paginationInfo').textContent =
            `共 ${this.data.total} 条，显示 ${start}-${end} 条`;

        let buttons = '';
        buttons += `<button class="pagination-btn" ${this.data.page === 1 ? 'disabled' : ''} onclick="UserPage.goToPage(${this.data.page - 1})">上一页</button>`;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.data.page - 2 && i <= this.data.page + 2)) {
                buttons += `<button class="pagination-btn ${i === this.data.page ? 'active' : ''}" onclick="UserPage.goToPage(${i})">${i}</button>`;
            } else if (i === this.data.page - 3 || i === this.data.page + 3) {
                buttons += '<span class="pagination-btn">...</span>';
            }
        }

        buttons += `<button class="pagination-btn" ${this.data.page === totalPages ? 'disabled' : ''} onclick="UserPage.goToPage(${this.data.page + 1})">下一页</button>`;

        document.getElementById('paginationButtons').innerHTML = buttons;
    },

    goToPage(page) {
        this.data.page = page;
        this.loadData();
    },

    async editUser(id) {
        const user = this.data.list.find(u => u.id === id);
        if (!user) return;

        const modalHtml = `
            <div class="modal-overlay" onclick="if(event.target === this) UserPage.closeModal()">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">编辑用户</h3>
                        <span class="modal-close" onclick="UserPage.closeModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="editUserForm">
                            <div class="form-group">
                                <label class="form-label">用户名</label>
                                <input type="text" class="form-control" id="editUsername" value="${Layout.escapeHtml(user.username)}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">邮箱</label>
                                <input type="email" class="form-control" id="editEmail" value="${Layout.escapeHtml(user.email || '')}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">电话</label>
                                <input type="text" class="form-control" id="editPhone" value="${Layout.escapeHtml(user.phone || '')}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">学号</label>
                                <input type="text" class="form-control" id="editStudentId" value="${Layout.escapeHtml(user.student_id || '')}">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="UserPage.closeModal()">取消</button>
                        <button class="btn btn-primary" onclick="UserPage.saveUser(${id})">保存</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modalContainer').innerHTML = modalHtml;
    },

    async saveUser(id) {
        try {
            const result = await Api.put(`/users/${id}`, {
                username: document.getElementById('editUsername').value,
                email: document.getElementById('editEmail').value,
                phone: document.getElementById('editPhone').value,
                student_id: document.getElementById('editStudentId').value
            });

            if (result.code === 200) {
                Toast.success('保存成功');
                this.closeModal();
                this.loadData();
            }
        } catch (error) {
            console.error('保存失败:', error);
        }
    },

    async toggleStatus(id, currentStatus) {
        try {
            const result = await Api.put(`/users/${id}/status`, {
                status: currentStatus === 1 ? 0 : 1
            });

            if (result.code === 200) {
                Toast.success('操作成功');
                this.loadData();
            }
        } catch (error) {
            console.error('操作失败:', error);
        }
    },

    closeModal() {
        document.getElementById('modalContainer').innerHTML = '';
    }
};
