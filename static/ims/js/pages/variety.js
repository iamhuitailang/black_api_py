const VarietyPage = {
    data: { items: [], total: 0, page: 1, page_size: 10, total_pages: 1 },
    searchKeyword: '',
    editMode: false,
    editItem: null,
    
    async render() {
        Layout.render('', '品种管理');
        Layout.updateTitle('牡丹品种管理');
        
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
            
            const result = await VarietyService.getList(params);
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
        
        const tableRows = items.length > 0 ? items.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>
                    ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" class="variety-image" onerror="this.style.display='none'">` : '<span class="badge badge-info">无图</span>'}
                </td>
                <td>${item.name}</td>
                <td>${item.flowering_period || '-'}</td>
                <td>${item.care_instructions ? item.care_instructions.substring(0, 30) + (item.care_instructions.length > 30 ? '...' : '') : '-'}</td>
                <td>${Layout.formatDate(item.created_at)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-secondary btn-sm" onclick="VarietyPage.edit(${item.id})">编辑</button>
                        <button class="btn btn-danger btn-sm" onclick="VarietyPage.confirmDelete(${item.id}, '${item.name}')">删除</button>
                    </div>
                </td>
            </tr>
        `).join('') : `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div class="icon">🌸</div>
                        <p>暂无品种数据</p>
                        <button class="btn btn-primary mt-2" onclick="VarietyPage.add()">
                            新增品种
                        </button>
                    </div>
                </td>
            </tr>
        `;
        
        const paginationHtml = Layout.renderPagination(this.data, 'VarietyPage.goToPage');
        
        const content = `
            <div class="page-header">
                <h1 class="page-title">牡丹品种管理</h1>
                <p class="page-subtitle">管理所有牡丹品种信息</p>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="toolbar">
                        <div class="toolbar-left">
                            <div class="search-box">
                                <span class="search-icon">🔍</span>
                                <input type="text" class="form-control" placeholder="搜索品种名称..." 
                                    value="${this.searchKeyword}"
                                    onkeyup="VarietyPage.handleSearch(event)">
                            </div>
                        </div>
                        <div class="toolbar-right">
                            <button class="btn btn-primary" onclick="VarietyPage.add()">
                                ➕ 新增品种
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>图片</th>
                                <th>品种名称</th>
                                <th>花期</th>
                                <th>养护说明</th>
                                <th>创建时间</th>
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
            const result = await VarietyService.getById(id);
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
        const title = this.editMode ? '编辑品种' : '新增品种';
        
        const content = `
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <form id="varietyForm">
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">
                            品种名称 <span class="required">*</span>
                        </label>
                        <input type="text" name="name" class="form-control" 
                            value="${item.name || ''}" placeholder="请输入品种名称">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">图片URL</label>
                        <input type="url" name="image_url" class="form-control" 
                            value="${item.image_url || ''}" placeholder="请输入图片URL（可选）"
                            onchange="VarietyPage.previewImage(this)">
                        ${item.image_url ? `<img src="${item.image_url}" class="image-preview" id="imagePreview">` : '<img src="" class="image-preview hidden" id="imagePreview">'}
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">花期</label>
                        <input type="text" name="flowering_period" class="form-control" 
                            value="${item.flowering_period || ''}" placeholder="如：4月-5月">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">养护说明</label>
                        <textarea name="care_instructions" class="form-control" 
                            placeholder="请输入养护说明">${item.care_instructions || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">图文介绍</label>
                        <textarea name="description" class="form-control" 
                            placeholder="请输入详细介绍">${item.description || ''}</textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="Layout.hideModal()">取消</button>
                    <button type="submit" class="btn btn-primary" id="saveVarietyBtn">保存</button>
                </div>
            </form>
        `;
        
        Layout.showModal(content);
        
        const form = document.getElementById('varietyForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveForm(form);
        });
    },
    
    previewImage(input) {
        const preview = document.getElementById('imagePreview');
        if (input.value) {
            preview.src = input.value;
            preview.classList.remove('hidden');
            preview.onerror = () => {
                preview.classList.add('hidden');
            };
        } else {
            preview.classList.add('hidden');
        }
    },
    
    async saveForm(form) {
        const data = FormUtil.getData(form);
        
        if (!data.name || !data.name.trim()) {
            Toast.error('请输入品种名称');
            return;
        }
        
        const saveBtn = document.getElementById('saveVarietyBtn');
        FormUtil.setLoading(saveBtn, true, '保存中...');
        
        try {
            let result;
            if (this.editMode && this.editItem) {
                data.id = this.editItem.id;
                result = await VarietyService.update(data);
            } else {
                result = await VarietyService.add(data);
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
            `确定要删除品种 "${name}" 吗？此操作不可恢复。`,
            async () => {
                await this.delete(id);
            }
        );
    },
    
    async delete(id) {
        try {
            const result = await VarietyService.delete(id);
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
