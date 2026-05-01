const HomePage = {
    name: 'home',
    requiresAuth: true,
    template: `
        <div class="page">
            <div class="home-banner">
                <div class="home-banner-title">今天去哪儿玩？</div>
                <div class="home-banner-subtitle">发现精彩活动，探索户外世界</div>
            </div>
            
            <div class="home-categories" id="homeCategories">
            </div>
            
            <div class="home-tabs">
                <div class="home-tab active" data-tab="activities">活动</div>
                <div class="home-tab" data-tab="posts">动态</div>
            </div>
            
            <div id="activitiesContent">
                <div id="activitiesList" class="post-list"></div>
                <div id="activitiesEmpty" class="empty-state hidden">
                    <div class="empty-state-icon">🏕️</div>
                    <div class="empty-state-text">暂无活动</div>
                    <div class="empty-state-sub">快来发起第一个活动吧</div>
                    <div class="empty-state-actions">
                        <button class="btn btn-primary btn-sm" onclick="Router.navigate('create')">发起活动</button>
                    </div>
                </div>
            </div>
            
            <div id="postsContent" class="hidden">
                <div id="postsList" class="post-list"></div>
                <div id="postsEmpty" class="empty-state hidden">
                    <div class="empty-state-icon">📷</div>
                    <div class="empty-state-text">暂无动态</div>
                    <div class="empty-state-sub">快来分享你的户外故事</div>
                </div>
            </div>
            
            <button class="fab" id="fabCreate" onclick="Router.navigate('create')">+</button>
            
            <div class="tabbar">
                <div class="tabbar-item active" data-tab="home">
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
                <div class="tabbar-item" data-tab="profile">
                    <div class="tabbar-icon">👤</div>
                    <div class="tabbar-text">我的</div>
                </div>
            </div>
        </div>
    `,

    currentTab: 'activities',

    categories: [
        { type: 'hiking', icon: '🥾', name: '徒步' },
        { type: 'camping', icon: '🏕️', name: '露营' },
        { type: 'cycling', icon: '🚴', name: '骑行' },
        { type: 'picnic', icon: '🧺', name: '野餐' },
        { type: 'climbing', icon: '🧗', name: '攀岩' },
        { type: 'swimming', icon: '🏊', name: '游泳' },
        { type: 'skiing', icon: '⛷️', name: '滑雪' },
        { type: 'surfing', icon: '🏄', name: '冲浪' }
    ],

    init() {
        this.initCategories();
        this.initTabs();
        this.initTabbar();
        this.loadActivities();
        this.loadPosts();
    },

    initCategories() {
        const container = document.getElementById('homeCategories');
        container.innerHTML = this.categories.map(cat => `
            <div class="home-category" data-type="${cat.type}">
                <div class="home-category-icon">${cat.icon}</div>
                <div class="home-category-text">${cat.name}</div>
            </div>
        `).join('');

        container.addEventListener('click', (e) => {
            const category = e.target.closest('.home-category');
            if (category) {
                const type = category.dataset.type;
                Router.navigate('explore', { type });
            }
        });
    },

    initTabs() {
        const tabs = document.querySelectorAll('.home-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabType = tab.dataset.tab;
                this.switchTab(tabType);
            });
        });
    },

    switchTab(tabType) {
        this.currentTab = tabType;
        const tabs = document.querySelectorAll('.home-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabType);
        });
        
        document.getElementById('activitiesContent').classList.toggle('hidden', tabType !== 'activities');
        document.getElementById('postsContent').classList.toggle('hidden', tabType !== 'posts');
    },

    initTabbar() {
        const tabbar = document.querySelector('.tabbar');
        tabbar.addEventListener('click', (e) => {
            const item = e.target.closest('.tabbar-item');
            if (item) {
                const tab = item.dataset.tab;
                if (tab !== 'home') {
                    Router.navigate(tab);
                }
            }
        });
    },

    async loadActivities() {
        const listEl = document.getElementById('activitiesList');
        const emptyEl = document.getElementById('activitiesEmpty');
        
        try {
            const result = await ApiService.get('/yeyou/activity/list');
            
            if (result.code === 0 && result.data && result.data.length > 0) {
                listEl.innerHTML = result.data.map(this.renderActivityItem).join('');
                listEl.classList.remove('hidden');
                emptyEl.classList.add('hidden');
                this.bindActivityEvents();
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
                        <span class="activity-info-label">难度</span>
                        <span class="activity-info-value">${Utils.getDifficultyText(activity.difficulty)}</span>
                    </div>
                </div>
                <div class="activity-footer">
                    <div class="activity-count">
                        <span><strong>${activity.current_people || 0}</strong>/${activity.max_people}人</span>
                    </div>
                    <span class="text-secondary">
                        ${activity.cost === 0 ? '免费' : '¥' + activity.cost + '（AA）'}
                    </span>
                </div>
            </div>
        `;
    },

    bindActivityEvents() {
        const items = document.querySelectorAll('.activity-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                Router.navigate('activity-detail', { id });
            });
        });
    },

    async loadPosts() {
        const listEl = document.getElementById('postsList');
        const emptyEl = document.getElementById('postsEmpty');
        
        try {
            const result = await ApiService.get('/yeyou/post/list');
            
            if (result.code === 0 && result.data && result.data.length > 0) {
                listEl.innerHTML = result.data.map(this.renderPostItem).join('');
                listEl.classList.remove('hidden');
                emptyEl.classList.add('hidden');
                this.bindPostEvents();
            } else {
                listEl.classList.add('hidden');
                emptyEl.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Load posts error:', error);
            listEl.classList.add('hidden');
            emptyEl.classList.remove('hidden');
        }
    },

    renderPostItem(post) {
        const user = post.user || {};
        const avatar = user.avatar || user.nickname?.charAt(0) || '🧑';
        const nickname = user.nickname || '用户' + (user.id || '');
        const createdAt = post.created_at ? Utils.formatDate(post.created_at) : '';
        
        let imagesHtml = '';
        if (post.images) {
            try {
                const images = JSON.parse(post.images);
                if (images && images.length > 0) {
                    imagesHtml = '<div class="post-images">';
                    images.slice(0, 3).forEach(img => {
                        imagesHtml += `<div class="post-image" style="background-image: url('${img}')"></div>`;
                    });
                    if (images.length > 3) {
                        imagesHtml += `<div class="post-image" style="display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.05);">+${images.length - 3}</div>`;
                    }
                    imagesHtml += '</div>';
                }
            } catch (e) {
                // ignore json parse error
            }
        }
        
        return `
            <div class="post-item" data-id="${post.id}">
                <div class="post-header">
                    <div class="post-avatar">${avatar}</div>
                    <div class="post-user-info">
                        <div class="post-username">${Utils.escapeHtml(nickname)}</div>
                        <div class="post-meta">
                            <span>${createdAt}</span>
                            ${post.activity_id ? '<span class="badge badge-info">来自活动</span>' : ''}
                        </div>
                    </div>
                </div>
                <div class="post-content">
                    <div class="post-desc">${Utils.escapeHtml(post.content || '')}</div>
                </div>
                ${imagesHtml}
                <div class="post-footer">
                    <div class="post-actions">
                        <div class="post-action">
                            <span class="post-action-icon">❤️</span>
                            <span>${post.like_count || 0}</span>
                        </div>
                        <div class="post-action">
                            <span class="post-action-icon">💬</span>
                            <span>0</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    bindPostEvents() {
        const items = document.querySelectorAll('.post-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                Router.navigate('post-detail', { id });
            });
        });
    }
};
