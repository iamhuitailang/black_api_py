const ExplorePage = {
    name: 'explore',
    requiresAuth: true,
    template: `
        <div class="page has-header">
            <div class="header">
                <div class="header-title">发现</div>
            </div>
            
            <div class="search-bar">
                <div class="search-input-wrapper">
                    <span class="search-icon">🔍</span>
                    <input type="text" class="search-input" id="searchInput" placeholder="搜索活动、地点...">
                </div>
                <button class="search-btn" id="searchBtn">搜索</button>
            </div>
            
            <div class="filter-tabs" id="filterTabs">
                <div class="filter-tab active" data-type="">全部</div>
                <div class="filter-tab" data-type="hiking">🥾 徒步</div>
                <div class="filter-tab" data-type="camping">🏕️ 露营</div>
                <div class="filter-tab" data-type="cycling">🚴 骑行</div>
                <div class="filter-tab" data-type="picnic">🧺 野餐</div>
                <div class="filter-tab" data-type="climbing">🧗 攀岩</div>
            </div>
            
            <div id="activityList" class="post-list"></div>
            <div id="activityEmpty" class="empty-state hidden">
                <div class="empty-state-icon">🔍</div>
                <div class="empty-state-text">暂无相关活动</div>
                <div class="empty-state-sub">换个条件试试</div>
            </div>
            
            <div class="tabbar">
                <div class="tabbar-item" data-tab="home">
                    <div class="tabbar-icon">🏠</div>
                    <div class="tabbar-text">首页</div>
                </div>
                <div class="tabbar-item active" data-tab="explore">
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

    currentType: '',
    currentKeyword: '',

    init(params) {
        if (params && params.type) {
            this.currentType = params.type;
        }
        
        this.initFilterTabs();
        this.initTabbar();
        this.initSearch();
        this.loadActivities();
    },

    initFilterTabs() {
        const tabs = document.querySelectorAll('.filter-tab');
        tabs.forEach(tab => {
            if (tab.dataset.type === this.currentType) {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            }
            
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentType = tab.dataset.type;
                this.loadActivities();
            });
        });
    },

    initSearch() {
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');
        
        searchBtn.addEventListener('click', () => {
            this.currentKeyword = searchInput.value.trim();
            this.loadActivities();
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.currentKeyword = searchInput.value.trim();
                this.loadActivities();
            }
        });
    },

    initTabbar() {
        const tabbar = document.querySelector('.tabbar');
        tabbar.addEventListener('click', (e) => {
            const item = e.target.closest('.tabbar-item');
            if (item) {
                const tab = item.dataset.tab;
                if (tab !== 'explore') {
                    Router.navigate(tab);
                }
            }
        });
    },

    async loadActivities() {
        const listEl = document.getElementById('activityList');
        const emptyEl = document.getElementById('activityEmpty');
        
        try {
            const params = {};
            if (this.currentType) {
                params.type = this.currentType;
            }
            
            const result = await ApiService.get('/yeyou/activity/list', params);
            
            if (result.code === 0 && result.data && result.data.length > 0) {
                let data = result.data;
                
                if (this.currentKeyword) {
                    const keyword = this.currentKeyword.toLowerCase();
                    data = data.filter(item => {
                        const title = (item.title || '').toLowerCase();
                        const location = (item.location || '').toLowerCase();
                        return title.includes(keyword) || location.includes(keyword);
                    });
                }
                
                if (data.length > 0) {
                    listEl.innerHTML = data.map(this.renderActivityItem).join('');
                    listEl.classList.remove('hidden');
                    emptyEl.classList.add('hidden');
                    this.bindActivityEvents();
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
    }
};

const ActivityDetailPage = {
    name: 'activity-detail',
    requiresAuth: true,
    template: `
        <div class="page has-header no-tabbar activity-detail">
            <div class="header white">
                <div class="header-back" onclick="Router.back()">←</div>
                <div class="header-title">活动详情</div>
            </div>
            
            <div id="activityContent">
                <div class="empty-state">
                    <div class="empty-state-icon">🔄</div>
                    <div class="empty-state-text">加载中...</div>
                </div>
            </div>
            
            <div class="activity-detail-footer hidden" id="activityFooter">
            </div>
        </div>
    `,

    activityId: null,
    activityData: null,
    registrationStatus: null,

    init(params) {
        if (!params || !params.id) {
            Utils.showToast('参数错误');
            Router.back();
            return;
        }
        
        this.activityId = params.id;
        this.loadActivity();
    },

    async loadActivity() {
        try {
            const result = await ApiService.get('/yeyou/activity/detail', { id: this.activityId });
            
            if (result.code === 0 && result.data) {
                this.activityData = result.data;
                this.checkRegistrationStatus();
            } else {
                Utils.showToast(result.msg || '加载失败');
                Router.back();
            }
        } catch (error) {
            console.error('Load activity error:', error);
            Utils.showToast('网络错误');
            Router.back();
        }
    },

    async checkRegistrationStatus() {
        try {
            const result = await ApiService.get('/yeyou/activity/registration/status', { activity_id: this.activityId });
            if (result.code === 0) {
                this.registrationStatus = result.data;
            }
        } catch (e) {
            console.error('Check registration status error:', e);
        }
        
        this.renderActivity();
    },

    renderActivity() {
        const contentEl = document.getElementById('activityContent');
        const footerEl = document.getElementById('activityFooter');
        
        const activity = this.activityData;
        const organizer = activity.organizer || {};
        const participants = activity.participants || [];
        
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
        
        const currentUser = AuthService.getUser();
        const isOrganizer = currentUser && currentUser.id === activity.organizer_id;
        
        contentEl.innerHTML = `
            <div class="activity-detail-header">
                <div class="activity-detail-tags">
                    <span class="badge badge-nature">${type.icon} ${type.name}</span>
                    <span class="badge ${Utils.getDifficultyBadgeClass(activity.difficulty)}">${Utils.getDifficultyText(activity.difficulty)}</span>
                    <span class="badge ${Utils.getStatusBadgeClass(activity.status)}">${Utils.getStatusText(activity.status)}</span>
                </div>
                <div class="activity-detail-title">${Utils.escapeHtml(activity.title)}</div>
                <div class="activity-detail-info">
                    <div class="activity-detail-info-row">
                        <span class="activity-detail-info-label">时间</span>
                        <span class="activity-detail-info-value">${startDate} ${startTime}</span>
                    </div>
                    <div class="activity-detail-info-row">
                        <span class="activity-detail-info-label">地点</span>
                        <span class="activity-detail-info-value">${Utils.escapeHtml(activity.location)}</span>
                    </div>
                    <div class="activity-detail-info-row">
                        <span class="activity-detail-info-label">人数</span>
                        <span class="activity-detail-info-value">${activity.current_people || 0}/${activity.max_people}人</span>
                    </div>
                    <div class="activity-detail-info-row">
                        <span class="activity-detail-info-label">费用</span>
                        <span class="activity-detail-info-value">${activity.cost === 0 ? '免费' : '¥' + activity.cost + '（AA）'}</span>
                    </div>
                    ${organizer.nickname ? `
                    <div class="activity-detail-info-row">
                        <span class="activity-detail-info-label">发起人</span>
                        <span class="activity-detail-info-value">${Utils.escapeHtml(organizer.nickname)}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            ${activity.route_desc ? `
            <div class="activity-detail-section">
                <div class="activity-detail-section-title">📝 路线描述</div>
                <div class="activity-detail-content">${Utils.escapeHtml(activity.route_desc)}</div>
            </div>
            ` : ''}
            
            ${participants.length > 0 ? `
            <div class="activity-detail-section">
                <div class="activity-detail-section-title">👥 已报名成员 (${participants.length})</div>
                <div class="activity-detail-participants">
                    ${participants.map(p => `
                        <div class="participant-item">
                            <div class="participant-avatar ${p.status === 'checked_in' ? 'checked-in' : ''}">
                                ${p.user?.avatar || p.user?.nickname?.charAt(0) || '🧑'}
                            </div>
                            <div class="participant-name">${p.user?.nickname || '用户'}</div>
                            ${p.status === 'checked_in' ? '<div class="badge badge-success" style="margin-top:4px;padding:2px 6px;font-size:10px;">已签到</div>' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        `;
        
        footerEl.classList.remove('hidden');
        
        if (isOrganizer) {
            footerEl.innerHTML = this.renderOrganizerFooter(activity);
        } else {
            footerEl.innerHTML = this.renderUserFooter(activity);
        }
        
        this.bindFooterEvents();
    },

    renderOrganizerFooter(activity) {
        const isRecruiting = activity.status === 'recruiting';
        const isActive = activity.status === 'active';
        
        let actions = [];
        
        if (isRecruiting) {
            actions.push(`<button class="btn btn-outline" id="startActivityBtn">开始活动</button>`);
            actions.push(`<button class="btn btn-danger" id="cancelActivityBtn">取消活动</button>`);
        } else if (isActive) {
            actions.push(`<button class="btn btn-primary btn-block" id="endActivityBtn">结束活动</button>`);
        } else {
            actions.push(`<button class="btn btn-secondary btn-block" disabled>活动已${Utils.getStatusText(activity.status)}</button>`);
        }
        
        return actions.join('');
    },

    renderUserFooter(activity) {
        const isRecruiting = activity.status === 'recruiting';
        const isActive = activity.status === 'active';
        const isFull = activity.current_people >= activity.max_people;
        
        if (this.registrationStatus) {
            if (this.registrationStatus.status === 'joined') {
                if (isActive) {
                    if (this.registrationStatus.is_checked_in) {
                        return `<button class="btn btn-secondary btn-block" disabled>✓ 已签到</button>`;
                    }
                    return `<button class="btn btn-primary btn-block" id="checkInBtn">签到</button>`;
                } else if (isRecruiting) {
                    return `<button class="btn btn-outline btn-block" id="cancelRegisterBtn">取消报名</button>`;
                } else {
                    return `<button class="btn btn-secondary btn-block" disabled>已报名</button>`;
                }
            } else if (this.registrationStatus.status === 'checked_in') {
                return `<button class="btn btn-secondary btn-block" disabled>✓ 已签到</button>`;
            }
        }
        
        if (isRecruiting && !isFull) {
            return `<button class="btn btn-primary btn-block" id="registerBtn">立即报名</button>`;
        } else if (isRecruiting && isFull) {
            return `<button class="btn btn-secondary btn-block" disabled>名额已满</button>`;
        } else {
            return `<button class="btn btn-secondary btn-block" disabled>活动已${Utils.getStatusText(activity.status)}</button>`;
        }
    },

    bindFooterEvents() {
        const currentUser = AuthService.getUser();
        const isOrganizer = currentUser && currentUser.id === this.activityData.organizer_id;
        
        if (isOrganizer) {
            const startBtn = document.getElementById('startActivityBtn');
            const cancelBtn = document.getElementById('cancelActivityBtn');
            const endBtn = document.getElementById('endActivityBtn');
            
            if (startBtn) {
                startBtn.addEventListener('click', () => this.startActivity());
            }
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.cancelActivity());
            }
            if (endBtn) {
                endBtn.addEventListener('click', () => this.endActivity());
            }
        } else {
            const registerBtn = document.getElementById('registerBtn');
            const cancelRegisterBtn = document.getElementById('cancelRegisterBtn');
            const checkInBtn = document.getElementById('checkInBtn');
            
            if (registerBtn) {
                registerBtn.addEventListener('click', () => this.registerActivity());
            }
            if (cancelRegisterBtn) {
                cancelRegisterBtn.addEventListener('click', () => this.cancelRegistration());
            }
            if (checkInBtn) {
                checkInBtn.addEventListener('click', () => this.checkIn());
            }
        }
    },

    async registerActivity() {
        Utils.showLoading();
        try {
            const result = await ApiService.post('/yeyou/activity/registration/create', {
                activity_id: parseInt(this.activityId)
            });
            Utils.hideLoading();
            
            if (result.code === 0) {
                Utils.showToast('报名成功');
                this.registrationStatus = { status: 'joined' };
                this.renderActivity();
            } else {
                Utils.showToast(result.msg || '报名失败');
            }
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast('网络错误');
            console.error('Register error:', error);
        }
    },

    async cancelRegistration() {
        Utils.showLoading();
        try {
            const result = await ApiService.post('/yeyou/activity/registration/cancel', {
                activity_id: parseInt(this.activityId)
            });
            Utils.hideLoading();
            
            if (result.code === 0) {
                Utils.showToast('已取消报名');
                this.registrationStatus = null;
                this.renderActivity();
            } else {
                Utils.showToast(result.msg || '取消失败');
            }
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast('网络错误');
            console.error('Cancel registration error:', error);
        }
    },

    async checkIn() {
        Utils.showLoading();
        try {
            const result = await ApiService.post('/yeyou/activity/registration/checkin', {
                activity_id: parseInt(this.activityId)
            });
            Utils.hideLoading();
            
            if (result.code === 0) {
                Utils.showToast('签到成功');
                this.registrationStatus = { status: 'checked_in', is_checked_in: true };
                this.renderActivity();
            } else {
                Utils.showToast(result.msg || '签到失败');
            }
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast('网络错误');
            console.error('Checkin error:', error);
        }
    },

    async startActivity() {
        Utils.showLoading();
        try {
            const result = await ApiService.post('/yeyou/activity/start', {
                activity_id: parseInt(this.activityId)
            });
            Utils.hideLoading();
            
            if (result.code === 0) {
                Utils.showToast('活动已开始');
                this.activityData.status = 'active';
                this.renderActivity();
            } else {
                Utils.showToast(result.msg || '操作失败');
            }
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast('网络错误');
            console.error('Start activity error:', error);
        }
    },

    async cancelActivity() {
        Utils.showLoading();
        try {
            const result = await ApiService.post('/yeyou/activity/cancel', {
                activity_id: parseInt(this.activityId)
            });
            Utils.hideLoading();
            
            if (result.code === 0) {
                Utils.showToast('活动已取消');
                this.activityData.status = 'cancelled';
                this.renderActivity();
            } else {
                Utils.showToast(result.msg || '操作失败');
            }
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast('网络错误');
            console.error('Cancel activity error:', error);
        }
    },

    async endActivity() {
        Utils.showLoading();
        try {
            const result = await ApiService.post('/yeyou/activity/end', {
                activity_id: parseInt(this.activityId)
            });
            Utils.hideLoading();
            
            if (result.code === 0) {
                Utils.showToast('活动已结束');
                this.activityData.status = 'ended';
                this.renderActivity();
            } else {
                Utils.showToast(result.msg || '操作失败');
            }
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast('网络错误');
            console.error('End activity error:', error);
        }
    }
};

const CreatePage = {
    name: 'create',
    requiresAuth: true,
    template: `
        <div class="page has-header no-tabbar create-page">
            <div class="header white">
                <div class="header-back" onclick="Router.back()">←</div>
                <div class="header-title">发起活动</div>
                <div class="header-action" id="submitBtn">发布</div>
            </div>
            
            <div class="type-picker" id="typePicker">
                <div class="type-picker-item active" data-type="hiking">🥾 徒步</div>
                <div class="type-picker-item" data-type="camping">🏕️ 露营</div>
                <div class="type-picker-item" data-type="cycling">🚴 骑行</div>
                <div class="type-picker-item" data-type="picnic">🧺 野餐</div>
                <div class="type-picker-item" data-type="climbing">🧗 攀岩</div>
            </div>
            
            <div class="card" style="margin:12px;">
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label">活动标题</label>
                        <input type="text" class="form-control" id="activityTitle" placeholder="给活动起个吸引人的标题">
                    </div>
                </div>
            </div>
            
            <div class="card" style="margin:12px;">
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label">难度等级</label>
                        <div class="difficulty-picker">
                            <div class="difficulty-picker-item active" data-difficulty="easy">
                                <div class="difficulty-picker-text">初级</div>
                            </div>
                            <div class="difficulty-picker-item" data-difficulty="medium">
                                <div class="difficulty-picker-text">中级</div>
                            </div>
                            <div class="difficulty-picker-item" data-difficulty="hard">
                                <div class="difficulty-picker-text">高级</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card" style="margin:12px;">
                <div class="card-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">集合时间</label>
                            <input type="datetime-local" class="form-control" id="activityTime">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">集合地点</label>
                        <input type="text" class="form-control" id="activityLocation" placeholder="输入集合地点">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">人数上限</label>
                            <input type="number" class="form-control" id="maxPeople" placeholder="最多多少人" min="2" value="20">
                        </div>
                        <div class="form-group">
                            <label class="form-label">费用</label>
                            <input type="number" class="form-control" id="activityCost" placeholder="AA费用(元)" min="0" value="0">
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card" style="margin:12px;">
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label">路线描述</label>
                        <textarea class="form-control" id="activityDesc" placeholder="描述一下活动路线、注意事项..."></textarea>
                    </div>
                </div>
            </div>
        </div>
    `,

    selectedType: 'hiking',
    selectedDifficulty: 'easy',

    init() {
        this.initTypePicker();
        this.initDifficultyPicker();
        this.initSubmit();
        this.setDefaultTime();
    },

    initTypePicker() {
        const picker = document.getElementById('typePicker');
        const items = picker.querySelectorAll('.type-picker-item');
        
        items.forEach(item => {
            item.addEventListener('click', () => {
                items.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.selectedType = item.dataset.type;
            });
        });
    },

    initDifficultyPicker() {
        const items = document.querySelectorAll('.difficulty-picker-item');
        
        items.forEach(item => {
            item.addEventListener('click', () => {
                items.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.selectedDifficulty = item.dataset.difficulty;
            });
        });
    },

    setDefaultTime() {
        const input = document.getElementById('activityTime');
        const now = new Date();
        now.setHours(now.getHours() + 24);
        now.setMinutes(0);
        now.setSeconds(0);
        
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        input.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    },

    initSubmit() {
        const submitBtn = document.getElementById('submitBtn');
        
        submitBtn.addEventListener('click', async () => {
            const title = document.getElementById('activityTitle').value.trim();
            const startTime = document.getElementById('activityTime').value;
            const location = document.getElementById('activityLocation').value.trim();
            const maxPeople = parseInt(document.getElementById('maxPeople').value) || 20;
            const cost = parseFloat(document.getElementById('activityCost').value) || 0;
            const routeDesc = document.getElementById('activityDesc').value.trim();
            
            if (!title) {
                Utils.showToast('请输入活动标题');
                return;
            }
            if (title.length < 5) {
                Utils.showToast('标题至少5个字符');
                return;
            }
            if (!startTime) {
                Utils.showToast('请选择集合时间');
                return;
            }
            if (!location) {
                Utils.showToast('请输入集合地点');
                return;
            }
            
            const startTimeObj = new Date(startTime);
            const now = new Date();
            if (startTimeObj <= now) {
                Utils.showToast('集合时间必须晚于当前时间');
                return;
            }
            
            Utils.showLoading();
            try {
                const result = await ApiService.post('/yeyou/activity/create', {
                    title: title,
                    type: this.selectedType,
                    difficulty: this.selectedDifficulty,
                    start_time: startTime,
                    location: location,
                    location_lng: 116.3975,
                    location_lat: 39.9085,
                    max_people: maxPeople,
                    cost: cost,
                    route_desc: routeDesc
                });
                Utils.hideLoading();
                
                if (result.code === 0) {
                    Utils.showToast('发布成功');
                    Router.navigate('activity-detail', { id: result.data.id });
                } else {
                    Utils.showToast(result.msg || '发布失败');
                }
            } catch (error) {
                Utils.hideLoading();
                Utils.showToast('网络错误');
                console.error('Create activity error:', error);
            }
        });
    }
};
