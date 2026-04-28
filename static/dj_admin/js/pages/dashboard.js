const Toast = {
    container: null,
    
    init() {
        this.container = document.getElementById('toastContainer');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            this.container.id = 'toastContainer';
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'info', duration = 3000) {
        this.init();
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span style="font-size: 16px;">${icons[type]}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close">&times;</button>
        `;
        
        this.container.appendChild(toast);
        
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    
    success(message) {
        this.show(message, 'success');
    },
    
    error(message) {
        this.show(message, 'error');
    },
    
    warning(message) {
        this.show(message, 'warning');
    },
    
    info(message) {
        this.show(message, 'info');
    }
};

const DashboardPage = {
    render() {
        const content = `
            <div class="page-header">
                <h1 class="page-title">仪表盘</h1>
                <p class="page-subtitle">欢迎使用赶大集后台管理系统</p>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 24px;">
                <div class="card">
                    <div class="card-body">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 4px;">集市总数</p>
                                <p style="font-size: 28px; font-weight: 600; color: var(--primary-color);" id="marketCount">-</p>
                            </div>
                            <div style="width: 48px; height: 48px; background: var(--primary-light); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: var(--primary-color);">
                                🏪
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-body">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 4px;">摊位总数</p>
                                <p style="font-size: 28px; font-weight: 600; color: var(--success-color);" id="boothCount">-</p>
                            </div>
                            <div style="width: 48px; height: 48px; background: #e6f4ea; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: var(--success-color);">
                                🏪
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-body">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 4px;">用户总数</p>
                                <p style="font-size: 28px; font-weight: 600; color: var(--warning-color);" id="userCount">-</p>
                            </div>
                            <div style="width: 48px; height: 48px; background: #fef7e0; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: var(--warning-color);">
                                👥
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-body">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 4px;">待审核价格</p>
                                <p style="font-size: 28px; font-weight: 600; color: var(--danger-color);" id="pendingPriceCount">-</p>
                            </div>
                            <div style="width: 48px; height: 48px; background: #fce8e6; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: var(--danger-color);">
                                💰
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">快捷操作</h3>
                </div>
                <div class="card-body">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                        <button class="btn btn-secondary" style="justify-content: flex-start; padding: 16px 20px;" onclick="Router.navigate('market')">
                            <span style="font-size: 20px; margin-right: 12px;">🏪</span>
                            集市管理
                        </button>
                        <button class="btn btn-secondary" style="justify-content: flex-start; padding: 16px 20px;" onclick="Router.navigate('booth')">
                            <span style="font-size: 20px; margin-right: 12px;">🏪</span>
                            摊位管理
                        </button>
                        <button class="btn btn-secondary" style="justify-content: flex-start; padding: 16px 20px;" onclick="Router.navigate('price')">
                            <span style="font-size: 20px; margin-right: 12px;">💰</span>
                            价格审核
                        </button>
                        <button class="btn btn-secondary" style="justify-content: flex-start; padding: 16px 20px;" onclick="Router.navigate('user')">
                            <span style="font-size: 20px; margin-right: 12px;">👥</span>
                            用户管理
                        </button>
                        <button class="btn btn-secondary" style="justify-content: flex-start; padding: 16px 20px;" onclick="Router.navigate('review')">
                            <span style="font-size: 20px; margin-right: 12px;">📝</span>
                            评价管理
                        </button>
                        <button class="btn btn-secondary" style="justify-content: flex-start; padding: 16px 20px;" onclick="Router.navigate('qa')">
                            <span style="font-size: 20px; margin-right: 12px;">❓</span>
                            问答管理
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        Layout.render(content);
        this.loadStats();
    },
    
    async loadStats() {
        try {
            const [marketResult, boothResult, userResult, priceResult] = await Promise.all([
                MarketService.getStatistics(),
                BoothService.getStatistics(),
                UserService.getStatistics(),
                PriceService.getStatistics()
            ]);
            
            const marketCount = marketResult.data?.total_markets || 0;
            const boothCount = boothResult.data?.total_booths || 0;
            const userCount = userResult.data?.total_users || 0;
            const pendingPriceCount = priceResult.data?.pending_reports || 0;
            
            document.getElementById('marketCount').textContent = marketCount;
            document.getElementById('boothCount').textContent = boothCount;
            document.getElementById('userCount').textContent = userCount;
            document.getElementById('pendingPriceCount').textContent = pendingPriceCount;
        } catch (error) {
            console.error('加载统计数据失败:', error);
        }
    }
};

const Layout = {
    menuItems: [
        { path: 'dashboard', name: '仪表盘', icon: 'dashboard' },
        { path: 'market', name: '集市管理', icon: 'market' },
        { path: 'booth', name: '摊位管理', icon: 'booth' },
        { path: 'price', name: '价格审核', icon: 'price' },
        { path: 'user', name: '用户管理', icon: 'user' },
        { path: 'review', name: '评价管理', icon: 'review' },
        { path: 'qa', name: '问答管理', icon: 'qa' }
    ],
    
    render(content) {
        const app = document.getElementById('app');
        const user = AuthService.getUser();
        const currentPath = Router.getCurrentRoute();
        
        app.innerHTML = `
            <div class="layout">
                <aside class="sidebar">
                    <div class="sidebar-header">
                        <span class="sidebar-logo">🛒 赶大集</span>
                    </div>
                    <nav class="sidebar-menu">
                        ${this.menuItems.map(item => `
                            <div class="menu-item ${currentPath === item.path ? 'active' : ''}" data-path="${item.path}">
                                <span class="icon">${this.getIcon(item.icon)}</span>
                                <span>${item.name}</span>
                            </div>
                        `).join('')}
                    </nav>
                </aside>
                
                <div class="main-wrapper">
                    <header class="header">
                        <div class="header-left">
                            <h1 class="header-title">${this.getPageTitle(currentPath)}</h1>
                        </div>
                        <div class="header-right">
                            <div class="dropdown">
                                <div class="user-info" id="userDropdown">
                                    <div class="user-avatar">${(user?.nickname || 'A').charAt(0).toUpperCase()}</div>
                                    <span class="user-name">${user?.nickname || user?.phone || '管理员'}</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </div>
                                <div class="dropdown-menu" id="userDropdownMenu">
                                    <div class="dropdown-item" data-action="changePassword">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                        </svg>
                                        修改密码
                                    </div>
                                    <div class="dropdown-divider"></div>
                                    <div class="dropdown-item danger" data-action="logout">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                            <polyline points="16 17 21 12 16 7"></polyline>
                                            <line x1="21" y1="12" x2="9" y2="12"></line>
                                        </svg>
                                        退出登录
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>
                    
                    <main class="main-content" id="mainContent">
                        ${content || ''}
                    </main>
                </div>
            </div>
            
            <div id="toastContainer" class="toast-container"></div>
        `;
        
        this.bindEvents();
    },
    
    getIcon(name) {
        const icons = {
            dashboard: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
            </svg>`,
            market: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>`,
            booth: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>`,
            price: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>`,
            user: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>`,
            review: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>`,
            qa: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>`
        };
        return icons[name] || '';
    },
    
    getPageTitle(path) {
        const titles = {
            dashboard: '仪表盘',
            market: '集市管理',
            booth: '摊位管理',
            price: '价格审核',
            user: '用户管理',
            review: '评价管理',
            qa: '问答管理'
        };
        return titles[path] || '仪表盘';
    },
    
    bindEvents() {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const path = item.dataset.path;
                Router.navigate(path);
            });
        });
        
        const userDropdown = document.getElementById('userDropdown');
        const userDropdownMenu = document.getElementById('userDropdownMenu');
        
        userDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdownMenu.classList.toggle('show');
        });
        
        document.addEventListener('click', () => {
            userDropdownMenu.classList.remove('show');
        });
        
        userDropdownMenu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.stopPropagation();
                userDropdownMenu.classList.remove('show');
                const action = item.dataset.action;
                
                switch (action) {
                    case 'logout':
                        await this.handleLogout();
                        break;
                    case 'changePassword':
                        this.showChangePasswordModal();
                        break;
                }
            });
        });
    },
    
    async handleLogout() {
        try {
            await AuthService.logout();
            Toast.success('已退出登录');
            Router.navigate('login');
        } catch (error) {
            Toast.error('退出失败');
        }
    },
    
    showChangePasswordModal() {
        const modalHtml = `
            <div class="modal-overlay show" id="changePasswordModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">修改密码</h3>
                        <button class="modal-close" data-close="changePasswordModal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="changePasswordForm">
                            <div class="form-group">
                                <label class="form-label">
                                    原密码<span class="required">*</span>
                                </label>
                                <input type="password" id="oldPassword" class="form-control" placeholder="请输入原密码">
                                <div class="form-error" id="oldPasswordError"></div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">
                                    新密码<span class="required">*</span>
                                </label>
                                <input type="password" id="newPassword" class="form-control" placeholder="请输入新密码（至少6位）">
                                <div class="form-error" id="newPasswordError"></div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">
                                    确认新密码<span class="required">*</span>
                                </label>
                                <input type="password" id="confirmPassword" class="form-control" placeholder="请再次输入新密码">
                                <div class="form-error" id="confirmPasswordError"></div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-close="changePasswordModal">取消</button>
                        <button class="btn btn-primary" id="submitChangePassword">确认修改</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.bindModalEvents('changePasswordModal');
        
        const submitBtn = document.getElementById('submitChangePassword');
        submitBtn.addEventListener('click', async () => {
            await this.handleChangePassword();
        });
    },
    
    async handleChangePassword() {
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        let hasError = false;
        
        if (!oldPassword) {
            this.showModalError('oldPassword', '请输入原密码');
            hasError = true;
        }
        
        if (!newPassword) {
            this.showModalError('newPassword', '请输入新密码');
            hasError = true;
        } else if (newPassword.length < 6) {
            this.showModalError('newPassword', '新密码至少6位');
            hasError = true;
        }
        
        if (newPassword !== confirmPassword) {
            this.showModalError('confirmPassword', '两次输入的密码不一致');
            hasError = true;
        }
        
        if (hasError) return;
        
        try {
            const result = await AuthService.changePassword(oldPassword, newPassword);
            if (result.code === 0) {
                Toast.success('密码修改成功，请重新登录');
                this.closeModal('changePasswordModal');
                setTimeout(() => {
                    AuthService.logout();
                    Router.navigate('login');
                }, 1000);
            } else {
                Toast.error(result.msg || '修改失败');
            }
        } catch (error) {
            Toast.error(error.message || '网络错误');
        }
    },
    
    showModalError(field, message) {
        const errorEl = document.getElementById(field + 'Error');
        const inputEl = document.getElementById(field);
        if (errorEl) errorEl.textContent = message;
        if (inputEl) inputEl.style.borderColor = 'var(--danger-color)';
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
