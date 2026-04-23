const TabPage = {
    tabs: [],
    
    render() {
        const content = `
            <div class="page-header">
                <h1 class="page-title">Tab导航配置</h1>
                <p class="page-subtitle">管理移动端导航Tab和对应的内容详情</p>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Tab列表</h3>
                    <div class="toolbar-right">
                        <button class="btn btn-primary" id="addTabBtn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            添加Tab
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div id="tabList">
                        <div class="empty-state">
                            <div class="icon">📋</div>
                            <p>暂无Tab数据</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        Layout.render(content);
        this.bindEvents();
        this.loadData();
    },
    
    bindEvents() {
        document.getElementById('addTabBtn').addEventListener('click', () => {
            this.showTabModal();
        });
    },
    
    async loadData() {
        try {
            const result = await TabService.getList();
            if (result.code === 0) {
                this.tabs = result.data || [];
                this.renderTabList();
            }
        } catch (error) {
            Toast.error('加载数据失败');
            console.error(error);
        }
    },
    
    renderTabList() {
        const container = document.getElementById('tabList');
        
        if (this.tabs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📋</div>
                    <p>暂无Tab数据</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th style="width: 80px;">Tab ID</th>
                            <th>Tab名称</th>
                            <th style="width: 100px;">排序</th>
                            <th style="width: 180px;">创建时间</th>
                            <th style="width: 240px;">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.tabs.map(tab => `
                            <tr>
                                <td>${tab.tab_id}</td>
                                <td><strong>${tab.tab_name}</strong></td>
                                <td>${tab.sort_order}</td>
                                <td>${tab.created_at || '-'}</td>
                                <td>
                                    <div class="table-actions">
                                        <button class="btn btn-sm btn-secondary" data-action="edit" data-id="${tab.tab_id}" data-name="${tab.tab_name}" data-sort="${tab.sort_order}">编辑</button>
                                        <button class="btn btn-sm btn-primary" data-action="detail" data-id="${tab.tab_id}" data-name="${tab.tab_name}">内容配置</button>
                                        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${tab.tab_id}">删除</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        this.bindTableEvents();
    },
    
    bindTableEvents() {
        document.querySelectorAll('button[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = parseInt(btn.dataset.id);
                const tabName = btn.dataset.name;
                const sortOrder = parseInt(btn.dataset.sort);
                this.showTabModal({ tab_id: tabId, tab_name: tabName, sort_order: sortOrder });
            });
        });
        
        document.querySelectorAll('button[data-action="detail"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = parseInt(btn.dataset.id);
                const tabName = btn.dataset.name;
                this.showDetailModal(tabId, tabName);
            });
        });
        
        document.querySelectorAll('button[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = parseInt(btn.dataset.id);
                this.confirmDelete(tabId);
            });
        });
    },
    
    showTabModal(tab = null) {
        const isEdit = tab !== null;
        const title = isEdit ? '编辑Tab' : '添加Tab';
        
        const modalHtml = `
            <div class="modal-overlay show" id="tabModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close" data-close="tabModal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="tabForm">
                            <div class="form-group">
                                <label class="form-label">
                                    Tab名称<span class="required">*</span>
                                </label>
                                <input type="text" id="tabName" class="form-control" placeholder="请输入Tab名称" value="${tab?.tab_name || ''}">
                                <div class="form-error" id="tabNameError"></div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">排序</label>
                                <input type="number" id="tabSortOrder" class="form-control" placeholder="数字越小越靠前" value="${tab?.sort_order ?? 0}">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-close="tabModal">取消</button>
                        <button class="btn btn-primary" id="submitTab">${isEdit ? '保存' : '添加'}</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.bindModalEvents('tabModal');
        
        const submitBtn = document.getElementById('submitTab');
        submitBtn.addEventListener('click', async () => {
            await this.handleTabSubmit(isEdit ? tab.tab_id : null);
        });
    },
    
    async handleTabSubmit(tabId) {
        const tabName = document.getElementById('tabName').value.trim();
        const sortOrder = parseInt(document.getElementById('tabSortOrder').value) || 0;
        
        const nameError = document.getElementById('tabNameError');
        const nameInput = document.getElementById('tabName');
        
        if (!tabName) {
            nameError.textContent = '请输入Tab名称';
            nameInput.style.borderColor = 'var(--danger-color)';
            return;
        }
        
        nameError.textContent = '';
        nameInput.style.borderColor = '';
        
        try {
            const result = await TabService.set(tabId, tabName, sortOrder);
            
            if (result.code === 0) {
                Toast.success(tabId ? '编辑成功' : '添加成功');
                this.closeModal('tabModal');
                this.loadData();
            } else {
                Toast.error(result.message || '操作失败');
            }
        } catch (error) {
            Toast.error('网络错误');
        }
    },
    
    async showDetailModal(tabId, tabName) {
        let detailData = { title: '', content: '' };
        
        try {
            const result = await TabService.getDetail(tabId);
            if (result.code === 0 && result.data) {
                detailData = result.data;
            }
        } catch (error) {
            console.error('获取详情失败:', error);
        }
        
        const modalHtml = `
            <div class="modal-overlay show" id="detailModal">
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <h3 class="modal-title">内容配置 - ${tabName}</h3>
                        <button class="modal-close" data-close="detailModal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="detailForm">
                            <div class="form-group">
                                <label class="form-label">标题</label>
                                <input type="text" id="detailTitle" class="form-control" placeholder="请输入标题（可选）" value="${detailData.title || ''}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">内容（支持富文本/HTML）</label>
                                <textarea id="detailContent" class="form-control" rows="10" placeholder="请输入内容（支持HTML标签）">${detailData.content || ''}</textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-close="detailModal">取消</button>
                        <button class="btn btn-primary" id="submitDetail">保存</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.bindModalEvents('detailModal');
        
        const submitBtn = document.getElementById('submitDetail');
        submitBtn.addEventListener('click', async () => {
            await this.handleDetailSubmit(tabId);
        });
    },
    
    async handleDetailSubmit(tabId) {
        const title = document.getElementById('detailTitle').value.trim();
        const content = document.getElementById('detailContent').value;
        
        try {
            const result = await TabService.setDetail(tabId, title, content);
            
            if (result.code === 0) {
                Toast.success('保存成功');
                this.closeModal('detailModal');
            } else {
                Toast.error(result.message || '保存失败');
            }
        } catch (error) {
            Toast.error('网络错误');
        }
    },
    
    confirmDelete(tabId) {
        const modalHtml = `
            <div class="modal-overlay show" id="confirmModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">确认删除</h3>
                        <button class="modal-close" data-close="confirmModal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>确定要删除这个Tab吗？</p>
                        <p style="color: var(--text-secondary); font-size: 13px; margin-top: 8px;">
                            提示：Tab ID 1-4 有预设用途（1=牡丹简介, 2=城市文旅, 3=牡丹文化故事, 4=商业服务），删除后可能影响前端展示。
                        </p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-close="confirmModal">取消</button>
                        <button class="btn btn-danger" id="confirmDelete">确定删除</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.bindModalEvents('confirmModal');
        
        document.getElementById('confirmDelete').addEventListener('click', async () => {
            await this.deleteTab(tabId);
        });
    },
    
    async deleteTab(tabId) {
        try {
            const result = await TabService.delete(tabId);
            if (result.code === 0) {
                Toast.success('删除成功');
                this.closeModal('confirmModal');
                this.loadData();
            } else {
                Toast.error(result.message || '删除失败');
            }
        } catch (error) {
            Toast.error('网络错误');
        }
    },
    
    bindModalEvents(modalId) {
        const modal = document.getElementById(modalId);
        
        modal.querySelectorAll('[data-close="' + modalId + '"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal(modalId);
            });
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modalId);
            }
        });
    },
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 200);
        }
    }
};
