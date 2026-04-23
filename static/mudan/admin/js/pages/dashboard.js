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
                <p class="page-subtitle">欢迎使用曹州牡丹园后台管理系统</p>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 24px;">
                <div class="card">
                    <div class="card-body">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 4px;">Banner数量</p>
                                <p style="font-size: 28px; font-weight: 600; color: var(--primary-color);" id="bannerCount">-</p>
                            </div>
                            <div style="width: 48px; height: 48px; background: var(--primary-light); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: var(--primary-color);">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-body">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 4px;">Tab导航数</p>
                                <p style="font-size: 28px; font-weight: 600; color: var(--success-color);" id="tabCount">-</p>
                            </div>
                            <div style="width: 48px; height: 48px; background: #e6f4ea; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: var(--success-color);">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="3" y1="12" x2="21" y2="12"></line>
                                    <line x1="3" y1="6" x2="21" y2="6"></line>
                                    <line x1="3" y1="18" x2="21" y2="18"></line>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-body">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 4px;">商品数量</p>
                                <p style="font-size: 28px; font-weight: 600; color: var(--warning-color);" id="productCount">-</p>
                            </div>
                            <div style="width: 48px; height: 48px; background: #fef7e0; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: var(--warning-color);">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                    <line x1="3" y1="6" x2="21" y2="6"></line>
                                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                                </svg>
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
                        <button class="btn btn-secondary" style="justify-content: flex-start; padding: 16px 20px;" onclick="Router.navigate('banner')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 12px;">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            Banner管理
                        </button>
                        <button class="btn btn-secondary" style="justify-content: flex-start; padding: 16px 20px;" onclick="Router.navigate('tab')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 12px;">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                            Tab导航配置
                        </button>
                        <button class="btn btn-secondary" style="justify-content: flex-start; padding: 16px 20px;" onclick="Router.navigate('product')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 12px;">
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <path d="M16 10a4 4 0 0 1-8 0"></path>
                            </svg>
                            商品信息管理
                        </button>
                        <button class="btn btn-secondary" style="justify-content: flex-start; padding: 16px 20px;" onclick="Router.navigate('contact')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 12px;">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                            联系方式配置
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
            const [bannerResult, tabResult, productResult] = await Promise.all([
                BannerService.getList(),
                TabService.getList(),
                ProductService.getList()
            ]);
            
            const bannerCount = bannerResult.data?.items?.length || 0;
            const tabCount = tabResult.data?.length || 0;
            const productCount = productResult.data?.length || 0;
            
            document.getElementById('bannerCount').textContent = bannerCount;
            document.getElementById('tabCount').textContent = tabCount;
            document.getElementById('productCount').textContent = productCount;
        } catch (error) {
            console.error('加载统计数据失败:', error);
        }
    }
};

const Layout = {
    menuItems: [
        { path: 'dashboard', name: '仪表盘', icon: 'dashboard' },
        { path: 'banner', name: 'Banner管理', icon: 'image' },
        { path: 'tab', name: 'Tab导航配置', icon: 'menu' },
        { path: 'product', name: '商品信息管理', icon: 'product' },
        { path: 'contact', name: '联系方式配置', icon: 'contact' }
    ],
    
    render(content) {
        const app = document.getElementById('app');
        const user = AuthService.getUser();
        const currentPath = Router.getCurrentRoute();
        
        app.innerHTML = `
            <div class="layout">
                <aside class="sidebar">
                    <div class="sidebar-header">
                        <span class="sidebar-logo">🌸 曹州牡丹园</span>
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
                                    <div class="user-avatar">${(user?.username || 'A').charAt(0).toUpperCase()}</div>
                                    <span class="user-name">${user?.username || '管理员'}</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </div>
                                <div class="dropdown-menu" id="userDropdownMenu">
                                    <div class="dropdown-item" data-action="profile">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        个人信息
                                    </div>
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
            image: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>`,
            menu: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>`,
            product: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>`,
            contact: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>`
        };
        return icons[name] || '';
    },
    
    getPageTitle(path) {
        const titles = {
            dashboard: '仪表盘',
            banner: 'Banner管理',
            tab: 'Tab导航配置',
            product: '商品信息管理',
            contact: '联系方式配置'
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
                    case 'profile':
                        Toast.info('个人信息功能开发中');
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
                Toast.error(result.message || '修改失败');
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
