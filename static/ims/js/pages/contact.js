const ContactPage = {
    data: { items: [], total: 0, page: 1, page_size: 10, total_pages: 1 },
    searchKeyword: '',
    filterType: '',
    editMode: false,
    editItem: null,
    
    async render() {
        Layout.render('', '联系方式管理');
        Layout.updateTitle('联系方式管理');
        
        await this.loadData();
        this.renderContent();
    },
    
    async loadData() {
        try {
            const params = {
                page: this.data.page,
                page_size: this.data.page_size
            };
            if (this.searchKeyword) {
                params.keyword = this.searchKeyword;
            }
            if (this.filterType) {
                params.type = this.filterType;
            }
            
            const result = await ContactService.getList(params);
            if (result.code === 0) {
                this.data = result.data;
            } else {
                Toast.error(result.message || '加载失败');
            }
        } catch (e) {
            Toast.error('网络错误，请稍后重试');
        }
    },
    
    renderContent() {
        const items = this.data.items || [];
        
        const typeBadge = (type) => {
            if (type === 'supplier') {
                return '<span class="badge badge-info">供应商</span>';
            } else if (type === 'customer') {
                return '<span class="badge badge-success">客户</span>';
            }
            return '<span class="badge badge-secondary">-</span>';
        };
        
        const tableRows = items.length > 0 ? items.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.phone || '-'}</td>
                <td>${item.wechat || '-'}</td>
                <td>${item.company || '-'}</td>
                <td>${item.address || '-'}</td>
                <td>${typeBadge(item.type)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-secondary btn-sm" onclick="ContactPage.edit(${item.id})">编辑</button>
                        <button class="btn btn-danger btn-sm" onclick="ContactPage.confirmDelete(${item.id}, '${item.name}')">删除</button>
                    </div>
                </td>
            </tr>
        `).join('') : `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <div class="icon">👥</div>
                        <p>暂无联系方式数据</p>
                        <button class="btn btn-primary mt-2" onclick="ContactPage.add()">
                            新增联系方式
                        </button>
                    </div>
                </td>
            </tr>
        `;
        
        const paginationHtml = Layout.renderPagination(this.data, 'ContactPage.goToPage');
        
        const content = `
            <div class="page-header">
                <h1 class="page-title">联系方式管理</h1>
                <p class="page-subtitle">管理供应商和客户信息</p>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="toolbar">
                        <div class="toolbar-left">
                            <select class="form-control" style="width: auto;" onchange="ContactPage.changeType(this)">
                                <option value="">全部类型</option>
                                <option value="supplier" ${this.filterType === 'supplier' ? 'selected' : ''}>供应商</option>
                                <option value="customer" ${this.filterType === 'customer' ? 'selected' : ''}>客户</option>
                            </select>
                            <div class="search-box">
                                <span class="search-icon">🔍</span>
                                <input type="text" class="form-control" placeholder="搜索姓名/电话/公司..." 
                                    value="${this.searchKeyword}"
                                    onkeyup="ContactPage.handleSearch(event)">
                            </div>
                        </div>
                        <div class="toolbar-right">
                            <button class="btn btn-primary" onclick="ContactPage.add()">
                                ➕ 新增
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>姓名</th>
                                <th>电话</th>
                                <th>微信</th>
                                <th>公司</th>
                                <th>地址</th>
                                <th>类型</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
                
                ${paginationHtml ? `<div class="card-footer">${paginationHtml}</div>` : ''}
            </div>
        `;
        
        document.getElementById('mainContent').innerHTML = content;
    },
    
    changeType(select) {
        this.filterType = select.value;
        this.data.page = 1;
        this.loadData().then(() => this.renderContent());
    },
    
    handleSearch(event) {
        if (event.key === 'Enter') {
            this.searchKeyword = event.target.value.trim();
            this.data.page = 1;
            this.loadData().then(() => this.renderContent());
        }
    },
    
    async goToPage(page) {
        this.data.page = page;
        await this.loadData();
        this.renderContent();
    },
    
    async add() {
        this.editMode = false;
        this.editItem = null;
        this.showForm();
    },
    
    async edit(id) {
        try {
            const result = await ContactService.getById(id);
            if (result.code === 0) {
                this.editMode = true;
                this.editItem = result.data;
                this.showForm();
            } else {
                Toast.error(result.message || '获取数据失败');
            }
        } catch (e) {
            Toast.error('网络错误');
        }
    },
    
    showForm() {
        const item = this.editItem || {};
        const title = this.editMode ? '编辑联系方式' : '新增联系方式';
        
        const content = `
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <form id="contactForm">
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">
                                姓名 <span class="required">*</span>
                            </label>
                            <input type="text" name="name" class="form-control" 
                                value="${item.name || ''}" placeholder="请输入姓名">
                        </div>
                        <div class="form-group">
                            <label class="form-label">
                                类型 <span class="required">*</span>
                            </label>
                            <select name="type" class="form-control">
                                <option value="supplier" ${item.type === 'supplier' ? 'selected' : ''}>供应商</option>
                                <option value="customer" ${item.type === 'customer' || !item.type ? 'selected' : ''}>客户</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">电话</label>
                            <input type="tel" name="phone" class="form-control" 
                                value="${item.phone || ''}" placeholder="请输入电话">
                        </div>
                        <div class="form-group">
                            <label class="form-label">微信</label>
                            <input type="text" name="wechat" class="form-control" 
                                value="${item.wechat || ''}" placeholder="请输入微信号">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">公司名</label>
                        <input type="text" name="company" class="form-control" 
                            value="${item.company || ''}" placeholder="请输入公司名称">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">地址</label>
                        <input type="text" name="address" class="form-control" 
                            value="${item.address || ''}" placeholder="请输入地址">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">备注</label>
                        <textarea name="remark" class="form-control" 
                            placeholder="请输入备注信息">${item.remark || ''}</textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="Layout.hideModal()">取消</button>
                    <button type="submit" class="btn btn-primary" id="saveContactBtn">保存</button>
                </div>
            </form>
        `;
        
        Layout.showModal(content);
        
        const form = document.getElementById('contactForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveForm(form);
        });
    },
    
    async saveForm(form) {
        const data = FormUtil.getData(form);
        
        if (!data.name || !data.name.trim()) {
            Toast.error('请输入姓名');
            return;
        }
        
        const saveBtn = document.getElementById('saveContactBtn');
        FormUtil.setLoading(saveBtn, true, '保存中...');
        
        try {
            let result;
            if (this.editMode && this.editItem) {
                data.id = this.editItem.id;
                result = await ContactService.update(data);
            } else {
                result = await ContactService.add(data);
            }
            
            if (result.code === 0) {
                Toast.success(this.editMode ? '更新成功' : '添加成功');
                Layout.hideModal();
                await this.loadData();
                this.renderContent();
            } else {
                Toast.error(result.message || '保存失败');
            }
        } catch (e) {
            Toast.error('网络错误，请稍后重试');
        } finally {
            FormUtil.setLoading(saveBtn, false);
        }
    },
    
    confirmDelete(id, name) {
        Layout.showConfirm(
            '确认删除',
            `确定要删除 "${name}" 的联系方式吗？此操作不可恢复。`,
            async () => {
                await this.delete(id);
            }
        );
    },
    
    async delete(id) {
        try {
            const result = await ContactService.delete(id);
            if (result.code === 0) {
                Toast.success('删除成功');
                await this.loadData();
                this.renderContent();
            } else {
                Toast.error(result.message || '删除失败');
            }
        } catch (e) {
            Toast.error('网络错误');
        }
    }
};
