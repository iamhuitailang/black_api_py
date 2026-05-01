const ProfilePage = {
    async render() {
        if (!Auth.checkAuth()) return;

        const user = Auth.getUser();
        const isCollector = user && user.role === 'collector';

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page">
                <div class="profile-header">
                    <div class="profile-avatar">${(user?.nickname || '用').charAt(0)}</div>
                    <div class="profile-info">
                        <div class="profile-name">${user?.nickname || '用户'}</div>
                        <div class="profile-role">
                            ${user?.role === 'collector' ? '回收员' : 
                              user?.role === 'admin' ? '管理员' : '普通用户'}
                        </div>
                    </div>
                </div>

                ${isCollector ? this.renderCollectorStats() : this.renderUserStats()}

                <div class="profile-menu">
                    ${isCollector ? this.renderCollectorMenu() : this.renderUserMenu()}
                    
                    <div class="divider"></div>
                    
                    <div class="profile-menu-item" id="switchRole">
                        <span class="profile-menu-icon">🔄</span>
                        <span class="profile-menu-text">
                            ${isCollector ? '切换为用户模式' : '申请成为回收员'}
                        </span>
                        <span class="profile-menu-arrow">›</span>
                    </div>
                    
                    <div class="profile-menu-item" id="logoutBtn">
                        <span class="profile-menu-icon">🚪</span>
                        <span class="profile-menu-text">退出登录</span>
                        <span class="profile-menu-arrow">›</span>
                    </div>
                </div>

                ${isCollector ? this.getCollectorTabbar() : this.getTabbar()}
            </div>
        `;

        this.bindEvents();
        this.refreshBalance();
    },

    renderUserStats() {
        const user = Auth.getUser();
        return `
            <div class="profile-balance">
                <div class="profile-balance-info">
                    <div class="profile-balance-label">累计收入</div>
                    <div class="profile-balance-value">
                        ¥<span id="balanceValue">${user?.balance ? user.balance.toFixed(2) : '0.00'}</span>
                    </div>
                </div>
            </div>
            
            <div class="profile-stats">
                <div class="profile-stat">
                    <div class="profile-stat-value" id="orderCount">0</div>
                    <div class="profile-stat-label">我的订单</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat-value" id="completedCount">0</div>
                    <div class="profile-stat-label">已完成</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat-value">0</div>
                    <div class="profile-stat-label">评价数</div>
                </div>
            </div>
        `;
    },

    renderCollectorStats() {
        const user = Auth.getUser();
        return `
            <div class="profile-balance">
                <div class="profile-balance-info">
                    <div class="profile-balance-label">账户余额</div>
                    <div class="profile-balance-value">
                        ¥<span id="balanceValue">${user?.balance ? user.balance.toFixed(2) : '0.00'}</span>
                    </div>
                </div>
            </div>
            
            <div class="profile-stats">
                <div class="profile-stat">
                    <div class="profile-stat-value" id="orderCount">0</div>
                    <div class="profile-stat-label">接单数量</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat-value" id="completedCount">0</div>
                    <div class="profile-stat-label">已完成</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat-value">4.9</div>
                    <div class="profile-stat-label">平均评分</div>
                </div>
            </div>
        `;
    },

    renderUserMenu() {
        return `
            <div class="profile-menu-item" data-route="order">
                <span class="profile-menu-icon">📦</span>
                <span class="profile-menu-text">我的订单</span>
                <span class="profile-menu-arrow">›</span>
            </div>
            <div class="profile-menu-item" data-route="create-order">
                <span class="profile-menu-icon">➕</span>
                <span class="profile-menu-text">发布回收</span>
                <span class="profile-menu-arrow">›</span>
            </div>
            <div class="profile-menu-item" data-route="collector">
                <span class="profile-menu-icon">👷</span>
                <span class="profile-menu-text">附近回收员</span>
                <span class="profile-menu-arrow">›</span>
            </div>
            <div class="profile-menu-item">
                <span class="profile-menu-icon">📋</span>
                <span class="profile-menu-text">收入统计</span>
                <span class="profile-menu-arrow">›</span>
            </div>
        `;
    },

    renderCollectorMenu() {
        return `
            <div class="profile-menu-item" data-route="collector-orders">
                <span class="profile-menu-icon">📦</span>
                <span class="profile-menu-text">我的订单</span>
                <span class="profile-menu-arrow">›</span>
            </div>
            <div class="profile-menu-item" data-route="order-hall">
                <span class="profile-menu-icon">📋</span>
                <span class="profile-menu-text">订单大厅</span>
                <span class="profile-menu-arrow">›</span>
            </div>
            <div class="profile-menu-item" data-route="income">
                <span class="profile-menu-icon">💰</span>
                <span class="profile-menu-text">收入记录</span>
                <span class="profile-menu-arrow">›</span>
            </div>
            <div class="profile-menu-item" data-route="stats">
                <span class="profile-menu-icon">📊</span>
                <span class="profile-menu-text">我的业绩</span>
                <span class="profile-menu-arrow">›</span>
            </div>
        `;
    },

    getTabbar() {
        return `
            <div class="tabbar">
                <div class="tabbar-item" data-route="home">
                    <span class="tabbar-icon">🏠</span>
                    <span class="tabbar-text">首页</span>
                </div>
                <div class="tabbar-item" data-route="price">
                    <span class="tabbar-icon">💰</span>
                    <span class="tabbar-text">价格</span>
                </div>
                <div class="tabbar-item" data-route="order">
                    <span class="tabbar-icon">📦</span>
                    <span class="tabbar-text">订单</span>
                </div>
                <div class="tabbar-item active" data-route="profile">
                    <span class="tabbar-icon">👤</span>
                    <span class="tabbar-text">我的</span>
                </div>
            </div>
        `;
    },

    getCollectorTabbar() {
        return `
            <div class="tabbar">
                <div class="tabbar-item" data-route="home">
                    <span class="tabbar-icon">🏠</span>
                    <span class="tabbar-text">首页</span>
                </div>
                <div class="tabbar-item" data-route="order-hall">
                    <span class="tabbar-icon">📋</span>
                    <span class="tabbar-text">订单大厅</span>
                </div>
                <div class="tabbar-item" data-route="collector-orders">
                    <span class="tabbar-icon">📦</span>
                    <span class="tabbar-text">我的订单</span>
                </div>
                <div class="tabbar-item active" data-route="profile">
                    <span class="tabbar-icon">👤</span>
                    <span class="tabbar-text">我的</span>
                </div>
            </div>
        `;
    },

    bindEvents() {
        const tabbarItems = document.querySelectorAll('.tabbar-item');
        tabbarItems.forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                Router.navigate(route);
            });
        });

        const menuItems = document.querySelectorAll('.profile-menu-item[data-route]');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                Router.navigate(route);
            });
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        document.getElementById('switchRole').addEventListener('click', () => {
            this.switchRole();
        });
    },

    async refreshBalance() {
        try {
            const result = await Auth.getCurrentUser();
            if (result.code === 200) {
                const user = result.data;
                const balanceEl = document.getElementById('balanceValue');
                if (balanceEl && user.balance !== undefined) {
                    balanceEl.textContent = user.balance.toFixed(2);
                }
            }
        } catch (e) {
            console.error('Refresh balance error:', e);
        }
    },

    async logout() {
        try {
            await Auth.logout();
            Toast.success('已退出登录');
            setTimeout(() => {
                Router.navigate('login');
            }, 500);
        } catch (e) {
            Toast.error('退出登录失败');
        }
    },

    async switchRole() {
        const user = Auth.getUser();
        
        if (user.role === 'collector') {
            user.role = 'user';
            Storage.setUser(user);
            Toast.success('已切换为用户模式');
            Router.navigate('home');
            return;
        }

        const confirmed = confirm('确定要申请成为回收员吗？');
        if (!confirmed) return;

        try {
            const result = await Auth.applyCollector(user.nickname, '13800000000');
            if (result.code === 200) {
                Toast.success('申请成功，已成为回收员');
                Router.navigate('home');
            } else {
                Toast.error(result.msg || '申请失败');
            }
        } catch (e) {
            Toast.error('申请失败，请稍后重试');
        }
    }
};
