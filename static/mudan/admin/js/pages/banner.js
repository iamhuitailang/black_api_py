const BannerPage = {
    banners: [],
    config: {},
    
    render() {
        const content = `
            <div class="page-header">
                <h1 class="page-title">Banner管理</h1>
                <p class="page-subtitle">管理首页轮播Banner图片</p>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Banner列表</h3>
                    <div class="toolbar-right">
                        <button class="btn btn-primary" id="addBannerBtn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            添加Banner
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div id="bannerList">
                        <div class="empty-state">
                            <div class="icon">🖼️</div>
                            <p>暂无Banner数据，点击"添加Banner"创建</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card mt-2">
                <div class="card-header">
                    <h3 class="card-title">Banner配置</h3>
                </div>
                <div class="card-body">
                    <form id="bannerConfigForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">宽高比</label>
                                <select id="aspectRatio" class="form-control">
                                    <option value="16:9">16:9 (宽屏)</option>
                                    <option value="4:3">4:3 (标准)</option>
                                    <option value="1:1">1:1 (方形)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">自动播放</label>
                                <select id="autoPlay" class="form-control">
                                    <option value="true">开启</option>
                                    <option value="false">关闭</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">播放间隔(毫秒)</label>
                                <input type="number" id="interval" class="form-control" value="3000" min="1000" step="1000">
                            </div>
                        </div>
                        <div class="text-right">
                            <button type="submit" class="btn btn-primary">保存配置</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        Layout.render(content);
        this.bindEvents();
        this.loadData();
    },
    
    bindEvents() {
        document.getElementById('addBannerBtn').addEventListener('click', () => {
            this.showBannerModal();
        });
        
        document.getElementById('bannerConfigForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveConfig();
        });
    },
    
    async loadData() {
        try {
            const [bannersResult, configResult] = await Promise.all([
                BannerService.getList(),
                BannerService.getConfig()
            ]);
            
            if (bannersResult.code === 0) {
                this.banners = bannersResult.data?.items || [];
                this.renderBannerList();
            }
            
            if (configResult.code === 0) {
                this.config = configResult.data || {};
                this.renderConfigForm();
            }
        } catch (error) {
            Toast.error('加载数据失败');
            console.error(error);
        }
    },
    
    renderBannerList() {
        const container = document.getElementById('bannerList');
        
        if (this.banners.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">🖼️</div>
                    <p>暂无Banner数据，点击"添加Banner"创建</p>
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
                            <th style="width: 120px;">预览</th>
                            <th>图片链接</th>
                            <th style="width: 200px;">跳转链接</th>
                            <th style="width: 140px;">创建时间</th>
                            <th style="width: 140px;">操作</th>
                        </tr>
                    </thead>
                    <tbody id="bannerTableBody">
                        ${this.banners.map((banner, index) => `
                            <tr data-id="${banner.id}">
                                <td>
                                    <span class="sort-handle" draggable="true" data-index="${index}">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <circle cx="9" cy="5" r="1"></circle>
                                            <circle cx="15" cy="5" r="1"></circle>
                                            <circle cx="9" cy="12" r="1"></circle>
                                            <circle cx="15" cy="12" r="1"></circle>
                                            <circle cx="9" cy="19" r="1"></circle>
                                            <circle cx="15" cy="19" r="1"></circle>
                                        </svg>
                                    </span>
                                </td>
                                <td>
                                    ${banner.image_url ? `<img src="${banner.image_url}" class="image-preview" alt="Banner">` : '-'}
                                </td>
                                <td>
                                    <div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${banner.image_url || ''}">
                                        ${banner.image_url || '-'}
                                    </div>
                                </td>
                                <td>
                                    <div style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${banner.jump_url || ''}">
                                        ${banner.jump_url || '-'}
                                    </div>
                                </td>
                                <td>${banner.created_at || '-'}</td>
                                <td>
                                    <div class="table-actions">
                                        <button class="btn btn-sm btn-secondary" data-action="edit" data-id="${banner.id}">编辑</button>
                                        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${banner.id}">删除</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        this.bindTableEvents();
        this.initDragSort();
    },
    
    bindTableEvents() {
        document.querySelectorAll('#bannerTableBody button[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const banner = this.banners.find(b => b.id === id);
                if (banner) {
                    this.showBannerModal(banner);
                }
            });
        });
        
        document.querySelectorAll('#bannerTableBody button[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                this.confirmDelete(id);
            });
        });
    },
    
    initDragSort() {
        const tableBody = document.getElementById('bannerTableBody');
        if (!tableBody) return;
        
        let draggedRow = null;
        let draggedIndex = null;
        
        tableBody.querySelectorAll('.sort-handle').forEach(handle => {
            handle.addEventListener('dragstart', (e) => {
                draggedRow = e.target.closest('tr');
                draggedIndex = parseInt(handle.dataset.index);
                draggedRow.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            
            handle.addEventListener('dragend', () => {
                if (draggedRow) {
                    draggedRow.classList.remove('dragging');
                }
                tableBody.querySelectorAll('tr').forEach(row => {
                    row.classList.remove('drag-over');
                });
            });
        });
        
        tableBody.querySelectorAll('tr').forEach(row => {
            row.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                row.classList.add('drag-over');
            });
            
            row.addEventListener('dragleave', () => {
                row.classList.remove('drag-over');
            });
            
            row.addEventListener('drop', async (e) => {
                e.preventDefault();
                row.classList.remove('drag-over');
                
                if (!draggedRow || draggedRow === row) return;
                
                const targetIndex = Array.from(tableBody.children).indexOf(row);
                
                if (draggedIndex !== targetIndex) {
                    const item = this.banners.splice(draggedIndex, 1)[0];
                    this.banners.splice(targetIndex, 0, item);
                    
                    this.banners.forEach((banner, index) => {
                        banner.sort_order = index;
                    });
                    
                    try {
                        await BannerService.setAll(this.banners);
                        Toast.success('排序已更新');
                        this.renderBannerList();
                    } catch (error) {
                        Toast.error('更新排序失败');
                    }
                }
            });
        });
    },
    
    renderConfigForm() {
        const aspectRatio = document.getElementById('aspectRatio');
        const autoPlay = document.getElementById('autoPlay');
        const interval = document.getElementById('interval');
        
        if (this.config.aspect_ratio) {
            aspectRatio.value = this.config.aspect_ratio;
        }
        if (this.config.auto_play !== undefined) {
            autoPlay.value = this.config.auto_play ? 'true' : 'false';
        }
        if (this.config.interval) {
            interval.value = this.config.interval;
        }
    },
    
    showBannerModal(banner = null) {
        const isEdit = banner !== null;
        const title = isEdit ? '编辑Banner' : '添加Banner';
        
        const modalHtml = `
            <div class="modal-overlay show" id="bannerModal">
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close" data-close="bannerModal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="bannerForm">
                            <div class="form-group">
                                <label class="form-label">
                                    图片链接<span class="required">*</span>
                                </label>
                                <input type="text" id="bannerImageUrl" class="form-control" placeholder="请输入图片URL" value="${banner?.image_url || ''}">
                                <div class="form-error" id="bannerImageUrlError"></div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">图片预览</label>
                                <div id="imagePreviewArea" style="display: ${banner?.image_url ? 'block' : 'none'}; margin-top: 8px;">
                                    <img id="previewImage" src="${banner?.image_url || ''}" style="max-height: 150px; max-width: 100%; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">跳转链接</label>
                                <input type="text" id="bannerJumpUrl" class="form-control" placeholder="请输入跳转URL（可选）" value="${banner?.jump_url || ''}">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-close="bannerModal">取消</button>
                        <button class="btn btn-primary" id="submitBanner">${isEdit ? '保存' : '添加'}</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.bindModalEvents('bannerModal');
        
        const imageUrlInput = document.getElementById('bannerImageUrl');
        const previewArea = document.getElementById('imagePreviewArea');
        const previewImage = document.getElementById('previewImage');
        
        imageUrlInput.addEventListener('input', () => {
            const url = imageUrlInput.value.trim();
            if (url) {
                previewArea.style.display = 'block';
                previewImage.src = url;
                previewImage.onerror = () => {
                    previewArea.style.display = 'none';
                };
            } else {
                previewArea.style.display = 'none';
            }
        });
        
        const submitBtn = document.getElementById('submitBanner');
        submitBtn.addEventListener('click', async () => {
            await this.handleBannerSubmit(isEdit ? banner.id : null);
        });
    },
    
    async handleBannerSubmit(id) {
        const imageUrl = document.getElementById('bannerImageUrl').value.trim();
        const jumpUrl = document.getElementById('bannerJumpUrl').value.trim();
        
        const imageUrlError = document.getElementById('bannerImageUrlError');
        const imageUrlInput = document.getElementById('bannerImageUrl');
        
        if (!imageUrl) {
            imageUrlError.textContent = '请输入图片链接';
            imageUrlInput.style.borderColor = 'var(--danger-color)';
            return;
        }
        
        imageUrlError.textContent = '';
        imageUrlInput.style.borderColor = '';
        
        try {
            let result;
            if (id) {
                result = await BannerService.update(id, imageUrl, jumpUrl);
            } else {
                result = await BannerService.add(imageUrl, jumpUrl);
            }
            
            if (result.code === 0) {
                Toast.success(id ? '编辑成功' : '添加成功');
                this.closeModal('bannerModal');
                this.loadData();
            } else {
                Toast.error(result.message || '操作失败');
            }
        } catch (error) {
            Toast.error('网络错误');
        }
    },
    
    async saveConfig() {
        const aspectRatio = document.getElementById('aspectRatio').value;
        const autoPlay = document.getElementById('autoPlay').value === 'true';
        const interval = parseInt(document.getElementById('interval').value) || 3000;
        
        try {
            const result = await BannerService.setConfig({
                aspect_ratio: aspectRatio,
                auto_play: autoPlay,
                interval: interval
            });
            
            if (result.code === 0) {
                Toast.success('配置保存成功');
                this.config = result.data;
            } else {
                Toast.error(result.message || '保存失败');
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
                        <p>确定要删除这个Banner吗？此操作不可恢复。</p>
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
            await this.deleteBanner(id);
        });
    },
    
    async deleteBanner(id) {
        try {
            const result = await BannerService.delete(id);
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
