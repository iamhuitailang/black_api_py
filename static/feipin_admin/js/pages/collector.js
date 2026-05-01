const CollectorsPage = {
    currentPage: 1,
    pageSize: 10,
    status: 1,

    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="admin-layout">
                ${this.renderSidebar()}
                <div class="main-wrapper">
                    ${this.renderHeader('回收员审核')}
                    <div class="main-content">
                        <div class="page-header">
                            <h1 class="page-title">回收员审核</h1>
                            <p class="page-subtitle">审核申请成为回收员的用户</p>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">
                                <h2 class="card-title">审核列表</h2>
                            </div>
                            <div class="card-body">
                                <div class="toolbar">
                                    <div class="toolbar-left">
                                        <div class="flex gap-2">
                                            <button class="btn ${this.status === 1 ? 'btn-primary' : 'btn-secondary'}" id="btnPending">待审核</button>
                                            <button class="btn ${this.status === 0 ? 'btn-primary' : 'btn-secondary'}" id="btnApproved">已通过</button>
                                            <button class="btn ${this.status === 2 ? 'btn-primary' : 'btn-secondary'}" id="btnRejected">已拒绝</button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="table-container">
                                    <table class="table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>用户信息</th>
                                                <th>手机号</th>
                                                <th>身份证号</th>
                                                <th>审核状态</th>
                                                <th>申请时间</th>
                                                <th>操作</th>
                                            </tr>
                                        </thead>
                                        <tbody id="collectorsTableBody">
                                            <tr>
                                                <td colspan="7" class="text-center">加载中...</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div class="pagination" id="pagination">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-overlay" id="verifyModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">审核回收员</h3>
                        <button class="modal-close" id="closeVerifyModal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">用户信息</label>
                            <div id="verifyUserInfo" class="p-4 bg-gray-50 rounded-lg"></div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">审核备注</label>
                            <textarea class="form-control" id="verifyNote" placeholder="请输入审核备注（可选）" rows="3"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="cancelVerify">取消</button>
                        <button class="btn btn-danger" id="rejectBtn">拒绝</button>
                        <button class="btn btn-primary" id="approveBtn">通过</button>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        this.loadCollectors();
    },

    renderSidebar() {
        const user = AuthService.getCurrentUser();
        const userInitial = user && user.real_name ? user.real_name.charAt(0) : (user && user.username ? user.username.charAt(0) : 'A');
        
        return `
            <div class="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo">
                        <div class="sidebar-logo-icon">♻️</div>
                        <div class="sidebar-logo-text">
                            <span class="sidebar-title">回收宝</span>
                            <span class="sidebar-subtitle">废品回收平台</span>
                        </div>
                    </div>
                </div>
                <div class="sidebar-nav">
                    <div class="sidebar-nav-title">工作台</div>
                    <div class="nav-item" data-page="dashboard">
                        <span class="nav-icon">📊</span>
                        <span class="nav-text">数据看板</span>
                    </div>
                    <div class="sidebar-nav-title">订单管理</div>
                    <div class="nav-item" data-page="orders">
                        <span class="nav-icon">📋</span>
                        <span class="nav-text">订单列表</span>
                    </div>
                    <div class="sidebar-nav-title">用户管理</div>
                    <div class="nav-item" data-page="users">
                        <span class="nav-icon">👥</span>
                        <span class="nav-text">用户管理</span>
                    </div>
                    <div class="nav-item active" data-page="collectors">
                        <span class="nav-icon">🚚</span>
                        <span class="nav-text">回收员审核</span>
                    </div>
                    <div class="sidebar-nav-title">系统管理</div>
                    <div class="nav-item" data-page="categories">
                        <span class="nav-icon">🏷️</span>
                        <span class="nav-text">分类管理</span>
                    </div>
                </div>
                <div class="sidebar-footer">
                    <div class="sidebar-user">
                        <div class="sidebar-user-avatar">${userInitial}</div>
                        <div class="sidebar-user-info">
                            <div class="sidebar-user-name">${user && user.real_name ? user.real_name : (user && user.username ? user.username : '管理员')}</div>
                            <div class="sidebar-user-role">系统管理员</div>
                        </div>
                    </div>
                    <div class="sidebar-logout" id="logoutBtn">
                        <span>🚪</span>
                        <span>退出登录</span>
                    </div>
                </div>
            </div>
        `;
    },

    renderHeader(title) {
        return `
            <div class="header">
                <div class="header-left">
                    <h1 class="header-title">${title}</h1>
                </div>
                <div class="header-right">
                    <div class="user-info" id="userDropdown">
                        <div class="user-avatar">A</div>
                        <div>
                            <div class="user-name">管理员</div>
                            <div class="user-role">系统管理</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page) {
                    Router.navigate(page);
                }
            });
        });

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await AuthService.logout();
                Toast.success('已退出登录');
                Router.navigate('login');
            });
        }

        const btnPending = document.getElementById('btnPending');
        const btnApproved = document.getElementById('btnApproved');
        const btnRejected = document.getElementById('btnRejected');

        if (btnPending) {
            btnPending.addEventListener('click', () => {
                this.status = 1;
                this.currentPage = 1;
                this.render();
            });
        }
        if (btnApproved) {
            btnApproved.addEventListener('click', () => {
                this.status = 0;
                this.currentPage = 1;
                this.render();
            });
        }
        if (btnRejected) {
            btnRejected.addEventListener('click', () => {
                this.status = 2;
                this.currentPage = 1;
                this.render();
            });
        }

        const closeVerifyModal = document.getElementById('closeVerifyModal');
        const cancelVerify = document.getElementById('cancelVerify');
        if (closeVerifyModal) {
            closeVerifyModal.addEventListener('click', () => this.hideVerifyModal());
        }
        if (cancelVerify) {
            cancelVerify.addEventListener('click', () => this.hideVerifyModal());
        }
    },

    async loadCollectors() {
        const tbody = document.getElementById('collectorsTableBody');
        if (!tbody) return;

        try {
            const params = {
                page: this.currentPage,
                page_size: this.pageSize,
                role: 'collector'
            };
            if (this.status !== null && this.status !== undefined) {
                params.status = this.status;
            }

            const result = await ApiService.get('/feipin/user/list/get', params);
            
            if (result.code === 0 && result.data) {
                const data = result.data;
                this.renderTable(data.items);
                this.renderPagination(data);
            } else {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center">${result.msg || '加载失败'}</td></tr>`;
            }
        } catch (error) {
            console.error('加载回收员列表失败:', error);
            tbody.innerHTML = `<tr><td colspan="7" class="text-center">加载失败，请重试</td></tr>`;
        }
    },

    renderTable(collectors) {
        const tbody = document.getElementById('collectorsTableBody');
        if (!tbody) return;

        if (!collectors || collectors.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <div class="empty-state-icon">🚚</div>
                            <div class="empty-state-title">暂无回收员申请</div>
                            <div class="empty-state-text">用户申请成为回收员后将显示在这里</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = collectors.map(collector => `
            <tr>
                <td>${collector.id}</td>
                <td>
                    <div class="flex items-center gap-2">
                        <div class="avatar-md">${collector.nickname ? collector.nickname.charAt(0) : '用'}</div>
                        <div>
                            <div class="font-semibold">${collector.nickname || '用户' + collector.id}</div>
                        </div>
                    </div>
                </td>
                <td>${collector.phone}</td>
                <td>${collector.id_card || '-'}</td>
                <td>
                    <span class="badge ${collector.status === 0 ? 'badge-success' : collector.status === 1 ? 'badge-warning' : 'badge-danger'}">
                        ${collector.status_text || '未知'}
                    </span>
                </td>
                <td>${collector.created_at ? new Date(collector.created_at).toLocaleDateString() : '-'}</td>
                <td>
                    <div class="table-actions">
                        ${collector.status === 1 ? `
                            <button class="btn btn-sm btn-primary" onclick="CollectorsPage.showVerifyModal(${collector.id})">审核</button>
                        ` : `
                            <span class="text-gray-500">已处理</span>
                        `}
                    </div>
                </td>
            </tr>
        `).join('');
    },

    renderPagination(data) {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        const totalPages = data.total_pages || 1;
        const currentPage = data.page || 1;

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = `<span class="pagination-info">共 ${data.total} 条，第 ${currentPage}/${totalPages} 页</span>`;
        
        html += `<button class="pagination-btn" onclick="CollectorsPage.goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;
        
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        if (startPage > 1) {
            html += `<button class="pagination-btn" onclick="CollectorsPage.goToPage(1)">1</button>`;
            if (startPage > 2) {
                html += `<span class="pagination-info">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="CollectorsPage.goToPage(${i})">${i}</button>`;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<span class="pagination-info">...</span>`;
            }
            html += `<button class="pagination-btn" onclick="CollectorsPage.goToPage(${totalPages})">${totalPages}</button>`;
        }
        
        html += `<button class="pagination-btn" onclick="CollectorsPage.goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;
        
        pagination.innerHTML = html;
    },

    goToPage(page) {
        this.currentPage = page;
        this.loadCollectors();
    },

    currentVerifyId: null,
    currentVerifyData: null,

    async showVerifyModal(userId) {
        this.currentVerifyId = userId;
        
        try {
            const result = await ApiService.get('/feipin/user/detail/get', { user_id: userId });
            if (result.code === 0 && result.data) {
                this.currentVerifyData = result.data;
                const userInfoDiv = document.getElementById('verifyUserInfo');
                if (userInfoDiv) {
                    userInfoDiv.innerHTML = `
                        <div class="flex items-center gap-3 mb-3">
                            <div class="avatar-md">${result.data.nickname ? result.data.nickname.charAt(0) : '用'}</div>
                            <div>
                                <div class="font-semibold">${result.data.nickname || '用户' + result.data.id}</div>
                                <div class="text-sm text-gray-500">${result.data.phone}</div>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-2 text-sm">
                            <div><strong>身份证号：</strong>${result.data.id_card || '-'}</div>
                            <div><strong>当前状态：</strong>${result.data.status_text || '未知'}</div>
                        </div>
                        ${result.data.verify_note ? `<div class="mt-2 text-sm"><strong>审核备注：</strong>${result.data.verify_note}</div>` : ''}
                    `;
                }
            }
        } catch (error) {
            console.error('获取用户信息失败:', error);
        }

        const modal = document.getElementById('verifyModal');
        if (modal) {
            modal.classList.add('show');
        }

        const approveBtn = document.getElementById('approveBtn');
        const rejectBtn = document.getElementById('rejectBtn');

        if (approveBtn) {
            approveBtn.onclick = () => this.approveCollector();
        }
        if (rejectBtn) {
            rejectBtn.onclick = () => this.rejectCollector();
        }
    },

    hideVerifyModal() {
        const modal = document.getElementById('verifyModal');
        if (modal) {
            modal.classList.remove('show');
        }
        this.currentVerifyId = null;
        this.currentVerifyData = null;
    },

    async approveCollector() {
        if (!this.currentVerifyId) return;

        const note = document.getElementById('verifyNote')?.value || '';
        
        try {
            const result = await ApiService.post('/feipin/user/verify/collector', {}, { 
                user_id: this.currentVerifyId, 
                approved: true, 
                note: note 
            });
            
            if (result.code === 0) {
                Toast.success('审核通过');
                this.hideVerifyModal();
                this.loadCollectors();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error('操作失败，请重试');
        }
    },

    async rejectCollector() {
        if (!this.currentVerifyId) return;

        const note = document.getElementById('verifyNote')?.value || '';
        
        try {
            const result = await ApiService.post('/feipin/user/verify/collector', {}, { 
                user_id: this.currentVerifyId, 
                approved: false, 
                note: note 
            });
            
            if (result.code === 0) {
                Toast.success('已拒绝');
                this.hideVerifyModal();
                this.loadCollectors();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error('操作失败，请重试');
        }
    }
};

window.CollectorsPage = CollectorsPage;
