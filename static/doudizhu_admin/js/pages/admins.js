const AdminsPage = {
    data: {
        admins: [],
        total: 0,
        page: 1,
        pageSize: 20,
        showModal: false,
        editingAdmin: null
    },

    render() {
        if (!AuthService.requireAuth()) return;
        if (!AuthService.isSuperAdmin()) {
            Toast.error('只有超级管理员才能访问此页面');
            Router.navigate('dashboard');
            return;
        }

        const content = `
            <div class="page-header">
                <h2>👤 管理员管理</h2>
                <button class="btn btn-primary" onclick="AdminsPage.openAddModal()">+ 添加管理员</button>
            </div>

            <div class="table-card">
                <div class="filter-bar">
                    <div class="filter-item">
                        <label>用户名</label>
                        <input type="text" id="filterUsername" placeholder="请输入用户名" />
                    </div>
                    <div class="filter-item">
                        <label>状态</label>
                        <select id="filterStatus">
                            <option value="">全部</option>
                            <option value="1">正常</option>
                            <option value="0">禁用</option>
                        </select>
                    </div>
                    <div class="filter-item">
                        <button class="btn btn-primary" id="searchBtn">搜索</button>
                    </div>
                    <div class="filter-item">
                        <button class="btn btn-outline" id="resetBtn">重置</button>
                    </div>
                </div>

                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>用户名</th>
                                <th>姓名</th>
                                <th>角色</th>
                                <th>状态</th>
                                <th>最后登录</th>
                                <th>创建时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="adminsTable">
                            <tr><td colspan="8"><div class="loading">加载中...</div></td></tr>
                        </tbody>
                    </table>
                </div>

                <div class="pagination" id="pagination"></div>
            </div>

            <div id="modalContainer"></div>
        `;

        const app = document.getElementById('app');
        app.innerHTML = Layout.render(content);
        Layout.setPageTitle('👤 管理员管理');
        Layout.init();

        this.bindEvents();
        this.loadAdmins();
    },

    bindEvents() {
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.data.page = 1;
            this.loadAdmins();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            document.getElementById('filterUsername').value = '';
            document.getElementById('filterStatus').value = '';
            this.data.page = 1;
            this.loadAdmins();
        });
    },

    async loadAdmins() {
        try {
            const params = {
                page: this.data.page,
                page_size: this.data.pageSize
            };

            const username = document.getElementById('filterUsername')?.value;
            const status = document.getElementById('filterStatus')?.value;

            if (username) {
                params.username = username;
            }
            if (status !== '') {
                params.status = parseInt(status);
            }

            const result = await Api.get('/admin/admins/list/get', params);

            if (result.code === 0 && result.data) {
                this.data.admins = result.data.items || [];
                this.data.total = result.data.total || 0;
                this.renderTable();
                this.renderPagination();
            } else {
                document.getElementById('adminsTable').innerHTML = '<tr><td colspan="8"><div class="empty">加载失败</div></td></tr>';
            }
        } catch (error) {
            console.error('Load admins error:', error);
            document.getElementById('adminsTable').innerHTML = '<tr><td colspan="8"><div class="empty">加载失败</div></td></tr>';
        }
    },

    renderTable() {
        const tbody = document.getElementById('adminsTable');
        const admins = this.data.admins;

        if (!admins || admins.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8"><div class="empty">暂无数据</div></td></tr>';
            return;
        }

        const roleMap = { 0: '超级管理员', 1: '普通管理员' };

        tbody.innerHTML = admins.map(a => `
            <tr>
                <td>${a.id}</td>
                <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div class="user-avatar-small">${(a.username || 'A').charAt(0).toUpperCase()}</div>
                        <span>${a.username}</span>
                    </div>
                </td>
                <td>${a.real_name || '-'}</td>
                <td><span class="badge ${a.role === 0 ? 'badge-danger' : 'badge-info'}">${roleMap[a.role] || '普通管理员'}</span></td>
                <td>
                    <span class="badge ${a.status === 1 ? 'badge-success' : 'badge-danger'}">
                        ${a.status === 1 ? '正常' : '禁用'}
                    </span>
                </td>
                <td>${a.last_login_at ? new Date(a.last_login_at).toLocaleString() : '-'}</td>
                <td>${new Date(a.created_at).toLocaleString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-outline btn-small" onclick="AdminsPage.openEditModal(${a.id})">编辑</button>
                        ${a.role !== 0 ? `
                            <button class="btn btn-${a.status === 1 ? 'warning' : 'success'} btn-small" onclick="AdminsPage.toggleStatus(${a.id}, ${a.status === 1 ? 0 : 1})">
                                ${a.status === 1 ? '禁用' : '启用'}
                            </button>
                            <button class="btn btn-danger btn-small" onclick="AdminsPage.deleteAdmin(${a.id})">删除</button>
                        ` : '<span class="text-orange" style="font-size:12px;">超级管理员</span>'}
                    </div>
                </td>
            </tr>
        `).join('');
    },

    renderPagination() {
        const totalPages = Math.ceil(this.data.total / this.data.pageSize);
        const container = document.getElementById('pagination');

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = `
            <button ${this.data.page <= 1 ? 'disabled' : ''} onclick="AdminsPage.changePage(${this.data.page - 1})">上一页</button>
        `;

        const startPage = Math.max(1, this.data.page - 2);
        const endPage = Math.min(totalPages, startPage + 4);

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="${i === this.data.page ? 'active' : ''}" onclick="AdminsPage.changePage(${i})">${i}</button>
            `;
        }

        html += `
            <button ${this.data.page >= totalPages ? 'disabled' : ''} onclick="AdminsPage.changePage(${this.data.page + 1})">下一页</button>
            <span>共 ${this.data.total} 条，第 ${this.data.page}/${totalPages} 页</span>
        `;

        container.innerHTML = html;
    },

    changePage(page) {
        this.data.page = page;
        this.loadAdmins();
    },

    openAddModal() {
        this.data.editingAdmin = null;
        this.renderModal();
    },

    async openEditModal(id) {
        try {
            const result = await Api.get('/admin/admin/get', { id });
            if (result.code === 0 && result.data) {
                this.data.editingAdmin = result.data;
                this.renderModal();
            } else {
                Toast.error(result.msg || '获取管理员信息失败');
            }
        } catch (error) {
            console.error('Get admin error:', error);
            Toast.error('获取管理员信息失败');
        }
    },

    renderModal() {
        const admin = this.data.editingAdmin;
        const isEdit = !!admin;

        const modalHtml = `
            <div class="modal-overlay" id="adminModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${isEdit ? '编辑管理员' : '添加管理员'}</h3>
                        <button class="btn-close" onclick="AdminsPage.closeModal()">×</button>
                    </div>
                    <form id="adminForm" class="modal-body">
                        <div class="form-group">
                            <label>用户名</label>
                            <input type="text" id="modalUsername" placeholder="请输入用户名" value="${admin?.username || ''}" ${isEdit ? 'disabled' : ''} required />
                        </div>
                        ${!isEdit ? `
                            <div class="form-group">
                                <label>密码</label>
                                <input type="password" id="modalPassword" placeholder="请输入密码" required />
                            </div>
                            <div class="form-group">
                                <label>确认密码</label>
                                <input type="password" id="modalConfirmPassword" placeholder="请再次输入密码" required />
                            </div>
                        ` : `
                            <div class="form-group">
                                <label>新密码 (不修改请留空)</label>
                                <input type="password" id="modalPassword" placeholder="请输入新密码" />
                            </div>
                        `}
                        <div class="form-group">
                            <label>姓名</label>
                            <input type="text" id="modalRealName" placeholder="请输入姓名" value="${admin?.real_name || ''}" />
                        </div>
                        <div class="form-group">
                            <label>角色</label>
                            <select id="modalRole" ${admin?.role === 0 ? 'disabled' : ''}>
                                <option value="1" ${admin?.role === 1 ? 'selected' : ''}>普通管理员</option>
                                <option value="0" ${admin?.role === 0 ? 'selected' : ''}>超级管理员</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>状态</label>
                            <select id="modalStatus">
                                <option value="1" ${admin?.status === 1 || !isEdit ? 'selected' : ''}>正常</option>
                                <option value="0" ${admin?.status === 0 ? 'selected' : ''}>禁用</option>
                            </select>
                        </div>
                    </form>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="AdminsPage.closeModal()">取消</button>
                        <button class="btn btn-primary" onclick="AdminsPage.submitForm()">${isEdit ? '保存' : '添加'}</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modalContainer').innerHTML = modalHtml;
    },

    closeModal() {
        document.getElementById('modalContainer').innerHTML = '';
        this.data.editingAdmin = null;
    },

    async submitForm() {
        const username = document.getElementById('modalUsername').value;
        const password = document.getElementById('modalPassword').value;
        const confirmPassword = document.getElementById('modalConfirmPassword')?.value;
        const realName = document.getElementById('modalRealName').value;
        const role = parseInt(document.getElementById('modalRole').value);
        const status = parseInt(document.getElementById('modalStatus').value);

        if (!username) {
            Toast.error('请输入用户名');
            return;
        }

        if (!this.data.editingAdmin) {
            if (!password) {
                Toast.error('请输入密码');
                return;
            }
            if (password !== confirmPassword) {
                Toast.error('两次输入的密码不一致');
                return;
            }
        }

        try {
            let result;
            if (this.data.editingAdmin) {
                const data = {
                    id: this.data.editingAdmin.id,
                    real_name: realName,
                    role,
                    status
                };
                if (password) {
                    data.password = password;
                }
                result = await Api.post('/admin/admin/update', data);
            } else {
                result = await Api.post('/admin/admin/add', {
                    username,
                    password,
                    real_name: realName,
                    role,
                    status
                });
            }

            if (result.code === 0) {
                Toast.success(this.data.editingAdmin ? '更新成功' : '添加成功');
                this.closeModal();
                this.loadAdmins();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            console.error('Submit form error:', error);
            Toast.error('操作失败');
        }
    },

    async toggleStatus(id, status) {
        if (!confirm(`确定要${status === 1 ? '启用' : '禁用'}该管理员吗？`)) return;

        try {
            const result = await Api.post('/admin/admin/status/update', { id, status });
            if (result.code === 0) {
                Toast.success('状态更新成功');
                this.loadAdmins();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            console.error('Toggle status error:', error);
            Toast.error('操作失败');
        }
    },

    async deleteAdmin(id) {
        if (!confirm('确定要删除该管理员吗？此操作不可撤销。')) return;

        try {
            const result = await Api.post('/admin/admin/delete', { id });
            if (result.code === 0) {
                Toast.success('删除成功');
                this.loadAdmins();
            } else {
                Toast.error(result.msg || '删除失败');
            }
        } catch (error) {
            console.error('Delete admin error:', error);
            Toast.error('删除失败');
        }
    }
};
