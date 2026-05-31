const AchievementsPage = {
    page: 1,
    pageSize: 20,
    data: null,
    editingAchievement: null,

    render() {
        if (!AuthService.requireAuth()) return;

        const content = `
            <div class="page-container">
                <div class="page-toolbar">
                    <div class="filter-box">
                        <select id="typeFilter">
                            <option value="">全部类型</option>
                            <option value="0">胜场</option>
                            <option value="1">等级</option>
                            <option value="2">金币</option>
                            <option value="3">特殊</option>
                        </select>
                        <button class="btn btn-primary" id="addBtn">+ 新增成就</button>
                    </div>
                </div>

                <div class="table-card">
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>名称</th>
                                    <th>类型</th>
                                    <th>描述</th>
                                    <th>条件值</th>
                                    <th>金币奖励</th>
                                    <th>经验奖励</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="achievementTableBody">
                                <tr><td colspan="9"><div class="loading">加载中...</div></td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination" id="pagination"></div>
                </div>
            </div>

            <div class="modal" id="achievementModal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modalTitle">新增成就</h3>
                        <button class="btn btn-close" id="closeModalBtn">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="achievementForm">
                            <input type="hidden" id="achievementId" />
                            <div class="form-group">
                                <label>成就名称 *</label>
                                <input type="text" id="achievementName" required />
                            </div>
                            <div class="form-group">
                                <label>类型 *</label>
                                <select id="achievementType" required>
                                    <option value="0">胜场</option>
                                    <option value="1">等级</option>
                                    <option value="2">金币</option>
                                    <option value="3">特殊</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>描述</label>
                                <input type="text" id="achievementDescription" />
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>条件值 *</label>
                                    <input type="number" id="achievementCondition" value="1" required />
                                </div>
                                <div class="form-group">
                                    <label>金币奖励</label>
                                    <input type="number" id="achievementCoins" value="0" />
                                </div>
                                <div class="form-group">
                                    <label>经验奖励</label>
                                    <input type="number" id="achievementExp" value="0" />
                                </div>
                            </div>
                            <div class="form-group">
                                <label>图标</label>
                                <input type="text" id="achievementIcon" placeholder="图标URL或emoji" />
                            </div>
                            <div class="form-group">
                                <label>状态</label>
                                <select id="achievementStatus">
                                    <option value="1">启用</option>
                                    <option value="0">禁用</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" id="cancelBtn">取消</button>
                        <button class="btn btn-primary" id="saveBtn">保存</button>
                    </div>
                </div>
            </div>
        `;

        const app = document.getElementById('app');
        app.innerHTML = Layout.render(content);
        Layout.setPageTitle('🏆 成就管理');
        Layout.init();

        this.bindEvents();
        this.loadData();
    },

    bindEvents() {
        document.getElementById('typeFilter').addEventListener('change', () => {
            this.page = 1;
            this.loadData();
        });

        document.getElementById('addBtn').addEventListener('click', () => {
            this.openModal();
        });

        document.getElementById('closeModalBtn').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveAchievement();
        });
    },

    async loadData() {
        const type = document.getElementById('typeFilter').value;
        const params = {
            page: this.page,
            page_size: this.pageSize
        };
        if (type !== '') params.type = parseInt(type);

        const result = await Api.get('/achievement/list/get', params);
        const tbody = document.getElementById('achievementTableBody');

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

        const typeMap = { 0: '胜场', 1: '等级', 2: '金币', 3: '特殊' };
        const typeClassMap = { 0: 'badge-primary', 1: 'badge-info', 2: 'badge-warning', 3: 'badge-danger' };

        return items.map(achievement => `
            <tr>
                <td>${achievement.id}</td>
                <td>${achievement.icon || '🏆'} ${achievement.name}</td>
                <td>
                    <span class="badge ${typeClassMap[achievement.type] || 'badge-secondary'}">
                        ${typeMap[achievement.type] || '未知'}
                    </span>
                </td>
                <td>${achievement.description || '-'}</td>
                <td>${achievement.condition_value}</td>
                <td>${achievement.reward_coins || 0}</td>
                <td>${achievement.reward_exp || 0}</td>
                <td>
                    <span class="badge ${achievement.status === 1 ? 'badge-success' : 'badge-secondary'}">
                        ${achievement.status === 1 ? '启用' : '禁用'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-small btn-primary" data-action="edit" data-id="${achievement.id}">编辑</button>
                        <button class="btn btn-small btn-danger" data-action="delete" data-id="${achievement.id}">删除</button>
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

                if (action === 'edit') {
                    const achievement = this.data.items.find(c => c.id === id);
                    this.openModal(achievement);
                } else if (action === 'delete') {
                    if (!confirm('确定要删除该成就吗？')) return;

                    const result = await Api.post('/admin/achievement/delete', { achievement_id: id });
                    if (result.code === 0) {
                        Toast.success('删除成功');
                        this.loadData();
                    } else {
                        Toast.error(result.msg || '删除失败');
                    }
                }
            });
        });
    },

    openModal(achievement = null) {
        this.editingAchievement = achievement;
        document.getElementById('modalTitle').textContent = achievement ? '编辑成就' : '新增成就';

        if (achievement) {
            document.getElementById('achievementId').value = achievement.id;
            document.getElementById('achievementName').value = achievement.name;
            document.getElementById('achievementType').value = achievement.type;
            document.getElementById('achievementDescription').value = achievement.description || '';
            document.getElementById('achievementCondition').value = achievement.condition_value;
            document.getElementById('achievementCoins').value = achievement.reward_coins || 0;
            document.getElementById('achievementExp').value = achievement.reward_exp || 0;
            document.getElementById('achievementIcon').value = achievement.icon || '';
            document.getElementById('achievementStatus').value = achievement.status;
        } else {
            document.getElementById('achievementForm').reset();
            document.getElementById('achievementId').value = '';
        }

        document.getElementById('achievementModal').style.display = 'flex';
    },

    closeModal() {
        document.getElementById('achievementModal').style.display = 'none';
        this.editingAchievement = null;
    },

    async saveAchievement() {
        const form = document.getElementById('achievementForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const data = {
            name: document.getElementById('achievementName').value,
            type: parseInt(document.getElementById('achievementType').value),
            description: document.getElementById('achievementDescription').value,
            condition_value: parseInt(document.getElementById('achievementCondition').value),
            reward_coins: parseInt(document.getElementById('achievementCoins').value) || 0,
            reward_exp: parseInt(document.getElementById('achievementExp').value) || 0,
            icon: document.getElementById('achievementIcon').value,
            status: parseInt(document.getElementById('achievementStatus').value)
        };

        let result;
        if (this.editingAchievement) {
            data.id = this.editingAchievement.id;
            result = await Api.post('/admin/achievement/update', data);
        } else {
            result = await Api.post('/admin/achievement/create', data);
        }

        if (result.code === 0) {
            Toast.success('保存成功');
            this.closeModal();
            this.loadData();
        } else {
            Toast.error(result.msg || '保存失败');
        }
    }
};
