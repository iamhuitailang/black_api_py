const Layout = {
    render(content, title = '仪表盘') {
        const user = AuthService.getUser();
        const userName = user?.username || user?.name || '管理员';
        
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="layout">
                <aside class="sidebar">
                    <div class="sidebar-header">
                        <div class="sidebar-logo">
                            <span>🌸</span>
                            <span>牡丹进销存</span>
                        </div>
                    </div>
                    
                    <nav class="sidebar-menu">
                        <div class="menu-section">数据概览</div>
                        <div class="menu-item" data-route="dashboard" onclick="Router.navigate('dashboard')">
                            <div class="icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                            </div>
                            <span>仪表盘</span>
                        </div>
                        
                        <div class="menu-section">业务管理</div>
                        <div class="menu-item" data-route="purchase" onclick="Router.navigate('purchase')">
                            <div class="icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                                </svg>
                            </div>
                            <span>进货管理</span>
                        </div>
                        <div class="menu-item" data-route="sale" onclick="Router.navigate('sale')">
                            <div class="icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm0 10c-2.76 0-5-2.24-5-5h2c0 1.66 1.34 3 3 3s3-1.34 3-3h2c0 2.76-2.24 5-5 5z"/>
                                </svg>
                            </div>
                            <span>销售管理</span>
                        </div>
                        <div class="menu-item" data-route="inventory" onclick="Router.navigate('inventory')">
                            <div class="icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4h16v3z"/>
                                </svg>
                            </div>
                            <span>库存管理</span>
                        </div>
                        
                        <div class="menu-section">基础数据</div>
                        <div class="menu-item" data-route="variety" onclick="Router.navigate('variety')">
                            <div class="icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9-4.03-9-9S7.03 4 2 9c0 4.97 4.03 9 9 9zm5.91-11.53c.19-.48.31-.99.35-1.52l-1.97.41c-.07.35-.2.68-.38.98l1.68 1.36c-.35-.26-.75-.46-1.18-.6l-.54-1.87c-.38.04-.76.1-1.12.19l-.54-1.87H11.8l-.54 1.87c-.36-.09-.73-.15-1.12-.19l-.54-1.87H8.13l-.54 1.87c-.42.14-.83.34-1.18.6l1.68-1.36c-.18-.3-.31-.63-.38-.98l-1.97-.41c.04.53.16 1.04.35 1.52l-1.68 1.36c.35.26.75.46 1.18.6l.54 1.86c-.38-.04-.76-.1-1.12-.19l-.54 1.87h1.47l.54-1.87c.36.09.73.15 1.12.19l.54 1.87h1.47l.54-1.87c.42-.14.83-.34 1.18-.6l-1.68 1.36c.18.3.31.63.38.98l1.97.41c-.04-.53-.16-1.04-.35-1.52l1.68-1.36c-.35.26-.75.46-1.18.6l-.54-1.86c.38.04.76.1 1.12.19l.54 1.87h1.47l.54-1.87c.42-.14.83-.34 1.18-.6l-1.68-1.36zM12 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                                </svg>
                            </div>
                            <span>品种管理</span>
                        </div>
                        <div class="menu-item" data-route="contact" onclick="Router.navigate('contact')">
                            <div class="icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                            </div>
                            <span>联系方式</span>
                        </div>
                        
                        <div class="menu-section">数据统计</div>
                        <div class="menu-item" data-route="statistics" onclick="Router.navigate('statistics')">
                            <div class="icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                                </svg>
                            </div>
                            <span>数据统计</span>
                        </div>
                        <div class="menu-item" data-route="log" onclick="Router.navigate('log')">
                            <div class="icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                                </svg>
                            </div>
                            <span>操作日志</span>
                        </div>
                    </nav>
                </aside>
                
                <main class="main-wrapper">
                    <header class="header">
                        <div class="header-left">
                            <h2 class="header-title" id="pageTitle">${title}</h2>
                        </div>
                        <div class="header-right">
                            <div class="dropdown">
                                <div class="user-info" onclick="Layout.toggleUserMenu()">
                                    <div class="user-avatar">${userName.charAt(0).toUpperCase()}</div>
                                    <span class="user-name">${userName}</span>
                                </div>
                                <div class="dropdown-menu" id="userDropdown">
                                    <div class="dropdown-item" onclick="Layout.changePassword()">
                                        <span>🔐</span> 修改密码
                                    </div>
                                    <div class="dropdown-divider"></div>
                                    <div class="dropdown-item danger" onclick="Layout.logout()">
                                        <span>🚪</span> 退出登录
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>
                    
                    <div class="main-content" id="mainContent">
                        ${content}
                    </div>
                </main>
            </div>
            
            <div class="modal-overlay" id="modalOverlay">
                <div class="modal" id="modalContainer">
                </div>
            </div>
            
            <div class="modal-overlay confirm-modal" id="confirmOverlay">
                <div class="modal">
                    <div class="modal-body">
                        <div class="confirm-icon">!</div>
                        <h3 id="confirmTitle">确认删除</h3>
                        <p id="confirmMessage">确定要删除这条记录吗？此操作不可恢复。</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="Layout.hideConfirm()">取消</button>
                        <button class="btn btn-danger" id="confirmBtn">确定删除</button>
                    </div>
                </div>
            </div>
        `;
        
        Router.setActiveMenu();
        this.bindGlobalEvents();
    },
    
    bindGlobalEvents() {
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('userDropdown');
            const userInfo = e.target.closest('.user-info');
            if (dropdown && !userInfo && !e.target.closest('.dropdown-menu')) {
                dropdown.classList.remove('show');
            }
        });
    },
    
    toggleUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        dropdown.classList.toggle('show');
    },
    
    async logout() {
        await AuthService.logout();
        Toast.info('已退出登录');
        Router.navigate('login');
    },
    
    changePassword() {
        const content = `
            <div class="modal-header">
                <h3 class="modal-title">修改密码</h3>
                <button class="modal-close" onclick="Layout.hideModal()">&times;</button>
            </div>
            <form id="passwordForm">
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">原密码 <span class="required">*</span></label>
                        <input type="password" name="old_password" class="form-control" placeholder="请输入原密码">
                    </div>
                    <div class="form-group">
                        <label class="form-label">新密码 <span class="required">*</span></label>
                        <input type="password" name="new_password" class="form-control" placeholder="请输入新密码">
                    </div>
                    <div class="form-group">
                        <label class="form-label">确认密码 <span class="required">*</span></label>
                        <input type="password" name="confirm_password" class="form-control" placeholder="请再次输入新密码">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="Layout.hideModal()">取消</button>
                    <button type="submit" class="btn btn-primary" id="savePasswordBtn">保存</button>
                </div>
            </form>
        `;
        
        this.showModal(content);
        
        const form = document.getElementById('passwordForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const data = FormUtil.getData(form);
            
            if (!data.old_password) {
                Toast.error('请输入原密码');
                return;
            }
            if (!data.new_password) {
                Toast.error('请输入新密码');
                return;
            }
            if (data.new_password !== data.confirm_password) {
                Toast.error('两次输入的密码不一致');
                return;
            }
            
            const saveBtn = document.getElementById('savePasswordBtn');
            FormUtil.setLoading(saveBtn, true, '保存中...');
            
            try {
                const result = await AuthService.changePassword(data.old_password, data.new_password);
                if (result.code === 0) {
                    Toast.success('密码修改成功');
                    this.hideModal();
                } else {
                    Toast.error(result.message || '修改失败');
                }
            } catch (error) {
                Toast.error(error.message || '网络错误');
            } finally {
                FormUtil.setLoading(saveBtn, false);
            }
        });
    },
    
    showModal(content, options = {}) {
        const overlay = document.getElementById('modalOverlay');
        const container = document.getElementById('modalContainer');
        
        if (options.large) {
            container.className = 'modal modal-lg';
        } else {
            container.className = 'modal';
        }
        
        container.innerHTML = content;
        overlay.classList.add('show');
        
        const closeBtn = container.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.onclick = () => this.hideModal();
        }
        
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                this.hideModal();
            }
        };
    },
    
    hideModal() {
        const overlay = document.getElementById('modalOverlay');
        overlay.classList.remove('show');
    },
    
    showConfirm(title, message, onConfirm) {
        const overlay = document.getElementById('confirmOverlay');
        const titleEl = document.getElementById('confirmTitle');
        const messageEl = document.getElementById('confirmMessage');
        const confirmBtn = document.getElementById('confirmBtn');
        
        titleEl.textContent = title || '确认删除';
        messageEl.textContent = message || '确定要删除这条记录吗？此操作不可恢复。';
        
        confirmBtn.onclick = async () => {
            this.hideConfirm();
            if (onConfirm) {
                await onConfirm();
            }
        };
        
        overlay.classList.add('show');
        
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                this.hideConfirm();
            }
        };
    },
    
    hideConfirm() {
        const overlay = document.getElementById('confirmOverlay');
        overlay.classList.remove('show');
    },
    
    updateTitle(title) {
        const titleEl = document.getElementById('pageTitle');
        if (titleEl) {
            titleEl.textContent = title;
        }
    },
    
    renderPagination(pagination, onPageChange) {
        if (!pagination || pagination.total_pages <= 1) {
            return '';
        }
        
        const { page, page_size, total, total_pages } = pagination;
        let html = '<div class="pagination">';
        
        html += `<button class="pagination-btn" onclick="(${onPageChange})(${page - 1})" ${page <= 1 ? 'disabled' : ''}>‹</button>`;
        
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(total_pages, page + 2);
        
        if (startPage > 1) {
            html += `<button class="pagination-btn" onclick="(${onPageChange})(1)">1</button>`;
            if (startPage > 2) {
                html += '<span class="pagination-info">...</span>';
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === page ? 'active' : ''}" onclick="(${onPageChange})(${i})">${i}</button>`;
        }
        
        if (endPage < total_pages) {
            if (endPage < total_pages - 1) {
                html += '<span class="pagination-info">...</span>';
            }
            html += `<button class="pagination-btn" onclick="(${onPageChange})(${total_pages})">${total_pages}</button>`;
        }
        
        html += `<button class="pagination-btn" onclick="(${onPageChange})(${page + 1})" ${page >= total_pages ? 'disabled' : ''}>›</button>`;
        
        html += `<span class="pagination-info">共 ${total} 条</span>`;
        html += '</div>';
        
        return html;
    },
    
    formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    formatDateTime(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    },
    
    formatPrice(price) {
        if (price === null || price === undefined) return '-';
        return '¥' + Number(price).toFixed(2);
    },
    
    getTodayString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
};
