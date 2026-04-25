const PurchasePage = {
    data: { items: [], total: 0, page: 1, page_size: 10, total_pages: 1 },
    searchKeyword: '',
    filterVariety: '',
    filterSupplier: '',
    startDate: '',
    endDate: '',
    editMode: false,
    editItem: null,
    varieties: [],
    suppliers: [],
    
    async render() {
        Layout.render('', '进货管理');
        Layout.updateTitle('进货管理');
        
        await Promise.all([
            this.loadVarieties(),
            this.loadSuppliers()
        ]);
        await this.loadData();
        this.renderContent();
    },
    
    async loadVarieties() {
        try {
            const result = await VarietyService.getAll();
            if (result.code === 0) {
                this.varieties = result.data || [];
            }
        } catch (e) {
            console.error('Load varieties error:', e);
        }
    },
    
    async loadSuppliers() {
        try {
            const result = await ContactService.getAllSuppliers();
            if (result.code === 0) {
                this.suppliers = result.data || [];
            }
        } catch (e) {
            console.error('Load suppliers error:', e);
        }
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
            if (this.filterVariety) {
                params.variety_id = this.filterVariety;
            }
            if (this.filterSupplier) {
                params.supplier_id = this.filterSupplier;
            }
            if (this.startDate) {
                params.start_date = this.startDate;
            }
            if (this.endDate) {
                params.end_date = this.endDate;
            }
            
            const result = await PurchaseService.getList(params);
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
        
        const varietyOptions = this.varieties.map(v => 
            `<option value="${v.id}" ${this.filterVariety == v.id ? 'selected' : ''}>${v.name}</option>`
        ).join('');
        
        const supplierOptions = this.suppliers.map(s => 
            `<option value="${s.id}" ${this.filterSupplier == s.id ? 'selected' : ''}>${s.name}</option>`
        ).join('');
        
        const tableRows = items.length > 0 ? items.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${item.variety_name}</td>
                <td>${item.supplier_name || '-'}</td>
                <td>${Layout.formatPrice(item.unit_price)}</td>
                <td>${item.quantity}</td>
                <td class="price">${Layout.formatPrice(item.total_price)}</td>
                <td>${item.purchase_date}</td>
                <td>${item.remark || '-'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-secondary btn-sm" onclick="PurchasePage.edit(${item.id})">编辑</button>
                        <button class="btn btn-danger btn-sm" onclick="PurchasePage.confirmDelete(${item.id})">删除</button>
                    </div>
                </td>
            </tr>
        `).join('') : `
            <tr>
                <td colspan="9">
                    <div class="empty-state">
                        <div class="icon">📥</div>
                        <p>暂无进货记录</p>
                        <button class="btn btn-primary mt-2" onclick="PurchasePage.add()">
                            新增进货
                        </button>
                    </div>
                </td>
            </tr>
        `;
        
        const paginationHtml = Layout.renderPagination(this.data, 'PurchasePage.goToPage');
        
        const content = `
            <div class="page-header">
                <h1 class="page-title">进货管理</h1>
                <p class="page-subtitle">管理所有进货记录</p>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="toolbar">
                        <div class="toolbar-left">
                            <select class="form-control" style="width: auto;" onchange="PurchasePage.changeVariety(this)">
                                <option value="">全部品种</option>
                                ${varietyOptions}
                            </select>
                            <select class="form-control" style="width: auto;" onchange="PurchasePage.changeSupplier(this)">
                                <option value="">全部供应商</option>
                                ${supplierOptions}
                            </select>
                            <input type="date" class="form-control" style="width: auto;" value="${this.startDate}" 
                                placeholder="开始日期" onchange="PurchasePage.changeStartDate(this)">
                            <input type="date" class="form-control" style="width: auto;" value="${this.endDate}"
                                placeholder="结束日期" onchange="PurchasePage.changeEndDate(this)">
                        </div>
                        <div class="toolbar-right">
                            <div class="search-box">
                                <span class="search-icon">🔍</span>
                                <input type="text" class="form-control" placeholder="搜索品种/供应商..." 
                                    value="${this.searchKeyword}"
                                    onkeyup="PurchasePage.handleSearch(event)">
                            </div>
                            <button class="btn btn-primary" onclick="PurchasePage.add()">
                                ➕ 新增进货
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>品种</th>
                                <th>供应商</th>
                                <th>单价</th>
                                <th>数量</th>
                                <th>总价</th>
                                <th>进货日期</th>
                                <th>备注</th>
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
    
    changeVariety(select) {
        this.filterVariety = select.value;
        this.data.page = 1;
        this.loadData().then(() => this.renderContent());
    },
    
    changeSupplier(select) {
        this.filterSupplier = select.value;
        this.data.page = 1;
        this.loadData().then(() => this.renderContent());
    },
    
    changeStartDate(input) {
        this.startDate = input.value;
        this.data.page = 1;
        this.loadData().then(() => this.renderContent());
    },
    
    changeEndDate(input) {
        this.endDate = input.value;
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
            const result = await PurchaseService.getById(id);
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
        const title = this.editMode ? '编辑进货记录' : '新增进货记录';
        
        const varietyOptions = this.varieties.map(v => 
            `<option value="${v.id}" ${item.variety_id == v.id ? 'selected' : ''}>${v.name}</option>`
        ).join('');
        
        const supplierOptions = this.suppliers.map(s => 
            `<option value="${s.id}" ${item.supplier_id == s.id ? 'selected' : ''}>${s.name}</option>`
        ).join('');
        
        const content = `
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <form id="purchaseForm">
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">
                            品种 <span class="required">*</span>
                        </label>
                        <select name="variety_id" class="form-control" required>
                            <option value="">请选择品种</option>
                            ${varietyOptions}
                        </select>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">
                                单价 <span class="required">*</span>
                            </label>
                            <input type="number" name="unit_price" class="form-control" step="0.01" min="0"
                                value="${item.unit_price || ''}" placeholder="请输入单价" oninput="PurchasePage.calcTotal()">
                        </div>
                        <div class="form-group">
                            <label class="form-label">
                                数量 <span class="required">*</span>
                            </label>
                            <input type="number" name="quantity" class="form-control" min="1"
                                value="${item.quantity || ''}" placeholder="请输入数量" oninput="PurchasePage.calcTotal()">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">总价</label>
                        <div class="form-control" style="background: var(--bg-color);" id="totalPriceDisplay">
                            ${item.total_price ? Layout.formatPrice(item.total_price) : '-'}
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">供应商</label>
                            <select name="supplier_id" class="form-control">
                                <option value="">请选择供应商（可选）</option>
                                ${supplierOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">进货日期</label>
                            <input type="date" name="purchase_date" class="form-control"
                                value="${item.purchase_date || Layout.getTodayString()}">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">备注</label>
                        <textarea name="remark" class="form-control" 
                            placeholder="请输入备注信息">${item.remark || ''}</textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="Layout.hideModal()">取消</button>
                    <button type="submit" class="btn btn-primary" id="savePurchaseBtn">保存</button>
                </div>
            </form>
        `;
        
        Layout.showModal(content);
        
        const form = document.getElementById('purchaseForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveForm(form);
        });
    },
    
    calcTotal() {
        const form = document.getElementById('purchaseForm');
        if (!form) return;
        
        const unitPrice = parseFloat(form.querySelector('[name="unit_price"]').value) || 0;
        const quantity = parseInt(form.querySelector('[name="quantity"]').value) || 0;
        const total = unitPrice * quantity;
        
        const display = document.getElementById('totalPriceDisplay');
        if (display) {
            display.textContent = total > 0 ? Layout.formatPrice(total) : '-';
        }
    },
    
    async saveForm(form) {
        const data = FormUtil.getData(form);
        
        if (!data.variety_id) {
            Toast.error('请选择品种');
            return;
        }
        if (!data.unit_price || parseFloat(data.unit_price) < 0) {
            Toast.error('请输入有效的单价');
            return;
        }
        if (!data.quantity || parseInt(data.quantity) <= 0) {
            Toast.error('请输入有效的数量');
            return;
        }
        
        data.unit_price = parseFloat(data.unit_price);
        data.quantity = parseInt(data.quantity);
        if (data.supplier_id) {
            data.supplier_id = parseInt(data.supplier_id);
        } else {
            delete data.supplier_id;
        }
        
        const saveBtn = document.getElementById('savePurchaseBtn');
        FormUtil.setLoading(saveBtn, true, '保存中...');
        
        try {
            let result;
            if (this.editMode && this.editItem) {
                data.id = this.editItem.id;
                result = await PurchaseService.update(data);
            } else {
                result = await PurchaseService.add(data);
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
            Toast.error(e.message || '网络错误，请稍后重试');
        } finally {
            FormUtil.setLoading(saveBtn, false);
        }
    },
    
    confirmDelete(id) {
        Layout.showConfirm(
            '确认删除',
            '确定要删除这条进货记录吗？此操作不可恢复。',
            async () => {
                await this.delete(id);
            }
        );
    },
    
    async delete(id) {
        try {
            const result = await PurchaseService.delete(id);
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
