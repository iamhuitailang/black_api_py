const ProductPage = {
    products: [],
    
    render() {
        const content = `
            <div class="page-header">
                <h1 class="page-title">商品信息管理</h1>
                <p class="page-subtitle">管理牡丹特色产品信息</p>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">商品列表</h3>
                    <div class="toolbar-right">
                        <button class="btn btn-primary" id="addProductBtn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            添加商品
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div id="productList">
                        <div class="empty-state">
                            <div class="icon">📦</div>
                            <p>暂无商品数据</p>
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
        document.getElementById('addProductBtn').addEventListener('click', () => {
            this.showProductModal();
        });
    },
    
    async loadData() {
        try {
            const result = await ProductService.getList();
            if (result.code === 0) {
                this.products = result.data || [];
                this.renderProductList();
            }
        } catch (error) {
            Toast.error('加载数据失败');
            console.error(error);
        }
    },
    
    renderProductList() {
        const container = document.getElementById('productList');
        
        if (this.products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📦</div>
                    <p>暂无商品数据</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th style="width: 80px;">排序</th>
                            <th style="width: 100px;">图片</th>
                            <th>商品名称</th>
                            <th style="width: 120px;">价格</th>
                            <th style="width: 100px;">库存</th>
                            <th style="width: 180px;">创建时间</th>
                            <th style="width: 180px;">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.products.map(product => `
                            <tr>
                                <td>${product.sort_order ?? '-'}</td>
                                <td>
                                    ${product.image_url ? `<img src="${product.image_url}" class="image-preview" alt="${product.name}">` : '-'}
                                </td>
                                <td>
                                    <div>
                                        <strong>${product.name}</strong>
                                        ${product.description ? `<div style="color: var(--text-secondary); font-size: 12px; margin-top: 2px;">${product.description}</div>` : ''}
                                    </div>
                                </td>
                                <td><span class="price">${product.price?.toFixed(2) || '0.00'}</span></td>
                                <td>${product.quantity ?? 0}</td>
                                <td>${product.created_at || '-'}</td>
                                <td>
                                    <div class="table-actions">
                                        <button class="btn btn-sm btn-secondary" data-action="edit" data-id="${product.id}">编辑</button>
                                        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${product.id}">删除</button>
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
                const id = parseInt(btn.dataset.id);
                const product = this.products.find(p => p.id === id);
                if (product) {
                    this.showProductModal(product);
                }
            });
        });
        
        document.querySelectorAll('button[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                this.confirmDelete(id);
            });
        });
    },
    
    showProductModal(product = null) {
        const isEdit = product !== null;
        const title = isEdit ? '编辑商品' : '添加商品';
        
        const modalHtml = `
            <div class="modal-overlay show" id="productModal">
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close" data-close="productModal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="productForm">
                            <div class="form-group">
                                <label class="form-label">
                                    商品名称<span class="required">*</span>
                                </label>
                                <input type="text" id="productName" class="form-control" placeholder="请输入商品名称" value="${product?.name || ''}">
                                <div class="form-error" id="productNameError"></div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">价格</label>
                                    <input type="number" id="productPrice" class="form-control" placeholder="请输入价格" step="0.01" min="0" value="${product?.price ?? 0}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">库存数量</label>
                                    <input type="number" id="productQuantity" class="form-control" placeholder="请输入库存" min="0" value="${product?.quantity ?? 0}">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">图片链接</label>
                                <input type="text" id="productImageUrl" class="form-control" placeholder="请输入商品图片URL" value="${product?.image_url || ''}">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">商品描述</label>
                                <textarea id="productDescription" class="form-control" rows="3" placeholder="请输入商品描述">${product?.description || ''}</textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-close="productModal">取消</button>
                        <button class="btn btn-primary" id="submitProduct">${isEdit ? '保存' : '添加'}</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.bindModalEvents('productModal');
        
        const submitBtn = document.getElementById('submitProduct');
        submitBtn.addEventListener('click', async () => {
            await this.handleProductSubmit(isEdit ? product.id : null);
        });
    },
    
    async handleProductSubmit(id) {
        const name = document.getElementById('productName').value.trim();
        const price = parseFloat(document.getElementById('productPrice').value) || 0;
        const quantity = parseInt(document.getElementById('productQuantity').value) || 0;
        const imageUrl = document.getElementById('productImageUrl').value.trim();
        const description = document.getElementById('productDescription').value.trim();
        
        const nameError = document.getElementById('productNameError');
        const nameInput = document.getElementById('productName');
        
        if (!name) {
            nameError.textContent = '请输入商品名称';
            nameInput.style.borderColor = 'var(--danger-color)';
            return;
        }
        
        nameError.textContent = '';
        nameInput.style.borderColor = '';
        
        const data = {
            name,
            price,
            quantity,
            image_url: imageUrl,
            description
        };
        
        try {
            let result;
            if (id) {
                result = await ProductService.update(id, data);
            } else {
                result = await ProductService.add(data);
            }
            
            if (result.code === 0) {
                Toast.success(id ? '编辑成功' : '添加成功');
                this.closeModal('productModal');
                this.loadData();
            } else {
                Toast.error(result.message || '操作失败');
            }
        } catch (error) {
            Toast.error('网络错误');
        }
    },
    
    confirmDelete(id) {
        const modalHtml = `
            <div class="modal-overlay show" id="confirmModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">确认删除</h3>
                        <button class="modal-close" data-close="confirmModal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>确定要删除这个商品吗？此操作不可恢复。</p>
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
            await this.deleteProduct(id);
        });
    },
    
    async deleteProduct(id) {
        try {
            const result = await ProductService.delete(id);
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
