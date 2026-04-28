var ProfilePage = {
    userId: null,
    isOwnProfile: true,
    
    render: function(params) {
        this.userId = params && params.id ? parseInt(params.id) : null;
        var currentUser = Auth.getCurrentUser();
        
        if (!this.userId) {
            if (!Auth.checkAuth()) return;
            this.userId = currentUser ? currentUser.id : null;
            this.isOwnProfile = true;
        } else {
            this.isOwnProfile = currentUser && currentUser.id === this.userId;
        }
        
        var app = document.getElementById('app');
        
        var headerHtml = this.isOwnProfile 
            ? `<div class="header-title">我的</div>`
            : `<button class="header-btn" onclick="Router.navigate(-1)"><span>←</span></button><div class="header-title">用户主页</div>`;
        
        app.innerHTML = `
            <div class="page-container ` + (this.isOwnProfile ? 'with-tabbar' : '') + `">
                <div class="header" style="position: absolute; top: 0; left: 0; right: 0; background: transparent; border-bottom: none; z-index: 10;">
                    <div class="header-left">
                        ` + (this.isOwnProfile ? '' : '<button class="header-btn" style="color: white;" onclick="Router.navigate(-1)"><span>←</span></button>') + `
                    </div>
                    <div class="header-title" style="color: white; opacity: 0;">` + (this.isOwnProfile ? '我的' : '用户主页') + `</div>
                    <div class="header-right"></div>
                </div>
                <div class="page-content" id="profileContent">
                    <div class="text-center" style="padding: 40px;">
                        <span class="loading"></span> 加载中...
                    </div>
                </div>
                ` + (this.isOwnProfile ? this.renderTabBar('profile') : '') + `
            </div>
        `;
        
        this.loadProfile();
    },
    
    loadProfile: function() {
        var self = this;
        
        var url = this.isOwnProfile 
            ? '/ex/user/current/get'
            : '/ex/user/profile/get?user_id=' + this.userId;
        
        API.get(url)
            .then(function(response) {
                var user = response.data;
                self.renderProfile(user);
            })
            .catch(function(error) {
                var container = document.getElementById('profileContent');
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">❌</div>
                        <p>加载失败: ` + (error.message || '未知错误') + `</p>
                        <button class="btn btn-primary btn-sm" onclick="Router.navigate('/')">返回首页</button>
                    </div>
                `;
            });
    },
    
    renderProfile: function(user) {
        var creditStars = this.renderStars(user.credit_score || 0);
        
        var container = document.getElementById('profileContent');
        
        var menuHtml = '';
        if (this.isOwnProfile) {
            menuHtml = `
                <div class="menu-list" style="margin-top: 12px;">
                    <div class="menu-item" onclick="ProfilePage.goToMyItems()">
                        <span class="menu-icon">📦</span>
                        <span class="menu-text">我的物品</span>
                        <span class="menu-arrow">›</span>
                    </div>
                    <div class="menu-item" onclick="Router.navigate('/exchange')">
                        <span class="menu-icon">🔄</span>
                        <span class="menu-text">交换记录</span>
                        <span class="menu-arrow">›</span>
                    </div>
                    <div class="menu-item" onclick="Router.navigate('/message')">
                        <span class="menu-icon">💬</span>
                        <span class="menu-text">消息中心</span>
                        <span class="menu-arrow">›</span>
                    </div>
                </div>
                <div class="menu-list" style="margin-top: 12px;">
                    <div class="menu-item" onclick="ProfilePage.showEditModal()">
                        <span class="menu-icon">⚙️</span>
                        <span class="menu-text">编辑资料</span>
                        <span class="menu-arrow">›</span>
                    </div>
                    <div class="menu-item" onclick="ProfilePage.logout()">
                        <span class="menu-icon" style="color: var(--danger-color);">🚪</span>
                        <span class="menu-text" style="color: var(--danger-color);">退出登录</span>
                        <span class="menu-arrow">›</span>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = `
            <div style="margin: -16px -16px 0; padding: 60px 16px 24px; background: linear-gradient(135deg, var(--primary-color) 0%, #059669 100%);">
                <div class="flex-center flex-column" style="color: white;">
                    <div class="avatar" style="background: rgba(255,255,255,0.2); border: 3px solid rgba(255,255,255,0.3);">
                        ` + (user.avatar 
                            ? '<img src="' + user.avatar + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">'
                            : (user.nickname ? user.nickname.charAt(0).toUpperCase() : '?')) + `
                    </div>
                    <div style="font-size: 18px; font-weight: 600; margin-top: 12px;">
                        ` + (user.nickname || user.phone || '用户') + `
                    </div>
                    <div style="font-size: 13px; opacity: 0.9; margin-top: 4px;">
                        信用分: ` + (user.credit_score || 0) + `
                        <span style="margin-left: 8px;">` + creditStars + `</span>
                    </div>
                    ` + (user.city ? '<div style="font-size: 13px; opacity: 0.8; margin-top: 4px;">📍 ' + user.city + '</div>' : '') + `
                </div>
            </div>
            
            <div class="stats-grid" style="margin: 0 -16px; border-radius: 0;">
                <div class="stat-item" onclick="ProfilePage.goToUserItems(' + user.id + ')">
                    <div class="stat-value">` + (user.item_count || 0) + `</div>
                    <div class="stat-label">发布物品</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">` + (user.exchange_count || 0) + `</div>
                    <div class="stat-label">完成交换</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">` + (user.review_count || 0) + `</div>
                    <div class="stat-label">获得评价</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">` + (user.avg_rating || '0').toFixed(1) + `</div>
                    <div class="stat-label">平均评分</div>
                </div>
            </div>
            
            <div class="section-header" style="padding: 16px 0 12px;">
                <div class="section-title">发布的物品</div>
            </div>
            <div class="item-grid" id="userItemList">
                <div class="text-center" style="grid-column: span 2; padding: 20px;">
                    <span class="loading"></span> 加载中...
                </div>
            </div>
            
            ` + menuHtml + `
        `;
        
        this.loadUserItems(user.id);
    },
    
    loadUserItems: function(userId) {
        var self = this;
        
        API.get('/ex/user/profile/get?user_id=' + userId)
            .then(function(response) {
                var data = response.data;
                var items = data.items || [];
                
                var container = document.getElementById('userItemList');
                if (items.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state" style="grid-column: span 2; padding: 24px 0;">
                            <div class="icon" style="font-size: 36px;">📦</div>
                            <p style="font-size: 13px;">暂无物品</p>
                        </div>
                    `;
                } else {
                    container.innerHTML = '';
                    items.slice(0, 4).forEach(function(item) {
                        container.innerHTML += self.renderItemCard(item);
                    });
                }
            })
            .catch(function() {
                var container = document.getElementById('userItemList');
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: span 2; padding: 24px 0;">
                        <p style="font-size: 13px; color: var(--text-secondary);">加载失败</p>
                    </div>
                `;
            });
    },
    
    renderItemCard: function(item) {
        var image = item.images && item.images.length > 0 ? item.images[0] : '';
        
        return `
            <div class="item-card" onclick="Router.navigate('/item/` + item.id + `')">
                <img src="` + image + `" class="item-card-image" alt="` + item.title + `" onerror="this.style.backgroundColor='var(--bg-color)';this.style.display='none';">
                <div class="item-card-content">
                    <div class="item-card-title" style="font-size: 13px;">` + (item.title || '-') + `</div>
                    <div class="item-card-tags">
                        ` + (item.category ? '<span class="item-card-tag" style="font-size: 10px;">' + item.category + '</span>' : '') + `
                    </div>
                </div>
            </div>
        `;
    },
    
    renderStars: function(score) {
        var stars = Math.round(score / 20);
        var html = '';
        for (var i = 1; i <= 5; i++) {
            html += i <= stars ? '★' : '☆';
        }
        return html;
    },
    
    goToMyItems: function() {
        var currentUser = Auth.getCurrentUser();
        if (currentUser) {
            Router.navigate('/search?user_id=' + currentUser.id);
        }
    },
    
    goToUserItems: function(userId) {
        Router.navigate('/search?user_id=' + userId);
    },
    
    showEditModal: function() {
        var user = Auth.getCurrentUser();
        
        var modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.innerHTML = `
            <div class="modal" style="max-width: 90%;">
                <div class="modal-header">
                    <h3 class="modal-title">编辑资料</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').classList.remove('show'); this.closest('.modal-overlay').remove();">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">昵称</label>
                        <input type="text" class="form-control" id="editNickname" value="` + (user ? (user.nickname || '') : '') + `" placeholder="请输入昵称">
                    </div>
                    <div class="form-group">
                        <label class="form-label">所在城市</label>
                        <input type="text" class="form-control" id="editCity" value="` + (user ? (user.city || '') : '') + `" placeholder="请输入所在城市">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').classList.remove('show'); this.closest('.modal-overlay').remove();">取消</button>
                    <button class="btn btn-primary" id="saveEdit">保存</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('saveEdit').addEventListener('click', function() {
            var nickname = document.getElementById('editNickname').value.trim();
            var city = document.getElementById('editCity').value.trim();
            
            var updateData = {};
            if (nickname) updateData.nickname = nickname;
            if (city) updateData.city = city;
            
            if (Object.keys(updateData).length === 0) {
                Toast.error('请填写要更新的内容');
                return;
            }
            
            var saveBtn = this;
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="loading-small"></span> 保存中...';
            
            API.post('/ex/user/profile/update', updateData)
                .then(function(response) {
                    var updatedUser = response.data;
                    Storage.setUser(updatedUser);
                    Toast.success('保存成功');
                    modal.classList.remove('show');
                    setTimeout(function() {
                        modal.remove();
                        ProfilePage.render();
                    }, 300);
                })
                .catch(function(error) {
                    Toast.error(error.message || '保存失败');
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '保存';
                });
        });
    },
    
    logout: function() {
        var modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.innerHTML = `
            <div class="modal" style="max-width: 80%;">
                <div class="modal-header">
                    <h3 class="modal-title">确认退出</h3>
                </div>
                <div class="modal-body" style="text-align: center; padding: 20px;">
                    确定要退出登录吗？
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').classList.remove('show'); this.closest('.modal-overlay').remove();">取消</button>
                    <button class="btn btn-primary" style="color: var(--danger-color);" onclick="ProfilePage.confirmLogout(this)">确定退出</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    confirmLogout: function(btn) {
        Auth.logout();
        Toast.success('已退出登录');
        setTimeout(function() {
            Router.navigate('/login');
        }, 500);
    },
    
    renderTabBar: function(active) {
        return `
            <div class="tab-bar safe-bottom">
                <div class="tab-item ` + (active === 'home' ? 'active' : '') + `" onclick="Router.navigate('/')">
                    <div class="icon">🏠</div>
                    <div class="label">首页</div>
                </div>
                <div class="tab-item ` + (active === 'exchange' ? 'active' : '') + `" onclick="Router.navigate('/exchange')">
                    <div class="icon">🔄</div>
                    <div class="label">交换</div>
                </div>
                <div class="tab-item ` + (active === 'publish' ? 'active' : '') + `" onclick="Router.navigate('/publish')">
                    <div class="icon">➕</div>
                    <div class="label">发布</div>
                </div>
                <div class="tab-item ` + (active === 'message' ? 'active' : '') + `" onclick="Router.navigate('/message')">
                    <div class="icon">💬</div>
                    <div class="label">消息</div>
                </div>
                <div class="tab-item ` + (active === 'profile' ? 'active' : '') + `" onclick="Router.navigate('/profile')">
                    <div class="icon">👤</div>
                    <div class="label">我的</div>
                </div>
            </div>
        `;
    }
};
