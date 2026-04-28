const App = {
    init() {
        this.registerRoutes();
        Router.init();
    },
    
    registerRoutes() {
        Router.register('login', () => {
            LoginPage.render();
        });
        
        Router.register('market', () => {
            MarketPage.render();
        });
        
        Router.register('market_detail', () => {
            MarketDetailPage.render();
        });
        
        Router.register('favorite', () => {
            this.renderFavoritePage();
        });
        
        Router.register('profile', () => {
            this.renderProfilePage();
        });
        
        Router.register('booth', () => {
            this.renderBoothPage();
        });
        
        Router.register('price', () => {
            this.renderPricePage();
        });
        
        Router.register('review', () => {
            this.renderReviewPage();
        });
        
        Router.register('qa', () => {
            this.renderQAPage();
        });
    },
    
    renderFavoritePage() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="app-container">
                <div class="header">
                    <div class="header-title">我的收藏</div>
                </div>
                <div class="main-content" id="favorite-content">
                    <div class="loading-container">
                        <div class="loading"></div>
                    </div>
                </div>
                ${this.renderTabBar('favorite')}
            </div>
        `;
        this.loadFavorites();
    },
    
    async loadFavorites() {
        const content = document.getElementById('favorite-content');
        try {
            const result = await FavoriteService.getList();
            if (result.code === 0 && result.data && result.data.length > 0) {
                content.innerHTML = result.data.map(item => `
                    <div class="favorite-item" data-id="${item.market_id}">
                        <div class="favorite-icon">🏪</div>
                        <div class="favorite-info">
                            <h4>${item.market_name || '集市'}</h4>
                            <p>${item.market_address || ''}</p>
                        </div>
                        <div class="favorite-actions">
                            <span class="market-card-favorite active" data-id="${item.market_id}">❤</span>
                        </div>
                    </div>
                `).join('');
                
                content.querySelectorAll('.favorite-item').forEach(item => {
                    item.addEventListener('click', (e) => {
                        if (!e.target.classList.contains('market-card-favorite')) {
                            const id = item.dataset.id;
                            window.location.hash = `#market_detail?id=${id}`;
                        }
                    });
                });
                
                content.querySelectorAll('.market-card-favorite').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const id = btn.dataset.id;
                        this.toggleFavorite(id, btn);
                    });
                });
            } else {
                content.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">💔</div>
                        <p>暂无收藏的集市</p>
                        <p class="mt-1" style="font-size: 12px;">去集市列表收藏感兴趣的集市吧</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('加载收藏失败:', error);
            content.innerHTML = `
                <div class="empty-state">
                    <div class="icon">⚠️</div>
                    <p>加载失败</p>
                </div>
            `;
        }
    },
    
    async toggleFavorite(marketId, btn) {
        try {
            const isFavorite = btn.classList.contains('active');
            if (isFavorite) {
                const result = await FavoriteService.remove(marketId);
                if (result.code === 0) {
                    btn.classList.remove('active');
                    Toast.show('已取消收藏', 'success');
                    this.loadFavorites();
                }
            }
        } catch (error) {
            console.error('操作失败:', error);
            Toast.show('操作失败', 'error');
        }
    },
    
    renderProfilePage() {
        const app = document.getElementById('app');
        const user = Storage.getUser();
        app.innerHTML = `
            <div class="app-container">
                <div class="profile-header">
                    <div class="profile-avatar">👤</div>
                    <div class="profile-name">${user?.nickname || user?.phone || '用户'}</div>
                    <div class="profile-phone">${user?.phone ? this.maskPhone(user.phone) : ''}</div>
                </div>
                <div class="main-content profile-menu">
                    <div class="menu-group">
                        <div class="menu-item" id="menu-checkin">
                            <span class="menu-item-icon">📅</span>
                            <span class="menu-item-text">打卡记录</span>
                            <span class="menu-item-arrow">›</span>
                        </div>
                        <div class="menu-item" id="menu-review">
                            <span class="menu-item-icon">⭐</span>
                            <span class="menu-item-text">我的评价</span>
                            <span class="menu-item-arrow">›</span>
                        </div>
                        <div class="menu-item" id="menu-price-report">
                            <span class="menu-item-icon">💰</span>
                            <span class="menu-item-text">价格上报记录</span>
                            <span class="menu-item-arrow">›</span>
                        </div>
                    </div>
                    <div class="menu-group">
                        <div class="menu-item" id="menu-password">
                            <span class="menu-item-icon">🔒</span>
                            <span class="menu-item-text">修改密码</span>
                            <span class="menu-item-arrow">›</span>
                        </div>
                    </div>
                    <button class="btn btn-block logout-btn" id="btn-logout">
                        退出登录
                    </button>
                </div>
                ${this.renderTabBar('profile')}
            </div>
        `;
        this.bindProfileEvents();
    },
    
    maskPhone(phone) {
        if (!phone || phone.length < 11) return phone;
        return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    },
    
    bindProfileEvents() {
        document.getElementById('btn-logout').addEventListener('click', () => {
            App.doLogout();
        });
        
        document.getElementById('menu-password').addEventListener('click', () => {
            this.showPasswordModal();
        });
        
        document.getElementById('menu-checkin').addEventListener('click', () => {
            Toast.show('功能开发中', 'info');
        });
        
        document.getElementById('menu-review').addEventListener('click', () => {
            Toast.show('功能开发中', 'info');
        });
        
        document.getElementById('menu-price-report').addEventListener('click', () => {
            Toast.show('功能开发中', 'info');
        });
    },
    
    doLogout() {
        if (!confirm('确定要退出登录吗？')) {
            return;
        }
        
        try {
            AuthService.logout();
        } catch (e) {
            console.error('Logout error:', e);
        }
        
        Storage.clearToken();
        Storage.clearUser();
        
        window.location.href = window.location.pathname + '#login';
        window.location.reload();
    },
    
    showPasswordModal() {
        const modalHtml = `
            <div class="modal-overlay" id="password-modal">
                <div class="modal">
                    <div class="modal-header">
                        <div class="modal-title">修改密码</div>
                        <button class="modal-close" onclick="App.closePasswordModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">原密码<span class="required">*</span></label>
                            <input type="password" class="form-control" id="old-password" placeholder="请输入原密码">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新密码<span class="required">*</span></label>
                            <input type="password" class="form-control" id="new-password" placeholder="请输入新密码(6-20位)">
                        </div>
                        <div class="form-group">
                            <label class="form-label">确认密码<span class="required">*</span></label>
                            <input type="password" class="form-control" id="confirm-password" placeholder="请再次输入新密码">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="App.closePasswordModal()">取消</button>
                        <button class="btn btn-primary" onclick="App.changePassword()">确认修改</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.getElementById('password-modal').classList.add('show');
    },
    
    closePasswordModal() {
        const modal = document.getElementById('password-modal');
        if (modal) {
            modal.remove();
        }
    },
    
    async changePassword() {
        const oldPassword = document.getElementById('old-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (!oldPassword) {
            Toast.show('请输入原密码', 'error');
            return;
        }
        if (!newPassword) {
            Toast.show('请输入新密码', 'error');
            return;
        }
        if (newPassword.length < 6 || newPassword.length > 20) {
            Toast.show('密码长度为6-20位', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            Toast.show('两次密码输入不一致', 'error');
            return;
        }
        
        try {
            const result = await AuthService.changePassword(oldPassword, newPassword);
            if (result.code === 0) {
                Toast.show('密码修改成功', 'success');
                this.closePasswordModal();
            } else {
                Toast.show(result.msg || '修改失败', 'error');
            }
        } catch (error) {
            console.error('修改密码失败:', error);
            Toast.show('修改失败', 'error');
        }
    },
    
    renderBoothPage() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="app-container">
                <div class="header">
                    <div class="header-title">摊位列表</div>
                </div>
                <div class="main-content" id="booth-content">
                    <div class="loading-container">
                        <div class="loading"></div>
                    </div>
                </div>
                ${this.renderTabBar('market')}
            </div>
        `;
        this.loadBooths();
    },
    
    async loadBooths() {
        const content = document.getElementById('booth-content');
        try {
            const result = await BoothService.getList();
            if (result.code === 0 && result.data && result.data.length > 0) {
                content.innerHTML = result.data.map(item => `
                    <div class="booth-card">
                        <div class="booth-avatar">🏪</div>
                        <div class="booth-info">
                            <div class="booth-header">
                                <span class="booth-name">${item.name || item.owner_name || '摊位'}</span>
                                ${item.is_certified ? '<span class="booth-certified">✓认证</span>' : ''}
                            </div>
                            <div class="booth-category">${item.category || ''}</div>
                            <div class="booth-location">
                                <span>📍</span>
                                <span>${item.location_description || ''}</span>
                            </div>
                            <div class="booth-footer">
                                <div class="booth-rating">
                                    <span class="rating-stars">★★★★★</span>
                                    <span class="rating-value">${item.rating || 5}</span>
                                </div>
                                ${item.phone ? `<a href="tel:${item.phone}" class="booth-phone">📞</a>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                content.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">🏪</div>
                        <p>暂无摊位信息</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('加载摊位失败:', error);
            content.innerHTML = `
                <div class="empty-state">
                    <div class="icon">⚠️</div>
                    <p>加载失败</p>
                </div>
            `;
        }
    },
    
    renderPricePage() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="app-container">
                <div class="header">
                    <div class="header-title">价格参考</div>
                </div>
                <div class="main-content" id="price-content">
                    <div class="loading-container">
                        <div class="loading"></div>
                    </div>
                </div>
                ${this.renderTabBar('market')}
            </div>
        `;
        this.loadPrices();
    },
    
    async loadPrices() {
        const content = document.getElementById('price-content');
        try {
            const result = await PriceService.getList();
            if (result.code === 0 && result.data && result.data.length > 0) {
                content.innerHTML = result.data.map(item => `
                    <div class="price-card">
                        <div class="price-header">
                            <span class="price-name">${item.item_name || '物品'}</span>
                            <span class="price-category">${item.category_name || ''}</span>
                        </div>
                        <div class="price-values">
                            <span class="price-min">¥${item.min_price || 0}</span>
                            <span class="price-max">- ¥${item.max_price || 0}</span>
                            <span class="price-unit">/${item.unit || '斤'}</span>
                        </div>
                        <div class="price-footer">
                            <span>${item.market_name || ''}</span>
                            <span>${item.created_at ? item.created_at.split(' ')[0] : ''}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                content.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">💰</div>
                        <p>暂无价格信息</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('加载价格失败:', error);
            content.innerHTML = `
                <div class="empty-state">
                    <div class="icon">⚠️</div>
                    <p>加载失败</p>
                </div>
            `;
        }
    },
    
    renderReviewPage() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="app-container">
                <div class="header">
                    <div class="header-title">集市评价</div>
                </div>
                <div class="main-content" id="review-content">
                    <div class="loading-container">
                        <div class="loading"></div>
                    </div>
                </div>
                ${this.renderTabBar('market')}
            </div>
        `;
        this.loadReviews();
    },
    
    async loadReviews() {
        const content = document.getElementById('review-content');
        try {
            const result = await ReviewService.getList();
            if (result.code === 0 && result.data && result.data.length > 0) {
                content.innerHTML = result.data.map(item => `
                    <div class="review-card">
                        <div class="review-header">
                            <div class="review-avatar">👤</div>
                            <div class="review-info">
                                <div class="review-user">用户${item.user_id || ''}</div>
                                <div class="review-time">${item.created_at || ''}</div>
                            </div>
                            <div class="review-rating">
                                ${'★'.repeat(item.rating || 5)}${'☆'.repeat(5 - (item.rating || 5))}
                            </div>
                        </div>
                        <div class="review-content">${item.content || '暂无评价内容'}</div>
                    </div>
                `).join('');
            } else {
                content.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">⭐</div>
                        <p>暂无评价</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('加载评价失败:', error);
            content.innerHTML = `
                <div class="empty-state">
                    <div class="icon">⚠️</div>
                    <p>加载失败</p>
                </div>
            `;
        }
    },
    
    renderQAPage() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="app-container">
                <div class="header">
                    <div class="header-title">求助问答</div>
                </div>
                <div class="main-content" id="qa-content">
                    <div class="loading-container">
                        <div class="loading"></div>
                    </div>
                </div>
                ${this.renderTabBar('market')}
            </div>
        `;
        this.loadQA();
    },
    
    async loadQA() {
        const content = document.getElementById('qa-content');
        try {
            const result = await QAService.getList();
            if (result.code === 0 && result.data && result.data.length > 0) {
                content.innerHTML = result.data.map(item => `
                    <div class="qa-card">
                        <div class="qa-question">${item.question || ''}</div>
                        <div class="qa-meta">
                            <span>提问人: 用户${item.user_id || ''}</span>
                            <span>${item.created_at || ''}</span>
                        </div>
                        ${item.best_answer ? `
                            <div class="qa-answer">
                                <div class="qa-answer-label">最佳回答</div>
                                <div>${item.best_answer}</div>
                            </div>
                        ` : `
                            <div class="qa-no-answer">暂无回答</div>
                        `}
                    </div>
                `).join('');
            } else {
                content.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">💬</div>
                        <p>暂无问答</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('加载问答失败:', error);
            content.innerHTML = `
                <div class="empty-state">
                    <div class="icon">⚠️</div>
                    <p>加载失败</p>
                </div>
            `;
        }
    },
    
    renderTabBar(active) {
        return `
            <div class="tab-bar">
                <div class="tab-item ${active === 'market' ? 'active' : ''}" data-route="market">
                    <span class="tab-icon">🏠</span>
                    <span class="tab-label">集市</span>
                </div>
                <div class="tab-item ${active === 'favorite' ? 'active' : ''}" data-route="favorite">
                    <span class="tab-icon">❤</span>
                    <span class="tab-label">收藏</span>
                </div>
                <div class="tab-item ${active === 'profile' ? 'active' : ''}" data-route="profile">
                    <span class="tab-icon">👤</span>
                    <span class="tab-label">我的</span>
                </div>
            </div>
        `;
    }
};

document.addEventListener('click', (e) => {
    const tabItem = e.target.closest('.tab-item');
    if (tabItem && tabItem.dataset.route) {
        const route = tabItem.dataset.route;
        window.location.hash = `#${route}`;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
