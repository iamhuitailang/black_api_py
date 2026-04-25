const LogPage = {
    data: { items: [], total: 0, page: 1, page_size: 10, total_pages: 1 },
    searchKeyword: '',
    filterType: '',
    filterModule: '',
    startDate: '',
    endDate: '',
    
    async render() {
        Layout.render('', '操作日志');
        Layout.updateTitle('操作日志');
        
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
                params.operation_type = this.filterType;
            }
            if (this.filterModule) {
                params.module = this.filterModule;
            }
            if (this.startDate) {
                params.start_date = this.startDate;
            }
            if (this.endDate) {
                params.end_date = this.endDate;
            }
            
            const result = await LogService.getList(params);
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
            const badges = {
                purchase: '<span class="badge badge-info">进货</span>',
                sale: '<span class="badge badge-success">销售</span>',
                create: '<span class="badge badge-success">创建</span>',
                update: '<span class="badge badge-warning">更新</span>',
                delete: '<span class="badge badge-danger">删除</span>'
            };
            return badges[type] || `<span class="badge badge-secondary">${type}</span>`;
        };
        
        const moduleText = (module) => {
            const modules = {
                contact: '联系方式',
                variety: '品种管理',
                purchase: '进货管理',
                sale: '销售管理',
                inventory: '库存管理'
            };
            return modules[module] || module;
        };
        
        const tableRows = items.length > 0 ? items.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${typeBadge(item.operation_type)}</td>
                <td>${moduleText(item.module)}</td>
                <td>${item.title || '-'}</td>
                <td>${item.detail ? item.detail.substring(0, 50) + (item.detail.length > 50 ? '...' : '') : '-'}</td>
                <td>${Layout.formatDateTime(item.created_at)}</td>
            </tr>
        `).join('') : `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="icon">📋</div>
                        <p>暂无操作日志</p>
                    </div>
                </td>
            </tr>
        `;
        
        const paginationHtml = Layout.renderPagination(this.data, 'LogPage.goToPage');
        
        const content = `
            <div class="page-header">
                <h1 class="page-title">操作日志</h1>
                <p class="page-subtitle">查看系统所有操作记录</p>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="toolbar">
                        <div class="toolbar-left">
                            <select class="form-control" style="width: auto;" onchange="LogPage.changeType(this)">
                                <option value="">全部类型</option>
                                <option value="purchase" ${this.filterType === 'purchase' ? 'selected' : ''}>进货</option>
                                <option value="sale" ${this.filterType === 'sale' ? 'selected' : ''}>销售</option>
                                <option value="create" ${this.filterType === 'create' ? 'selected' : ''}>创建</option>
                                <option value="update" ${this.filterType === 'update' ? 'selected' : ''}>更新</option>
                                <option value="delete" ${this.filterType === 'delete' ? 'selected' : ''}>删除</option>
                            </select>
                            <select class="form-control" style="width: auto;" onchange="LogPage.changeModule(this)">
                                <option value="">全部模块</option>
                                <option value="contact" ${this.filterModule === 'contact' ? 'selected' : ''}>联系方式</option>
                                <option value="variety" ${this.filterModule === 'variety' ? 'selected' : ''}>品种管理</option>
                                <option value="purchase" ${this.filterModule === 'purchase' ? 'selected' : ''}>进货管理</option>
                                <option value="sale" ${this.filterModule === 'sale' ? 'selected' : ''}>销售管理</option>
                                <option value="inventory" ${this.filterModule === 'inventory' ? 'selected' : ''}>库存管理</option>
                            </select>
                            <input type="date" class="form-control" style="width: auto;" value="${this.startDate}" 
                                placeholder="开始日期" onchange="LogPage.changeStartDate(this)">
                            <input type="date" class="form-control" style="width: auto;" value="${this.endDate}"
                                placeholder="结束日期" onchange="LogPage.changeEndDate(this)">
                        </div>
                        <div class="toolbar-right">
                            <div class="search-box">
                                <span class="search-icon">🔍</span>
                                <input type="text" class="form-control" placeholder="搜索标题/详情..." 
                                    value="${this.searchKeyword}"
                                    onkeyup="LogPage.handleSearch(event)">
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>操作类型</th>
                                <th>模块</th>
                                <th>标题</th>
                                <th>详情</th>
                                <th>操作时间</th>
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
    
    changeModule(select) {
        this.filterModule = select.value;
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
    }
};
