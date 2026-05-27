const AdminPage = {
    currentView: 'dashboard',

    render() {
        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="page admin-page">
                ${Layout.renderSidebar(this.currentView)}
                
                <div class="admin-header">
                    <h1 class="admin-header-title">${this.getTitle()}</h1>
                    <div class="admin-header-user" onclick="Router.navigate('profile')">
                        <span>👤</span>
                    </div>
                </div>

                <div class="admin-content" id="adminContent">
                    <div class="empty-state">
                        <div class="empty-state-icon">📊</div>
                        <div class="empty-state-text">加载中...</div>
                    </div>
                </div>
            </div>
        `;

        this.bindSidebarEvents();
        this.loadView();
    },

    getTitle() {
        const titles = {
            'dashboard': '仪表盘',
            'adminUsers': '用户管理',
            'adminCategories': '分类管理',
            'adminDepartments': '部门管理',
            'adminAnnouncements': '公告管理',
            'adminLogs': '操作日志',
            'settings': '系统设置'
        };
        return titles[this.currentView] || '管理后台';
    },

    bindSidebarEvents() {
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const route = item.getAttribute('onclick').match(/'([^']+)'/)[1];
                if (route !== this.currentView) {
                    this.currentView = route;
                    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    document.querySelector('.admin-header-title').textContent = this.getTitle();
                    this.loadView();
                }
            });
        });
    },

    async loadView() {
        const content = document.getElementById('adminContent');

        switch (this.currentView) {
            case 'dashboard':
                await this.renderDashboard(content);
                break;
            case 'adminUsers':
                await this.renderUsers(content);
                break;
            case 'adminCategories':
                await this.renderCategories(content);
                break;
            case 'adminDepartments':
                await this.renderDepartments(content);
                break;
            case 'adminAnnouncements':
                await this.renderAnnouncements(content);
                break;
            case 'adminLogs':
                await this.renderLogs(content);
                break;
            case 'settings':
                this.renderSettings(content);
                break;
            default:
                content.innerHTML = '<div class="empty-state"><div class="empty-state-text">未知页面</div></div>';
        }
    },

    async renderDashboard(content) {
        try {
            const result = await ApiService.get('/tousu/admin/statistics/get');
            
            if (result.code === 0) {
                const data = result.data;
                content.innerHTML = `
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-card-icon">📋</div>
                            <div class="stat-card-title">总投诉数</div>
                            <div class="stat-card-value">${data.total || 0}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-icon">⏳</div>
                            <div class="stat-card-title">待处理</div>
                            <div class="stat-card-value">${data.pending || 0}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-icon">⚙️</div>
                            <div class="stat-card-title">处理中</div>
                            <div class="stat-card-value">${data.processing || 0}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-icon">✅</div>
                            <div class="stat-card-title">已完成</div>
                            <div class="stat-card-value">${data.completed || 0}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-icon">📊</div>
                            <div class="stat-card-title">完成率</div>
                            <div class="stat-card-value">${data.complete_rate || 0}%</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-icon">⭐</div>
                            <div class="stat-card-title">平均评分</div>
                            <div class="stat-card-value">${data.evaluation?.avg_rating || 0}</div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">类型分布</h3>
                        </div>
                        <div class="card-body">
                            ${(data.type_stats || []).map(s => `
                                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                                    <span>${s.type === 'complaint' ? '投诉' : '建议'}</span>
                                    <span style="font-weight: 500;">${s.count}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('加载统计数据失败:', error);
            content.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-text">加载失败</div></div>';
        }
    },

    async renderUsers(content) {
        try {
            const result = await ApiService.get('/tousu/admin/user/list/get', { page: 1, page_size: 50 });
            
            if (result.code === 0) {
                const users = result.data.items || [];
                content.innerHTML = `
                    <div class="data-table">
                        <div class="data-table-header">
                            <h3 class="data-table-title">用户列表 (${result.data.total})</h3>
                            <div class="data-table-actions">
                                <button class="btn btn-primary btn-sm" onclick="AdminPage.showCreateUser()">+ 添加用户</button>
                            </div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>用户名</th>
                                    <th>昵称</th>
                                    <th>手机号</th>
                                    <th>角色</th>
                                    <th>状态</th>
                                    <th>创建时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${users.map(u => `
                                    <tr>
                                        <td>${u.id}</td>
                                        <td>${u.username}</td>
                                        <td>${u.nickname}</td>
                                        <td>${u.phone}</td>
                                        <td><span class="badge ${u.role === 'admin' ? 'badge-primary' : u.role === 'staff' ? 'badge-info' : 'badge-secondary'}">${u.role_text}</span></td>
                                        <td><span class="badge ${u.status === 0 ? 'badge-success' : 'badge-danger'}">${u.status_text}</span></td>
                                        <td>${u.created_at}</td>
                                        <td>
                                            <button class="btn btn-sm btn-outline" onclick="AdminPage.editUser(${u.id})">编辑</button>
                                            <button class="btn btn-sm btn-danger" onclick="AdminPage.deleteUser(${u.id})">删除</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        } catch (error) {
            console.error('加载用户列表失败:', error);
            content.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-text">加载失败</div></div>';
        }
    },

    async renderCategories(content) {
        try {
            const result = await ApiService.get('/tousu/category/list/get');
            
            if (result.code === 0) {
                const categories = result.data.items || [];
                content.innerHTML = `
                    <div class="data-table">
                        <div class="data-table-header">
                            <h3 class="data-table-title">分类管理</h3>
                            <div class="data-table-actions">
                                <button class="btn btn-primary btn-sm" onclick="AdminPage.showCreateCategory()">+ 添加分类</button>
                            </div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>分类名称</th>
                                    <th>编码</th>
                                    <th>描述</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${categories.map(c => `
                                    <tr>
                                        <td>${c.id}</td>
                                        <td>${c.name}</td>
                                        <td>${c.code}</td>
                                        <td>${c.description || '-'}</td>
                                        <td><span class="badge ${c.status === 1 ? 'badge-success' : 'badge-danger'}">${c.status === 1 ? '启用' : '禁用'}</span></td>
                                        <td>
                                            <button class="btn btn-sm btn-outline" onclick="AdminPage.editCategory(${c.id})">编辑</button>
                                            <button class="btn btn-sm btn-danger" onclick="AdminPage.deleteCategory(${c.id})">删除</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        } catch (error) {
            console.error('加载分类列表失败:', error);
            content.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-text">加载失败</div></div>';
        }
    },

    async renderDepartments(content) {
        try {
            const result = await ApiService.get('/tousu/department/list/get');
            
            if (result.code === 0) {
                const departments = result.data.items || [];
                content.innerHTML = `
                    <div class="data-table">
                        <div class="data-table-header">
                            <h3 class="data-table-title">部门管理</h3>
                            <div class="data-table-actions">
                                <button class="btn btn-primary btn-sm" onclick="AdminPage.showCreateDepartment()">+ 添加部门</button>
                            </div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>部门名称</th>
                                    <th>编码</th>
                                    <th>描述</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${departments.map(d => `
                                    <tr>
                                        <td>${d.id}</td>
                                        <td>${d.name}</td>
                                        <td>${d.code}</td>
                                        <td>${d.description || '-'}</td>
                                        <td><span class="badge ${d.status === 1 ? 'badge-success' : 'badge-danger'}">${d.status === 1 ? '启用' : '禁用'}</span></td>
                                        <td>
                                            <button class="btn btn-sm btn-outline" onclick="AdminPage.editDepartment(${d.id})">编辑</button>
                                            <button class="btn btn-sm btn-danger" onclick="AdminPage.deleteDepartment(${d.id})">删除</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        } catch (error) {
            console.error('加载部门列表失败:', error);
            content.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-text">加载失败</div></div>';
        }
    },

    async renderAnnouncements(content) {
        try {
            const result = await ApiService.get('/tousu/admin/announcement/list/get', { page: 1, page_size: 50 });
            
            if (result.code === 0) {
                const announcements = result.data.items || [];
                content.innerHTML = `
                    <div class="data-table">
                        <div class="data-table-header">
                            <h3 class="data-table-title">公告管理 (${result.data.total})</h3>
                            <div class="data-table-actions">
                                <button class="btn btn-primary btn-sm" onclick="AdminPage.showCreateAnnouncement()">+ 发布公告</button>
                            </div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>标题</th>
                                    <th>状态</th>
                                    <th>发布时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${announcements.map(a => `
                                    <tr>
                                        <td>${a.id}</td>
                                        <td>${a.title}</td>
                                        <td><span class="badge ${a.status === 1 ? 'badge-success' : 'badge-secondary'}">${a.status_text}</span></td>
                                        <td>${a.publish_time || a.created_at}</td>
                                        <td>
                                            ${a.status === 0 ? `<button class="btn btn-sm btn-success" onclick="AdminPage.publishAnnouncement(${a.id})">发布</button>` : ''}
                                            <button class="btn btn-sm btn-outline" onclick="AdminPage.editAnnouncement(${a.id})">编辑</button>
                                            <button class="btn btn-sm btn-danger" onclick="AdminPage.deleteAnnouncement(${a.id})">删除</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        } catch (error) {
            console.error('加载公告列表失败:', error);
            content.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-text">加载失败</div></div>';
        }
    },

    async renderLogs(content) {
        try {
            const result = await ApiService.get('/tousu/admin/log/list/get', { page: 1, page_size: 50 });
            
            if (result.code === 0) {
                const logs = result.data.items || [];
                content.innerHTML = `
                    <div class="data-table">
                        <div class="data-table-header">
                            <h3 class="data-table-title">操作日志</h3>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>用户ID</th>
                                    <th>操作类型</th>
                                    <th>目标类型</th>
                                    <th>目标ID</th>
                                    <th>描述</th>
                                    <th>时间</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${logs.map(l => `
                                    <tr>
                                        <td>${l.id}</td>
                                        <td>${l.user_id}</td>
                                        <td><span class="badge badge-info">${l.action_text}</span></td>
                                        <td>${l.target_type || '-'}</td>
                                        <td>${l.target_id || '-'}</td>
                                        <td>${l.description || '-'}</td>
                                        <td>${l.created_at}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        } catch (error) {
            console.error('加载日志失败:', error);
            content.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-text">加载失败</div></div>';
        }
    },

    renderSettings(content) {
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">系统设置</h3>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label">系统名称</label>
                        <input type="text" class="form-control" value="校园投诉建议系统" disabled>
                    </div>
                    <div class="form-group">
                        <label class="form-label">版本信息</label>
                        <input type="text" class="form-control" value="v1.0.0" disabled>
                    </div>
                    <button class="btn btn-primary" onclick="Toast.info('暂无更新')">检查更新</button>
                </div>
            </div>
        `;
    },

    showCreateUser() {
        this.showModal('createUser', '创建用户', `
            <div class="form-group">
                <label class="form-label">用户名 <span style="color: #ef4444;">*</span></label>
                <input type="text" class="form-control" id="modal_username" placeholder="请输入用户名">
            </div>
            <div class="form-group">
                <label class="form-label">手机号 <span style="color: #ef4444;">*</span></label>
                <input type="text" class="form-control" id="modal_phone" placeholder="请输入手机号">
            </div>
            <div class="form-group">
                <label class="form-label">昵称</label>
                <input type="text" class="form-control" id="modal_nickname" placeholder="请输入昵称">
            </div>
            <div class="form-group">
                <label class="form-label">角色 <span style="color: #ef4444;">*</span></label>
                <select class="form-control" id="modal_role">
                    <option value="student">学生</option>
                    <option value="staff">教职工</option>
                    <option value="admin">管理员</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">密码 <span style="color: #ef4444;">*</span></label>
                <input type="password" class="form-control" id="modal_password" placeholder="请输入密码（至少6位）">
            </div>
        `, () => this.handleCreateUser());
    },

    async handleCreateUser() {
        const username = document.getElementById('modal_username').value.trim();
        const phone = document.getElementById('modal_phone').value.trim();
        const nickname = document.getElementById('modal_nickname').value.trim();
        const role = document.getElementById('modal_role').value;
        const password = document.getElementById('modal_password').value;

        if (!username) {
            Toast.error('请输入用户名');
            return;
        }
        if (!phone) {
            Toast.error('请输入手机号');
            return;
        }
        if (!password || password.length < 6) {
            Toast.error('密码至少6位');
            return;
        }

        try {
            const result = await ApiService.post('/tousu/user/register', {
                username, phone, nickname, role, password
            });
            if (result.code === 0) {
                Toast.success('创建成功');
                this.hideModal();
                this.renderUsers(document.getElementById('adminContent'));
            } else {
                Toast.error(result.msg || '创建失败');
            }
        } catch (error) {
            Toast.error('创建失败');
        }
    },

    editUser(id) {
        this.showModal('editUser', '编辑用户', `
            <div class="form-group">
                <label class="form-label">用户名</label>
                <input type="text" class="form-control" id="modal_username" disabled>
            </div>
            <div class="form-group">
                <label class="form-label">手机号</label>
                <input type="text" class="form-control" id="modal_phone">
            </div>
            <div class="form-group">
                <label class="form-label">昵称</label>
                <input type="text" class="form-control" id="modal_nickname">
            </div>
            <div class="form-group">
                <label class="form-label">角色</label>
                <select class="form-control" id="modal_role">
                    <option value="student">学生</option>
                    <option value="staff">教职工</option>
                    <option value="admin">管理员</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">状态</label>
                <select class="form-control" id="modal_status">
                    <option value="0">正常</option>
                    <option value="1">禁言</option>
                    <option value="2">封号</option>
                </select>
            </div>
        `, () => this.handleEditUser(id));
        this.loadUserForEdit(id);
    },

    async loadUserForEdit(id) {
        try {
            const result = await ApiService.get('/tousu/user/detail/get', { user_id: id });
            if (result.code === 0 && result.data) {
                document.getElementById('modal_username').value = result.data.username || '';
                document.getElementById('modal_phone').value = result.data.phone || '';
                document.getElementById('modal_nickname').value = result.data.nickname || '';
                document.getElementById('modal_role').value = result.data.role || 'student';
                document.getElementById('modal_status').value = result.data.status || 0;
            }
        } catch (error) {
            console.error('加载用户信息失败:', error);
        }
    },

    async handleEditUser(id) {
        const phone = document.getElementById('modal_phone').value.trim();
        const nickname = document.getElementById('modal_nickname').value.trim();
        const role = document.getElementById('modal_role').value;
        const status = parseInt(document.getElementById('modal_status').value);

        try {
            const result = await ApiService.post('/tousu/user/profile/update', {
                user_id: id, phone, nickname, role, status
            });
            if (result.code === 0) {
                Toast.success('更新成功');
                this.hideModal();
                this.renderUsers(document.getElementById('adminContent'));
            } else {
                Toast.error(result.msg || '更新失败');
            }
        } catch (error) {
            Toast.error('更新失败');
        }
    },

    async deleteUser(id) {
        if (!confirm('确定要删除该用户吗？')) return;

        try {
            const result = await ApiService.post(`/tousu/admin/user/delete?user_id=${id}`);
            if (result.code === 0) {
                Toast.success('删除成功');
                this.renderUsers(document.getElementById('adminContent'));
            } else {
                Toast.error(result.msg || '删除失败');
            }
        } catch (error) {
            Toast.error('删除失败');
        }
    },

    showCreateCategory() {
        this.showModal('createCategory', '创建分类', `
            <div class="form-group">
                <label class="form-label">分类名称 <span style="color: #ef4444;">*</span></label>
                <input type="text" class="form-control" id="modal_name" placeholder="请输入分类名称">
            </div>
            <div class="form-group">
                <label class="form-label">分类编码 <span style="color: #ef4444;">*</span></label>
                <input type="text" class="form-control" id="modal_code" placeholder="请输入分类编码（英文）">
            </div>
            <div class="form-group">
                <label class="form-label">描述</label>
                <textarea class="form-control" id="modal_description" rows="3" placeholder="请输入描述"></textarea>
            </div>
        `, () => this.handleCreateCategory());
    },

    async handleCreateCategory() {
        const name = document.getElementById('modal_name').value.trim();
        const code = document.getElementById('modal_code').value.trim();
        const description = document.getElementById('modal_description').value.trim();

        if (!name) {
            Toast.error('请输入分类名称');
            return;
        }
        if (!code) {
            Toast.error('请输入分类编码');
            return;
        }

        try {
            const result = await ApiService.post('/tousu/category/create', {
                name, code, description
            });
            if (result.code === 0) {
                Toast.success('创建成功');
                this.hideModal();
                this.renderCategories(document.getElementById('adminContent'));
            } else {
                Toast.error(result.msg || '创建失败');
            }
        } catch (error) {
            Toast.error('创建失败');
        }
    },

    editCategory(id) {
        this.showModal('editCategory', '编辑分类', `
            <div class="form-group">
                <label class="form-label">分类名称 <span style="color: #ef4444;">*</span></label>
                <input type="text" class="form-control" id="modal_name" placeholder="请输入分类名称">
            </div>
            <div class="form-group">
                <label class="form-label">分类编码 <span style="color: #ef4444;">*</span></label>
                <input type="text" class="form-control" id="modal_code" placeholder="请输入分类编码（英文）">
            </div>
            <div class="form-group">
                <label class="form-label">描述</label>
                <textarea class="form-control" id="modal_description" rows="3" placeholder="请输入描述"></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">状态</label>
                <select class="form-control" id="modal_status">
                    <option value="1">启用</option>
                    <option value="0">禁用</option>
                </select>
            </div>
        `, () => this.handleEditCategory(id));
        this.loadCategoryForEdit(id);
    },

    async loadCategoryForEdit(id) {
        try {
            const result = await ApiService.get('/tousu/category/detail/get', { category_id: id });
            if (result.code === 0 && result.data) {
                document.getElementById('modal_name').value = result.data.name || '';
                document.getElementById('modal_code').value = result.data.code || '';
                document.getElementById('modal_description').value = result.data.description || '';
                document.getElementById('modal_status').value = result.data.status || 1;
            }
        } catch (error) {
            console.error('加载分类信息失败:', error);
        }
    },

    async handleEditCategory(id) {
        const name = document.getElementById('modal_name').value.trim();
        const code = document.getElementById('modal_code').value.trim();
        const description = document.getElementById('modal_description').value.trim();
        const status = parseInt(document.getElementById('modal_status').value);

        if (!name) {
            Toast.error('请输入分类名称');
            return;
        }
        if (!code) {
            Toast.error('请输入分类编码');
            return;
        }

        try {
            const result = await ApiService.post('/tousu/category/update', {
                category_id: id, name, code, description, status
            });
            if (result.code === 0) {
                Toast.success('更新成功');
                this.hideModal();
                this.renderCategories(document.getElementById('adminContent'));
            } else {
                Toast.error(result.msg || '更新失败');
            }
        } catch (error) {
            Toast.error('更新失败');
        }
    },

    async deleteCategory(id) {
        if (!confirm('确定要删除该分类吗？')) return;

        try {
            const result = await ApiService.post(`/tousu/category/delete?category_id=${id}`);
            if (result.code === 0) {
                Toast.success('删除成功');
                this.renderCategories(document.getElementById('adminContent'));
            } else {
                Toast.error(result.msg || '删除失败');
            }
        } catch (error) {
            Toast.error('删除失败');
        }
    },

    showCreateDepartment() {
        this.showModal('createDepartment', '创建部门', `
            <div class="form-group">
                <label class="form-label">部门名称 <span style="color: #ef4444;">*</span></label>
                <input type="text" class="form-control" id="modal_name" placeholder="请输入部门名称">
            </div>
            <div class="form-group">
                <label class="form-label">部门编码 <span style="color: #ef4444;">*</span></label>
                <input type="text" class="form-control" id="modal_code" placeholder="请输入部门编码（英文）">
            </div>
            <div class="form-group">
                <label class="form-label">描述</label>
                <textarea class="form-control" id="modal_description" rows="3" placeholder="请输入描述"></textarea>
            </div>
        `, () => this.handleCreateDepartment());
    },

    async handleCreateDepartment() {
        const name = document.getElementById('modal_name').value.trim();
        const code = document.getElementById('modal_code').value.trim();
        const description = document.getElementById('modal_description').value.trim();

        if (!name) {
            Toast.error('请输入部门名称');
            return;
        }
        if (!code) {
            Toast.error('请输入部门编码');
            return;
        }

        try {
            const result = await ApiService.post('/tousu/department/create', {
                name, code, description
            });
            if (result.code === 0) {
                Toast.success('创建成功');
                this.hideModal();
                this.renderDepartments(document.getElementById('adminContent'));
            } else {
                Toast.error(result.msg || '创建失败');
            }
        } catch (error) {
            Toast.error('创建失败');
        }
    },

    editDepartment(id) {
        this.showModal('editDepartment', '编辑部门', `
            <div class="form-group">
                <label class="form-label">部门名称 <span style="color: #ef4444;">*</span></label>
                <input type="text" class="form-control" id="modal_name" placeholder="请输入部门名称">
            </div>
            <div class="form-group">
                <label class="form-label">部门编码 <span style="color: #ef4444;">*</span></label>
                <input type="text" class="form-control" id="modal_code" placeholder="请输入部门编码（英文）">
            </div>
            <div class="form-group">
                <label class="form-label">描述</label>
                <textarea class="form-control" id="modal_description" rows="3" placeholder="请输入描述"></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">状态</label>
                <select class="form-control" id="modal_status">
                    <option value="1">启用</option>
                    <option value="0">禁用</option>
                </select>
            </div>
        `, () => this.handleEditDepartment(id));
        this.loadDepartmentForEdit(id);
    },

    async loadDepartmentForEdit(id) {
        try {
            const result = await ApiService.get('/tousu/department/detail/get', { department_id: id });
            if (result.code === 0 && result.data) {
                document.getElementById('modal_name').value = result.data.name || '';
                document.getElementById('modal_code').value = result.data.code || '';
                document.getElementById('modal_description').value = result.data.description || '';
                document.getElementById('modal_status').value = result.data.status || 1;
            }
        } catch (error) {
            console.error('加载部门信息失败:', error);
        }
    },

    async handleEditDepartment(id) {
        const name = document.getElementById('modal_name').value.trim();
        const code = document.getElementById('modal_code').value.trim();
        const description = document.getElementById('modal_description').value.trim();
        const status = parseInt(document.getElementById('modal_status').value);

        if (!name) {
            Toast.error('请输入部门名称');
            return;
        }
        if (!code) {
            Toast.error('请输入部门编码');
            return;
        }

        try {
            const result = await ApiService.post('/tousu/department/update', {
                department_id: id, name, code, description, status
            });
            if (result.code === 0) {
                Toast.success('更新成功');
                this.hideModal();
                this.renderDepartments(document.getElementById('adminContent'));
            } else {
                Toast.error(result.msg || '更新失败');
            }
        } catch (error) {
            Toast.error('更新失败');
        }
    },

    async deleteDepartment(id) {
        if (!confirm('确定要删除该部门吗？')) return;

        try {
            const result = await ApiService.post(`/tousu/department/delete?department_id=${id}`);
            if (result.code === 0) {
                Toast.success('删除成功');
                this.renderDepartments(document.getElementById('adminContent'));
            } else {
                Toast.error(result.msg || '删除失败');
            }
        } catch (error) {
            Toast.error('删除失败');
        }
    },

    showCreateAnnouncement() {
        this.showModal('createAnnouncement', '发布公告', `
            <div class="form-group">
                <label class="form-label">公告标题 <span style="color: #ef4444;">*</span></label>
                <input type="text" class="form-control" id="modal_title" placeholder="请输入公告标题">
            </div>
            <div class="form-group">
                <label class="form-label">公告内容 <span style="color: #ef4444;">*</span></label>
                <textarea class="form-control" id="modal_content" rows="6" placeholder="请输入公告内容"></textarea>
            </div>
        `, () => this.handleCreateAnnouncement());
    },

    async handleCreateAnnouncement() {
        const title = document.getElementById('modal_title').value.trim();
        const content = document.getElementById('modal_content').value.trim();

        if (!title) {
            Toast.error('请输入公告标题');
            return;
        }
        if (!content) {
            Toast.error('请输入公告内容');
            return;
        }

        try {
            const result = await ApiService.post('/tousu/admin/announcement/create', {
                title, content
            });
            if (result.code === 0) {
                Toast.success('发布成功');
                this.hideModal();
                this.renderAnnouncements(document.getElementById('adminContent'));
            } else {
                Toast.error(result.msg || '发布失败');
            }
        } catch (error) {
            Toast.error('发布失败');
        }
    },

    editAnnouncement(id) {
        this.showModal('editAnnouncement', '编辑公告', `
            <div class="form-group">
                <label class="form-label">公告标题 <span style="color: #ef4444;">*</span></label>
                <input type="text" class="form-control" id="modal_title" placeholder="请输入公告标题">
            </div>
            <div class="form-group">
                <label class="form-label">公告内容 <span style="color: #ef4444;">*</span></label>
                <textarea class="form-control" id="modal_content" rows="6" placeholder="请输入公告内容"></textarea>
            </div>
        `, () => this.handleEditAnnouncement(id));
        this.loadAnnouncementForEdit(id);
    },

    async loadAnnouncementForEdit(id) {
        try {
            const result = await ApiService.get('/tousu/admin/announcement/detail/get', { announcement_id: id });
            if (result.code === 0 && result.data) {
                document.getElementById('modal_title').value = result.data.title || '';
                document.getElementById('modal_content').value = result.data.content || '';
            }
        } catch (error) {
            console.error('加载公告信息失败:', error);
        }
    },

    async handleEditAnnouncement(id) {
        const title = document.getElementById('modal_title').value.trim();
        const content = document.getElementById('modal_content').value.trim();

        if (!title) {
            Toast.error('请输入公告标题');
            return;
        }
        if (!content) {
            Toast.error('请输入公告内容');
            return;
        }

        try {
            const result = await ApiService.post('/tousu/admin/announcement/update', {
                announcement_id: id, title, content
            });
            if (result.code === 0) {
                Toast.success('更新成功');
                this.hideModal();
                this.renderAnnouncements(document.getElementById('adminContent'));
            } else {
                Toast.error(result.msg || '更新失败');
            }
        } catch (error) {
            Toast.error('更新失败');
        }
    },

    async publishAnnouncement(id) {
        try {
            const result = await ApiService.post(`/tousu/admin/announcement/publish?announcement_id=${id}`);
            if (result.code === 0) {
                Toast.success('发布成功');
                this.renderAnnouncements(document.getElementById('adminContent'));
            } else {
                Toast.error(result.msg || '发布失败');
            }
        } catch (error) {
            Toast.error('发布失败');
        }
    },

    async deleteAnnouncement(id) {
        if (!confirm('确定要删除该公告吗？')) return;

        try {
            const result = await ApiService.post(`/tousu/admin/announcement/delete?announcement_id=${id}`);
            if (result.code === 0) {
                Toast.success('删除成功');
                this.renderAnnouncements(document.getElementById('adminContent'));
            } else {
                Toast.error(result.msg || '删除失败');
            }
        } catch (error) {
            Toast.error('删除失败');
        }
    },

    showModal(type, title, content, onConfirm) {
        this.currentModalType = type;
        this.currentModalConfirm = onConfirm;

        const modal = document.createElement('div');
        modal.id = 'adminModal';
        modal.className = 'modal-mask';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <span class="modal-close" onclick="AdminPage.hideModal()">×</span>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="AdminPage.hideModal()">取消</button>
                    <button class="btn btn-primary" onclick="AdminPage.confirmModal()">确定</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    hideModal() {
        const modal = document.getElementById('adminModal');
        if (modal) {
            modal.remove();
        }
        this.currentModalConfirm = null;
    },

    confirmModal() {
        if (this.currentModalConfirm) {
            this.currentModalConfirm();
        }
    }
};

window.AdminPage = AdminPage;