const ProfilePage = {
    name: 'profile',
    requiresAuth: true,
    template: `
        <div class="page">
            <div class="profile-header">
                <div class="profile-avatar" id="profileAvatar">🧑</div>
                <div class="profile-info">
                    <div class="profile-name">
                        <span id="profileName">用户</span>
                        <span class="profile-level-badge" id="profileLevel">萌新</span>
                    </div>
                    <div class="profile-role" id="profileRole">普通用户</div>
                    <div class="profile-stats">
                        <div class="profile-stat">
                            <div class="profile-stat-value" id="statActivities">0</div>
                            <div class="profile-stat-label">活动</div>
                        </div>
                        <div class="profile-stat">
                            <div class="profile-stat-value" id="statKm">0</div>
                            <div class="profile-stat-label">公里</div>
                        </div>
                        <div class="profile-stat">
                            <div class="profile-stat-value" id="statPosts">0</div>
                            <div class="profile-stat-label">动态</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="profile-menu">
                <div class="profile-menu-item" data-action="my-activities">
                    <div class="profile-menu-icon">📅</div>
                    <div class="profile-menu-text">我的活动</div>
                    <div class="profile-menu-arrow">›</div>
                </div>
                <div class="profile-menu-item" data-action="my-posts">
                    <div class="profile-menu-icon">📝</div>
                    <div class="profile-menu-text">我的动态</div>
                    <div class="profile-menu-arrow">›</div>
                </div>
                <div class="profile-menu-item" data-action="reviews">
                    <div class="profile-menu-icon">⭐</div>
                    <div class="profile-menu-text">我的评价</div>
                    <div class="profile-menu-arrow">›</div>
                </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="profile-menu">
                <div class="profile-menu-item" data-action="edit-profile">
                    <div class="profile-menu-icon">⚙️</div>
                    <div class="profile-menu-text">编辑资料</div>
                    <div class="profile-menu-arrow">›</div>
                </div>
                <div class="profile-menu-item" data-action="settings">
                    <div class="profile-menu-icon">🔧</div>
                    <div class="profile-menu-text">设置</div>
                    <div class="profile-menu-arrow">›</div>
                </div>
            </div>
            
            <div class="settings-logout">
                <button class="btn btn-outline btn-block" id="logoutBtn">退出登录</button>
            </div>
            
            <div class="tabbar">
                <div class="tabbar-item" data-tab="home">
                    <div class="tabbar-icon">🏠</div>
                    <div class="tabbar-text">首页</div>
                </div>
                <div class="tabbar-item" data-tab="explore">
                    <div class="tabbar-icon">🔍</div>
                    <div class="tabbar-text">发现</div>
                </div>
                <div class="tabbar-item" data-tab="create">
                    <div class="tabbar-icon">➕</div>
                    <div class="tabbar-text">发布</div>
                </div>
                <div class="tabbar-item active" data-tab="profile">
                    <div class="tabbar-icon">👤</div>
                    <div class="tabbar-text">我的</div>
                </div>
            </div>
        </div>
    `,

    init() {
        this.loadUserInfo();
        this.initMenu();
        this.initTabbar();
        this.initLogout();
    },

    async loadUserInfo() {
        const user = AuthService.getUser();
        if (user) {
            this.renderUserInfo(user);
        }
        
        try {
            const result = await AuthService.getCurrentUser();
            if (result.code === 0 && result.data) {
                this.renderUserInfo(result.data);
            }
        } catch (error) {
            console.error('Load user info error:', error);
        }
    },

    renderUserInfo(user) {
        const avatarEl = document.getElementById('profileAvatar');
        const nameEl = document.getElementById('profileName');
        const levelEl = document.getElementById('profileLevel');
        const roleEl = document.getElementById('profileRole');
        const activitiesEl = document.getElementById('statActivities');
        const kmEl = document.getElementById('statKm');
        const postsEl = document.getElementById('statPosts');

        if (avatarEl) {
            avatarEl.textContent = user.avatar || user.nickname?.charAt(0) || '🧑';
        }
        if (nameEl) {
            nameEl.textContent = user.nickname || '用户';
        }
        if (levelEl) {
            levelEl.textContent = user.level || '萌新';
        }
        if (roleEl) {
            const roleText = this.getRoleText(user.role);
            roleEl.textContent = roleText;
        }
        if (activitiesEl) {
            activitiesEl.textContent = user.activity_count || 0;
        }
        if (kmEl) {
            kmEl.textContent = user.total_km || 0;
        }
        if (postsEl) {
            postsEl.textContent = user.post_count || 0;
        }
    },

    getRoleText(role) {
        const roles = {
            'normal': '普通用户',
            'leader': '领队',
            'admin': '管理员'
        };
        return roles[role] || '普通用户';
    },

    initMenu() {
        const menuItems = document.querySelectorAll('.profile-menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                this.handleMenuAction(action);
            });
        });
    },

    handleMenuAction(action) {
        switch (action) {
            case 'my-activities':
                Router.navigate('my-activities');
                break;
            case 'my-posts':
                Utils.showToast('功能开发中');
                break;
            case 'reviews':
                Utils.showToast('功能开发中');
                break;
            case 'edit-profile':
                Utils.showToast('功能开发中');
                break;
            case 'settings':
                Utils.showToast('功能开发中');
                break;
            default:
                break;
        }
    },

    initTabbar() {
        const tabbar = document.querySelector('.tabbar');
        tabbar.addEventListener('click', (e) => {
            const item = e.target.closest('.tabbar-item');
            if (item) {
                const tab = item.dataset.tab;
                if (tab !== 'profile') {
                    Router.navigate(tab);
                }
            }
        });
    },

    initLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn.addEventListener('click', async () => {
            Utils.showLoading();
            await AuthService.logout();
            Utils.hideLoading();
            Utils.showToast('已退出登录');
            Router.navigate('login');
        });
    }
};

const MyActivitiesPage = {
    name: 'my-activities',
    requiresAuth: true,
    template: `
        <div class="page has-header">
            <div class="header white">
                <div class="header-back" onclick="Router.back()">←</div>
                <div class="header-title">我的活动</div>
            </div>
            
            <div class="my-activities-tabs">
                <div class="my-activities-tab active" data-type="joined">已报名</div>
                <div class="my-activities-tab" data-type="organizer">我发起的</div>
                <div class="my-activities-tab" data-type="history">历史活动</div>
            </div>
            
            <div id="myActivityList" class="post-list"></div>
            <div id="myActivityEmpty" class="empty-state hidden">
                <div class="empty-state-icon">📅</div>
                <div class="empty-state-text">暂无活动记录</div>
                <div class="empty-state-actions">
                    <button class="btn btn-primary btn-sm" onclick="Router.navigate('create')">去发起活动</button>
                    <button class="btn btn-outline btn-sm" onclick="Router.navigate('explore')">去发现</button>
                </div>
            </div>
        </div>
    `,

    currentType: 'joined',

    init() {
        this.initTabs();
        this.loadActivities();
    },

    initTabs() {
        const tabs = document.querySelectorAll('.my-activities-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentType = tab.dataset.type;
                this.loadActivities();
            });
        });
    },

    async loadActivities() {
        const listEl = document.getElementById('myActivityList');
        const emptyEl = document.getElementById('myActivityEmpty');
        
        listEl.innerHTML = '';
        emptyEl.classList.add('hidden');
        
        try {
            const result = await ApiService.get('/yeyou/activity/list');
            
            if (result.code === 0 && result.data && result.data.length > 0) {
                const user = AuthService.getUser();
                const userId = user?.id;
                
                let filteredData = result.data;
                
                if (this.currentType === 'joined') {
                    filteredData = result.data.filter(a => 
                        a.status === 'recruiting' || a.status === 'active'
                    );
                } else if (this.currentType === 'organizer') {
                    filteredData = result.data.filter(a => 
                        a.organizer_id === userId || a.organizer?.id === userId
                    );
                } else if (this.currentType === 'history') {
                    filteredData = result.data.filter(a => 
                        a.status === 'ended' || a.status === 'cancelled'
                    );
                }
                
                if (filteredData.length > 0) {
                    listEl.innerHTML = filteredData.map(this.renderActivityItem).join('');
                    listEl.classList.remove('hidden');
                    emptyEl.classList.add('hidden');
                    this.bindEvents();
                } else {
                    listEl.classList.add('hidden');
                    emptyEl.classList.remove('hidden');
                }
            } else {
                listEl.classList.add('hidden');
                emptyEl.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Load activities error:', error);
            listEl.classList.add('hidden');
            emptyEl.classList.remove('hidden');
        }
    },

    renderActivityItem(activity) {
        const typeInfo = {
            hiking: { icon: '🥾', name: '徒步' },
            camping: { icon: '🏕️', name: '露营' },
            cycling: { icon: '🚴', name: '骑行' },
            picnic: { icon: '🧺', name: '野餐' },
            climbing: { icon: '🧗', name: '攀岩' },
            swimming: { icon: '🏊', name: '游泳' },
            skiing: { icon: '⛷️', name: '滑雪' },
            surfing: { icon: '🏄', name: '冲浪' }
        };
        
        const type = typeInfo[activity.type] || { icon: '🎒', name: '户外活动' };
        const startDate = activity.start_time ? activity.start_time.substring(0, 10) : '';
        const startTime = activity.start_time ? activity.start_time.substring(11, 16) : '';
        
        return `
            <div class="activity-item" data-id="${activity.id}">
                <div class="activity-header">
                    <div class="activity-type-icon">${type.icon}</div>
                    <div class="activity-title-wrap">
                        <div class="activity-title">${Utils.escapeHtml(activity.title)}</div>
                        <div class="activity-subtitle">
                            <span>${type.name}</span>
                            <span class="badge ${Utils.getStatusBadgeClass(activity.status)}">${Utils.getStatusText(activity.status)}</span>
                        </div>
                    </div>
                </div>
                <div class="activity-body">
                    <div class="activity-info-row">
                        <span class="activity-info-label">时间</span>
                        <span class="activity-info-value">${startDate} ${startTime}</span>
                    </div>
                    <div class="activity-info-row">
                        <span class="activity-info-label">地点</span>
                        <span class="activity-info-value">${Utils.escapeHtml(activity.location)}</span>
                    </div>
                    <div class="activity-info-row">
                        <span class="activity-info-label">人数</span>
                        <span class="activity-info-value">${activity.current_people || 0}/${activity.max_people}人</span>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        const items = document.querySelectorAll('.activity-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                Router.navigate('activity-detail', { id });
            });
        });
    }
};
