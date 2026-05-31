const AdminStaffPage = {
    staffList: [],
    editingStaff: null,

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
                        <a href="#admin/orders" class="menu-item">
                            <span class="menu-icon">📋</span>
                            <span class="menu-text">订单管理</span>
                        </a>
                        <a href="#admin/staff" class="menu-item active">
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
                        <h1>人员管理</h1>
                        <button class="btn btn-primary" id="addStaffBtn">+ 添加人员</button>
                    </header>

                    <div class="admin-content">
                        <div class="admin-table-container">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>姓名</th>
                                        <th>手机号</th>
                                        <th>技能</th>
                                        <th>状态</th>
                                        <th>创建时间</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody id="staffTableBody">
                                    <tr><td colspan="7"><div class="loading">加载中...</div></td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            <div class="modal" id="staffModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="staffModalTitle">添加人员</h3>
                        <button class="modal-close" id="staffModalClose">&times;</button>
                    </div>
                    <form id="staffForm" class="modal-body">
                        <div class="form-group">
                            <label>姓名 *</label>
                            <input type="text" id="staffName" required>
                        </div>
                        <div class="form-group">
                            <label>手机号 *</label>
                            <input type="tel" id="staffPhone" required>
                        </div>
                        <div class="form-group">
                            <label>技能专长</label>
                            <input type="text" id="staffSkill" placeholder="如：保洁、家电清洗等">
                        </div>
                        <div class="form-group">
                            <label>简介</label>
                            <textarea id="staffBio" rows="3"></textarea>
                        </div>
                        <div class="form-group">
                            <label>状态</label>
                            <select id="staffStatus">
                                <option value="1">在岗</option>
                                <option value="0">离岗</option>
                            </select>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" id="staffCancel">取消</button>
                            <button type="submit" class="btn btn-primary">保存</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        await this.loadStaff();
        this.bindEvents();
    },

    async loadStaff() {
        try {
            const result = await StaffApi.list();
            if (result.code === 0) {
                this.staffList = result.data.items || [];
                this.renderTable();
            } else {
                document.getElementById('staffTableBody').innerHTML = '<tr><td colspan="7"><div class="empty">加载失败</div></td></tr>';
            }
        } catch (error) {
            document.getElementById('staffTableBody').innerHTML = '<tr><td colspan="7"><div class="empty">加载失败</div></td></tr>';
        }
    },

    renderTable() {
        const tbody = document.getElementById('staffTableBody');

        if (this.staffList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7"><div class="empty">暂无数据</div></td></tr>';
            return;
        }

        let html = '';
        this.staffList.forEach(staff => {
            html += `
                <tr>
                    <td>${staff.id}</td>
                    <td>${staff.name}</td>
                    <td>${staff.phone}</td>
                    <td>${staff.skill || '-'}</td>
                    <td>
                        <span class="status-badge ${staff.status === 1 ? 'status-success' : 'status-danger'}">
                            ${staff.status === 1 ? '在岗' : '离岗'}
                        </span>
                    </td>
                    <td>${Utils.formatDate(staff.created_at, 'YYYY-MM-DD')}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" data-action="edit" data-id="${staff.id}">编辑</button>
                        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${staff.id}">删除</button>
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

                if (action === 'edit') {
                    this.editingStaff = this.staffList.find(s => s.id === id);
                    this.openModal();
                } else if (action === 'delete') {
                    const confirmed = await Utils.confirm('确认删除该人员吗？');
                    if (!confirmed) return;
                    try {
                        const result = await StaffApi.delete(id);
                        if (result.code === 0) {
                            Utils.showToast('删除成功');
                            this.loadStaff();
                        } else {
                            Utils.showToast(result.msg || '删除失败', 'error');
                        }
                    } catch (error) {
                        Utils.showToast('删除失败', 'error');
                    }
                }
            });
        });
    },

    openModal() {
        const modal = document.getElementById('staffModal');
        const title = document.getElementById('staffModalTitle');

        if (this.editingStaff) {
            title.textContent = '编辑人员';
            document.getElementById('staffName').value = this.editingStaff.name;
            document.getElementById('staffPhone').value = this.editingStaff.phone;
            document.getElementById('staffSkill').value = this.editingStaff.skill || '';
            document.getElementById('staffBio').value = this.editingStaff.bio || '';
            document.getElementById('staffStatus').value = this.editingStaff.status;
        } else {
            title.textContent = '添加人员';
            document.getElementById('staffForm').reset();
            document.getElementById('staffStatus').value = 1;
        }

        modal.classList.add('show');
    },

    closeModal() {
        document.getElementById('staffModal').classList.remove('show');
        this.editingStaff = null;
    },

    bindEvents() {
        document.getElementById('addStaffBtn').addEventListener('click', () => {
            this.editingStaff = null;
            this.openModal();
        });

        document.getElementById('staffModalClose').addEventListener('click', () => this.closeModal());
        document.getElementById('staffCancel').addEventListener('click', () => this.closeModal());

        document.getElementById('staffForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('staffName').value;
            const phone = document.getElementById('staffPhone').value;
            const skill = document.getElementById('staffSkill').value;
            const bio = document.getElementById('staffBio').value;
            const status = parseInt(document.getElementById('staffStatus').value);

            const phoneRegex = /^1[3-9]\d{9}$/;
            if (!phoneRegex.test(phone)) {
                Utils.showToast('请输入正确的手机号', 'error');
                return;
            }

            const data = { name, phone, skill, bio, status };

            try {
                let result;
                if (this.editingStaff) {
                    data.id = this.editingStaff.id;
                    result = await StaffApi.update(data);
                } else {
                    result = await StaffApi.create(data);
                }

                if (result.code === 0) {
                    Utils.showToast(this.editingStaff ? '更新成功' : '创建成功');
                    this.closeModal();
                    this.loadStaff();
                } else {
                    Utils.showToast(result.msg || '操作失败', 'error');
                }
            } catch (error) {
                Utils.showToast('操作失败', 'error');
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
