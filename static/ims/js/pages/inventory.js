const InventoryPage = {
    data: { items: [], total: 0, page: 1, page_size: 10, total_pages: 1 },
    searchKeyword: '',
    showWarning: false,
    editItem: null,
    
    async render() {
        Layout.render('', '库存管理');
        Layout.updateTitle('库存管理');
        
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
            if (this.showWarning) {
                params.show_warning = true;
            }
            
            const result = await InventoryService.getList(params);
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
        
        const warningBadge = (item) => {
            if (item.is_warning) {
                return '<span class="badge badge-danger">预警</span>';
            }
            return '<span class="badge badge-success">正常</span>';
        };
        
        const tableRows = items.length > 0 ? items.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${item.variety_name}</td>
                <td><strong>${item.current_quantity}</strong></td>
                <td>${item.purchase_location || '-'}</td>
                <td>${Layout.formatPrice(item.avg_cost_price)}</td>
                <td class="price">${Layout.formatPrice(item.total_cost)}</td>
                <td>${item.warning_threshold}</td>
                <td>${warningBadge(item)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-secondary btn-sm" onclick="InventoryPage.edit(${item.id})">调整</button>
                    </div>
                </td>
            </tr>
        `).join('') : `
            <tr>
                <td colspan="9">
                    <div class="empty-state">
                        <div class="icon">📦</div>
                        <p>暂无库存数据</p>
                        <p class="mt-1">进货后库存数据会自动更新</p>
                    </div>
                </td>
            </tr>
        `;
        
        const paginationHtml = Layout.renderPagination(this.data, 'InventoryPage.goToPage');
        
        const content = `
            <div class="page-header">
                <h1 class="page-title">库存管理</h1>
                <p class="page-subtitle">管理库存信息和预警设置</p>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="toolbar">
                        <div class="toolbar-left">
                            <label class="filter-group" style="cursor: pointer;">
                                <input type="checkbox" id="showWarningCheck" ${this.showWarning ? 'checked' : ''} 
                                    onchange="InventoryPage.toggleWarning(this)">
                                <span>只显示预警</span>
                            </label>
                        </div>
                        <div class="toolbar-right">
                            <div class="search-box">
                                <span class="search-icon">🔍</span>
                                <input type="text" class="form-control" placeholder="搜索品种名称..." 
                                    value="${this.searchKeyword}"
                                    onkeyup="InventoryPage.handleSearch(event)">
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>品种名称</th>
                                <th>当前数量</th>
                                <th>进货地</th>
                                <th>成本均价</th>
                                <th>总库存成本</th>
                                <th>预警阈值</th>
                                <th>状态</th>
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
    
    toggleWarning(checkbox) {
        this.showWarning = checkbox.checked;
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
    
    async edit(id) {
        try {
            const result = await InventoryService.getById(id);
            if (result.code === 0) {
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
        
        const content = `
            <div class="modal-header">
                <h3 class="modal-title">调整库存 - ${item.variety_name}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <form id="inventoryForm">
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">当前数量</label>
                            <input type="number" name="current_quantity" class="form-control" min="0"
                                value="${item.current_quantity || 0}" placeholder="请输入当前数量">
                        </div>
                        <div class="form-group">
                            <label class="form-label">预警阈值</label>
                            <input type="number" name="warning_threshold" class="form-control" min="0"
                                value="${item.warning_threshold || 10}" placeholder="请输入预警阈值">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">进货地</label>
                        <input type="text" name="purchase_location" class="form-control"
                            value="${item.purchase_location || ''}" placeholder="请输入进货地">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">成本均价</label>
                            <input type="number" name="avg_cost_price" class="form-control" step="0.01" min="0"
                                value="${item.avg_cost_price || 0}" placeholder="请输入成本均价">
                        </div>
                        <div class="form-group">
                            <label class="form-label">总库存成本</label>
                            <input type="number" name="total_cost" class="form-control" step="0.01" min="0"
                                value="${item.total_cost || 0}" placeholder="请输入总库存成本">
                        </div>
                    </div>
                    
                    <div style="background: var(--bg-color); padding: 12px; border-radius: var(--radius-sm);">
                        <p style="font-size: 13px; color: var(--text-secondary);">
                            ⚠️ 提示：库存数量通常通过进货/销售自动更新，手动调整请谨慎操作。
                        </p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="Layout.hideModal()">取消</button>
                    <button type="submit" class="btn btn-primary" id="saveInventoryBtn">保存</button>
                </div>
            </form>
        `;
        
        Layout.showModal(content);
        
        const form = document.getElementById('inventoryForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveForm(form);
        });
    },
    
    async saveForm(form) {
        const data = FormUtil.getData(form);
        
        data.id = this.editItem.id;
        if (data.current_quantity !== undefined) {
            data.current_quantity = parseInt(data.current_quantity);
        }
        if (data.warning_threshold !== undefined) {
            data.warning_threshold = parseInt(data.warning_threshold);
        }
        if (data.avg_cost_price !== undefined) {
            data.avg_cost_price = parseFloat(data.avg_cost_price);
        }
        if (data.total_cost !== undefined) {
            data.total_cost = parseFloat(data.total_cost);
        }
        
        const saveBtn = document.getElementById('saveInventoryBtn');
        FormUtil.setLoading(saveBtn, true, '保存中...');
        
        try {
            const result = await InventoryService.update(data);
            
            if (result.code === 0) {
                Toast.success('更新成功');
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
    }
};
