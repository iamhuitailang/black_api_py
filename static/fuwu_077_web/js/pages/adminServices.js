const AdminServicesPage = {
    services: [],
    editingService: null,
    showModal: false,

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
                        <a href="#admin/services" class="menu-item active">
                            <span class="menu-icon">🛠️</span>
                            <span class="menu-text">服务管理</span>
                        </a>
                        <a href="#admin/orders" class="menu-item">
                            <span class="menu-icon">📋</span>
                            <span class="menu-text">订单管理</span>
                        </a>
                        <a href="#admin/staff" class="menu-item">
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
                        <h1>服务管理</h1>
                        <button class="btn btn-primary" id="addServiceBtn">+ 添加服务</button>
                    </header>

                    <div class="admin-content">
                        <div class="admin-table-container">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>服务名称</th>
                                        <th>分类</th>
                                        <th>价格</th>
                                        <th>时长</th>
                                        <th>状态</th>
                                        <th>创建时间</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody id="serviceTableBody">
                                    <tr><td colspan="8"><div class="loading">加载中...</div></td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            <div class="modal" id="serviceModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modalTitle">添加服务</h3>
                        <button class="modal-close" id="modalClose">&times;</button>
                    </div>
                    <form id="serviceForm" class="modal-body">
                        <div class="form-group">
                            <label>服务名称 *</label>
                            <input type="text" id="serviceName" required>
                        </div>
                        <div class="form-group">
                            <label>服务分类 *</label>
                            <select id="serviceCategory" required>
                                <option value="">请选择分类</option>
                                <option value="保洁清洁">保洁清洁</option>
                                <option value="家电清洗">家电清洗</option>
                                <option value="保姆月嫂">保姆月嫂</option>
                                <option value="维修服务">维修服务</option>
                                <option value="搬家服务">搬家服务</option>
                                <option value="其他服务">其他服务</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>价格 (元) *</label>
                            <input type="number" id="servicePrice" step="0.01" min="0" required>
                        </div>
                        <div class="form-group">
                            <label>时长 (分钟) *</label>
                            <input type="number" id="serviceDuration" min="1" value="60" required>
                        </div>
                        <div class="form-group">
                            <label>服务描述</label>
                            <textarea id="serviceDescription" rows="3"></textarea>
                        </div>
                        <div class="form-group">
                            <label>服务内容</label>
                            <textarea id="serviceContent" rows="3"></textarea>
                        </div>
                        <div class="form-group">
                            <label>状态</label>
                            <select id="serviceStatus">
                                <option value="1">启用</option>
                                <option value="0">禁用</option>
                            </select>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" id="modalCancel">取消</button>
                            <button type="submit" class="btn btn-primary">保存</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        await this.loadServices();
        this.bindEvents();
    },

    async loadServices() {
        try {
            const result = await ServiceApi.all();
            if (result.code === 0) {
                this.services = result.data.items || [];
                this.renderTable();
            } else {
                document.getElementById('serviceTableBody').innerHTML = '<tr><td colspan="8"><div class="empty">加载失败</div></td></tr>';
            }
        } catch (error) {
            document.getElementById('serviceTableBody').innerHTML = '<tr><td colspan="8"><div class="empty">加载失败</div></td></tr>';
        }
    },

    renderTable() {
        const tbody = document.getElementById('serviceTableBody');

        if (this.services.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8"><div class="empty">暂无数据</div></td></tr>';
            return;
        }

        let html = '';
        this.services.forEach(service => {
            html += `
                <tr>
                    <td>${service.id}</td>
                    <td>${service.name}</td>
                    <td>${service.category}</td>
                    <td>${Utils.formatPrice(service.price)}</td>
                    <td>${service.duration || 60}分钟</td>
                    <td>
                        <span class="status-badge ${service.status === 1 ? 'status-success' : 'status-danger'}">
                            ${service.status === 1 ? '启用' : '禁用'}
                        </span>
                    </td>
                    <td>${Utils.formatDate(service.created_at, 'YYYY-MM-DD')}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" data-action="edit" data-id="${service.id}">编辑</button>
                        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${service.id}">删除</button>
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
                    this.editingService = this.services.find(s => s.id === id);
                    this.openModal();
                } else if (action === 'delete') {
                    const confirmed = await Utils.confirm('确认删除该服务吗？');
                    if (!confirmed) return;
                    try {
                        const result = await ServiceApi.delete(id);
                        if (result.code === 0) {
                            Utils.showToast('删除成功');
                            this.loadServices();
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
        const modal = document.getElementById('serviceModal');
        const title = document.getElementById('modalTitle');

        if (this.editingService) {
            title.textContent = '编辑服务';
            document.getElementById('serviceName').value = this.editingService.name;
            document.getElementById('serviceCategory').value = this.editingService.category;
            document.getElementById('servicePrice').value = this.editingService.price;
            document.getElementById('serviceDuration').value = this.editingService.duration || 60;
            document.getElementById('serviceDescription').value = this.editingService.description || '';
            document.getElementById('serviceContent').value = this.editingService.content || '';
            document.getElementById('serviceStatus').value = this.editingService.status;
        } else {
            title.textContent = '添加服务';
            document.getElementById('serviceForm').reset();
            document.getElementById('serviceDuration').value = 60;
            document.getElementById('serviceStatus').value = 1;
        }

        modal.classList.add('show');
    },

    closeModal() {
        document.getElementById('serviceModal').classList.remove('show');
        this.editingService = null;
    },

    bindEvents() {
        document.getElementById('addServiceBtn').addEventListener('click', () => {
            this.editingService = null;
            this.openModal();
        });

        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
        document.getElementById('modalCancel').addEventListener('click', () => this.closeModal());

        document.getElementById('serviceForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const data = {
                name: document.getElementById('serviceName').value,
                category: document.getElementById('serviceCategory').value,
                price: parseFloat(document.getElementById('servicePrice').value),
                duration: parseInt(document.getElementById('serviceDuration').value),
                description: document.getElementById('serviceDescription').value,
                content: document.getElementById('serviceContent').value,
                status: parseInt(document.getElementById('serviceStatus').value)
            };

            try {
                let result;
                if (this.editingService) {
                    data.id = this.editingService.id;
                    result = await ServiceApi.update(data);
                } else {
                    result = await ServiceApi.create(data);
                }

                if (result.code === 0) {
                    Utils.showToast(this.editingService ? '更新成功' : '创建成功');
                    this.closeModal();
                    this.loadServices();
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
