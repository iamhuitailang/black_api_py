const DiscoverPage = {
    currentPage: 1,
    pageSize: 10,
    currentCategory: null,
    keyword: '',
    hasMore: true,
    activities: [],
    categories: [],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <h1 class="header-title">发现活动</h1>
                </header>

                <div class="search-bar">
                    <div class="search-input-wrapper">
                        <span class="search-icon">🔍</span>
                        <input type="text" class="search-input" id="searchInput" placeholder="搜索活动、地点...">
                    </div>
                    <button class="search-btn" id="searchBtn">搜索</button>
                </div>

                <div class="tab-filter" id="categoryFilter">
                </div>

                <div class="activity-list" id="activityList">
                    <div class="empty-state">
                        <div class="empty-state-icon">🔍</div>
                        <div class="empty-state-text">搜索你感兴趣的活动</div>
                    </div>
                </div>

                ${Tabbar.render('discover')}
            </div>
        `;
        await this.loadCategories();
        this.bindEvents();
    },

    async loadCategories() {
        try {
            const result = await ApiService.get('/huodong/activity/categories/get');
            if (result.code === 0) {
                this.categories = [{ code: '', name: '全部', icon: '📋' }, ...(result.data || [])];
                const filter = document.getElementById('categoryFilter');
                filter.innerHTML = this.categories.map(cat => `
                    <div class="tab-filter-item ${cat.code === (this.currentCategory || '') ? 'active' : ''}" data-category="${cat.code}">
                        ${cat.name}
                    </div>
                `).join('');
                this.bindFilterEvents();
            }
        } catch (e) {
            console.error('加载分类失败:', e);
        }
    },

    bindEvents() {
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.keyword = document.getElementById('searchInput').value.trim();
            this.currentPage = 1;
            this.activities = [];
            this.hasMore = true;
            this.loadActivities();
        });

        document.getElementById('searchInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.keyword = e.target.value.trim();
                this.currentPage = 1;
                this.activities = [];
                this.hasMore = true;
                this.loadActivities();
            }
        });
    },

    bindFilterEvents() {
        document.querySelectorAll('.tab-filter-item').forEach(item => {
            item.addEventListener('click', () => {
                this.currentCategory = item.dataset.category || null;
                this.currentPage = 1;
                this.activities = [];
                this.hasMore = true;
                document.querySelectorAll('.tab-filter-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.loadActivities();
            });
        });
    },

    async loadActivities() {
        const list = document.getElementById('activityList');
        try {
            const params = {
                page: this.currentPage,
                page_size: this.pageSize,
                status: 1
            };
            if (this.currentCategory) params.category = this.currentCategory;
            if (this.keyword) params.keyword = this.keyword;
            const result = await ApiService.get('/huodong/activity/list/get', params);
            if (result.code === 0) {
                const newItems = result.data.items || [];
                if (newItems.length === 0 && this.currentPage === 1) {
                    list.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">🔍</div>
                            <div class="empty-state-text">没有找到相关活动</div>
                        </div>
                    `;
                    return;
                }
                if (newItems.length < this.pageSize) this.hasMore = false;
                if (this.currentPage === 1) {
                    this.activities = newItems;
                } else {
                    this.activities = [...this.activities, ...newItems];
                }
                list.innerHTML = this.activities.map(a => this.renderItem(a)).join('');
                if (!this.hasMore && this.activities.length > 0) {
                    list.innerHTML += `<div class="text-center" style="padding: 16px; color: var(--text-secondary); font-size: 12px;">没有更多了</div>`;
                }
                this.bindItemEvents();
            }
        } catch (e) {
            console.error('加载失败:', e);
        }
    },

    renderItem(activity) {
        const priceText = activity.is_free ? '免费' : activity.fee || '收费';
        return `
            <div class="activity-item" data-id="${activity.id}">
                <div class="activity-cover">${activity.category_icon || '🎉'}</div>
                <div class="activity-info">
                    <div>
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-meta">
                            <div class="activity-meta-row"><span>📍</span><span>${activity.location_name || '线上'}</span></div>
                            <div class="activity-meta-row"><span>🕐</span><span>${Utils.formatDateTime(activity.start_time)}</span></div>
                        </div>
                    </div>
                    <div class="activity-footer">
                        <span class="activity-participants">${activity.current_participants || 0}人参加</span>
                        <span class="activity-price ${activity.is_free ? 'text-primary' : ''}">${priceText}</span>
                    </div>
                </div>
            </div>
        `;
    },

    bindItemEvents() {
        document.querySelectorAll('.activity-item').forEach(item => {
            item.addEventListener('click', () => {
                Router.navigate('detail', { activity_id: item.dataset.id });
            });
        });
    }
};
