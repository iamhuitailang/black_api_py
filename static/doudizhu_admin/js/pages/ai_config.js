const AiConfigPage = {
    page: 1,
    pageSize: 20,
    data: null,
    editingConfig: null,

    render() {
        if (!AuthService.requireAuth()) return;

        const content = `
            <div class="page-container">
                <div class="page-toolbar">
                    <div class="filter-box">
                        <select id="difficultyFilter">
                            <option value="">全部难度</option>
                            <option value="0">简单</option>
                            <option value="1">普通</option>
                            <option value="2">困难</option>
                        </select>
                        <button class="btn btn-primary" id="addBtn">+ 新增配置</button>
                    </div>
                </div>

                <div class="table-card">
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>名称</th>
                                    <th>难度</th>
                                    <th>描述</th>
                                    <th>思考时间</th>
                                    <th>炸弹概率</th>
                                    <th>单牌概率</th>
                                    <th>默认</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="configTableBody">
                                <tr><td colspan="10"><div class="loading">加载中...</div></td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination" id="pagination"></div>
                </div>
            </div>

            <div class="modal" id="configModal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modalTitle">新增AI配置</h3>
                        <button class="btn btn-close" id="closeModalBtn">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="configForm">
                            <input type="hidden" id="configId" />
                            <div class="form-group">
                                <label>配置名称 *</label>
                                <input type="text" id="configName" required />
                            </div>
                            <div class="form-group">
                                <label>难度 *</label>
                                <select id="configDifficulty" required>
                                    <option value="0">简单</option>
                                    <option value="1">普通</option>
                                    <option value="2">困难</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>描述</label>
                                <input type="text" id="configDescription" />
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>思考时间(ms) *</label>
                                    <input type="number" id="configThinkTime" value="1000" required />
                                </div>
                                <div class="form-group">
                                    <label>炸弹概率 *</label>
                                    <input type="number" id="configBombProb" step="0.1" min="0" max="1" value="0.3" required />
                                </div>
                                <div class="form-group">
                                    <label>单牌概率 *</label>
                                    <input type="number" id="configSingleProb" step="0.1" min="0" max="1" value="0.5" required />
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="configIsDefault" /> 设为默认配置
                                </label>
                            </div>
                            <div class="form-group">
                                <label>状态</label>
                                <select id="configStatus">
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
        Layout.setPageTitle('🤖 AI配置管理');
        Layout.init();

        this.bindEvents();
        this.loadData();
    },

    bindEvents() {
        document.getElementById('difficultyFilter').addEventListener('change', () => {
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
            this.saveConfig();
        });
    },

    async loadData() {
        const difficulty = document.getElementById('difficultyFilter').value;
        const params = {
            page: this.page,
            page_size: this.pageSize
        };
        if (difficulty !== '') params.difficulty = parseInt(difficulty);

        const result = await Api.get('/ai/config/list/get', params);
        const tbody = document.getElementById('configTableBody');

        if (result.code === 0 && result.data) {
            this.data = result.data;
            tbody.innerHTML = this.renderTable(result.data.items || []);
            this.renderPagination(result.data);
            this.bindActionEvents();
        } else {
            tbody.innerHTML = '<tr><td colspan="10"><div class="empty">暂无数据</div></td></tr>';
        }
    },

    renderTable(items) {
        if (!items || items.length === 0) {
            return '<tr><td colspan="10"><div class="empty">暂无数据</div></td></tr>';
        }

        const difficultyMap = { 0: '简单', 1: '普通', 2: '困难' };

        return items.map(config => `
            <tr>
                <td>${config.id}</td>
                <td>${config.name}</td>
                <td>
                    <span class="badge badge-${config.difficulty}">
                        ${difficultyMap[config.difficulty] || '未知'}
                    </span>
                </td>
                <td>${config.description || '-'}</td>
                <td>${config.think_time}ms</td>
                <td>${(config.bomb_probability * 100).toFixed(0)}%</td>
                <td>${(config.single_probability * 100).toFixed(0)}%</td>
                <td>
                    ${config.is_default === 1 ? '<span class="badge badge-success">是</span>' : '-'}
                </td>
                <td>
                    <span class="badge ${config.status === 1 ? 'badge-success' : 'badge-secondary'}">
                        ${config.status === 1 ? '启用' : '禁用'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-small btn-primary" data-action="edit" data-id="${config.id}">编辑</button>
                        <button class="btn btn-small btn-danger" data-action="delete" data-id="${config.id}">删除</button>
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
                    const config = this.data.items.find(c => c.id === id);
                    this.openModal(config);
                } else if (action === 'delete') {
                    if (!confirm('确定要删除该配置吗？')) return;

                    const result = await Api.post('/admin/ai/config/delete', { config_id: id });
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

    openModal(config = null) {
        this.editingConfig = config;
        document.getElementById('modalTitle').textContent = config ? '编辑AI配置' : '新增AI配置';

        if (config) {
            document.getElementById('configId').value = config.id;
            document.getElementById('configName').value = config.name;
            document.getElementById('configDifficulty').value = config.difficulty;
            document.getElementById('configDescription').value = config.description || '';
            document.getElementById('configThinkTime').value = config.think_time;
            document.getElementById('configBombProb').value = config.bomb_probability;
            document.getElementById('configSingleProb').value = config.single_probability;
            document.getElementById('configIsDefault').checked = config.is_default === 1;
            document.getElementById('configStatus').value = config.status;
        } else {
            document.getElementById('configForm').reset();
            document.getElementById('configId').value = '';
        }

        document.getElementById('configModal').style.display = 'flex';
    },

    closeModal() {
        document.getElementById('configModal').style.display = 'none';
        this.editingConfig = null;
    },

    async saveConfig() {
        const form = document.getElementById('configForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const data = {
            name: document.getElementById('configName').value,
            difficulty: parseInt(document.getElementById('configDifficulty').value),
            description: document.getElementById('configDescription').value,
            think_time: parseInt(document.getElementById('configThinkTime').value),
            bomb_probability: parseFloat(document.getElementById('configBombProb').value),
            single_probability: parseFloat(document.getElementById('configSingleProb').value),
            is_default: document.getElementById('configIsDefault').checked ? 1 : 0,
            status: parseInt(document.getElementById('configStatus').value)
        };

        let result;
        if (this.editingConfig) {
            data.id = this.editingConfig.id;
            result = await Api.post('/admin/ai/config/update', data);
        } else {
            result = await Api.post('/admin/ai/config/create', data);
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
