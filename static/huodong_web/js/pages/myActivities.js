const MyActivitiesPage = {
    currentPage: 1,
    pageSize: 10,
    currentTab: 'published',
    activities: [],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <span class="header-back" onclick="Router.back()">←</span>
                    <h1 class="header-title">我的活动</h1>
                </header>

                <div class="tab-filter">
                    <div class="tab-filter-item ${this.currentTab === 'published' ? 'active' : ''}" data-tab="published">我发布的</div>
                    <div class="tab-filter-item ${this.currentTab === 'registered' ? 'active' : ''}" data-tab="registered">我参与的</div>
                </div>

                <div id="activityList">
                    <div class="empty-state"><div class="empty-state-icon">⏳</div><div class="empty-state-text">加载中...</div></div>
                </div>

                ${Tabbar.render('profile')}
            </div>
        `;
        this.bindEvents();
        await this.loadData();
    },

    bindEvents() {
        document.querySelectorAll('.tab-filter-item').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentTab = tab.dataset.tab;
                this.currentPage = 1;
                this.activities = [];
                document.querySelectorAll('.tab-filter-item').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.loadData();
            });
        });
    },

    async loadData() {
        const list = document.getElementById('activityList');
        try {
            let result;
            if (this.currentTab === 'published') {
                result = await ApiService.get('/huodong/activity/my/list/get', {
                    page: this.currentPage, page_size: this.pageSize
                });
                if (result.code === 0) {
                    this.activities = result.data.items || [];
                    if (this.activities.length === 0) {
                        list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">还没有发布活动</div></div>';
                        return;
                    }
                    list.innerHTML = this.activities.map(a => `
                        <div class="activity-item" data-id="${a.id}">
                            <div class="activity-cover">${a.category_icon || '🎉'}</div>
                            <div class="activity-info">
                                <div>
                                    <div class="activity-title">${a.title}</div>
                                    <div class="activity-meta">
                                        <div class="activity-meta-row"><span>📅</span><span>${Utils.formatDateTime(a.start_time)}</span></div>
                                    </div>
                                </div>
                                <div class="activity-footer">
                                    <span class="badge ${Utils.getStatusClass(a.status)}">${Utils.getStatusText(a.status)}</span>
                                    <span class="activity-participants">${a.current_participants || 0}人</span>
                                </div>
                            </div>
                        </div>
                    `).join('');
                }
            } else {
                result = await ApiService.get('/huodong/registration/my/list/get', {
                    page: this.currentPage, page_size: this.pageSize
                });
                if (result.code === 0) {
                    const items = result.data.items || [];
                    if (items.length === 0) {
                        list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">还没有参与活动</div></div>';
                        return;
                    }
                    list.innerHTML = items.map(item => {
                        const a = item.activity || {};
                        return `
                            <div class="activity-item" data-id="${a.id}">
                                <div class="activity-cover">${a.category_icon || '🎉'}</div>
                                <div class="activity-info">
                                    <div>
                                        <div class="activity-title">${a.title}</div>
                                        <div class="activity-meta">
                                            <div class="activity-meta-row"><span>📅</span><span>${Utils.formatDateTime(a.start_time)}</span></div>
                                        </div>
                                    </div>
                                    <div class="activity-footer">
                                        <span class="badge ${Utils.getStatusClass(a.status)}">${Utils.getStatusText(a.status)}</span>
                                        <span class="badge ${item.status === 1 ? 'badge-success' : 'badge-secondary'}">${item.status_text}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            }
            document.querySelectorAll('.activity-item').forEach(item => {
                item.addEventListener('click', () => {
                    Router.navigate('detail', { activity_id: item.dataset.id });
                });
            });
        } catch (e) {
            console.error('加载失败:', e);
        }
    }
};
