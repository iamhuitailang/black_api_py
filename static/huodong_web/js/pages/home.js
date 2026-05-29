const HomePage = {
    currentPage: 1,
    pageSize: 10,
    currentCategory: null,
    keyword: '',
    hasMore: true,
    activities: [],
    categories: [],
    featured: [],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page">
                <div class="home-banner">
                    <h2 class="home-banner-title">🎉 同城活动</h2>
                    <p class="home-banner-subtitle">发现身边精彩，遇见志同道合</p>
                </div>

                <div class="home-categories" id="categoryContainer">
                    加载中...
                </div>

                <div class="section-title">
                    <span>🔥 热门推荐</span>
                    <span class="section-title-more" onclick="Router.navigate('discover')">查看更多 ›</span>
                </div>
                <div class="featured-scroll" id="featuredContainer">
                </div>

                <div class="section-title">
                    <span>📋 最新活动</span>
                </div>

                <div class="activity-list" id="activityList">
                    <div class="empty-state">
                        <div class="empty-state-icon">🎉</div>
                        <div class="empty-state-text">加载中...</div>
                    </div>
                </div>

                ${Tabbar.render('home')}
            </div>
        `;
        await this.loadCategories();
        await this.loadFeatured();
        this.currentPage = 1;
        this.activities = [];
        this.hasMore = true;
        await this.loadActivities();
    },

    async loadCategories() {
        try {
            const result = await ApiService.get('/huodong/activity/categories/get');
            if (result.code === 0) {
                this.categories = result.data || [];
                const container = document.getElementById('categoryContainer');
                container.innerHTML = this.categories.map(cat => `
                    <div class="home-category" data-category="${cat.code}">
                        <div class="home-category-icon">${cat.icon}</div>
                        <div class="home-category-text">${cat.name}</div>
                    </div>
                `).join('');
                this.bindCategoryEvents();
            }
        } catch (e) {
            console.error('加载分类失败:', e);
        }
    },

    async loadFeatured() {
        try {
            const result = await ApiService.get('/huodong/activity/featured/get', { limit: 5 });
            if (result.code === 0) {
                this.featured = result.data || [];
                const container = document.getElementById('featuredContainer');
                if (this.featured.length === 0) {
                    container.innerHTML = '';
                    return;
                }
                container.innerHTML = this.featured.map(a => `
                    <div class="featured-card" data-id="${a.id}">
                        <div class="featured-cover">${a.category_icon || '🎉'}</div>
                        <div class="featured-info">
                            <div class="featured-title">${a.title}</div>
                            <div class="featured-meta">
                                <span>${a.category_name}</span>
                                <span>·</span>
                                <span>${a.current_participants || 0}人参加</span>
                            </div>
                        </div>
                    </div>
                `).join('');
                this.bindFeaturedEvents();
            }
        } catch (e) {
            console.error('加载推荐失败:', e);
        }
    },

    async loadActivities() {
        const list = document.getElementById('activityList');
        try {
            const params = {
                page: this.currentPage,
                page_size: this.pageSize,
                status: 1
            };
            if (this.currentCategory) {
                params.category = this.currentCategory;
            }
            if (this.keyword) {
                params.keyword = this.keyword;
            }
            const result = await ApiService.get('/huodong/activity/list/get', params);
            if (result.code === 0) {
                const newItems = result.data.items || [];
                if (newItems.length === 0 && this.currentPage === 1) {
                    list.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">🎉</div>
                            <div class="empty-state-text">暂无活动，快来发布第一个吧</div>
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
                list.innerHTML = this.activities.map(a => this.renderActivityItem(a)).join('');
                if (!this.hasMore && this.activities.length > 0) {
                    list.innerHTML += `<div class="text-center" style="padding: 16px; color: var(--text-secondary); font-size: 12px;">没有更多了</div>`;
                }
                this.bindActivityEvents();
            }
        } catch (e) {
            console.error('加载活动失败:', e);
        }
    },

    renderActivityItem(activity) {
        const priceText = activity.is_free ? '免费' : activity.fee || '收费';
        const priceClass = activity.is_free ? 'text-primary' : '';
        return `
            <div class="activity-item" data-id="${activity.id}">
                <div class="activity-cover">${activity.category_icon || '🎉'}</div>
                <div class="activity-info">
                    <div>
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-meta">
                            <div class="activity-meta-row">
                                <span>📍</span>
                                <span>${activity.location_name || '线上'}</span>
                            </div>
                            <div class="activity-meta-row">
                                <span>🕐</span>
                                <span>${Utils.formatDateTime(activity.start_time)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="activity-footer">
                        <span class="activity-participants">${activity.current_participants || 0}人参加</span>
                        <span class="activity-price ${priceClass}">${priceText}</span>
                    </div>
                </div>
            </div>
        `;
    },

    bindCategoryEvents() {
        document.querySelectorAll('.home-category').forEach(cat => {
            cat.addEventListener('click', () => {
                const code = cat.dataset.category;
                if (this.currentCategory === code) {
                    this.currentCategory = null;
                } else {
                    this.currentCategory = code;
                }
                this.currentPage = 1;
                this.hasMore = true;
                this.activities = [];
                this.updateCategoryStyle();
                this.loadActivities();
            });
        });
    },

    updateCategoryStyle() {
        document.querySelectorAll('.home-category').forEach(cat => {
            const icon = cat.querySelector('.home-category-icon');
            if (cat.dataset.category === this.currentCategory) {
                icon.style.backgroundColor = 'var(--primary-color)';
                icon.style.color = 'white';
            } else {
                icon.style.backgroundColor = 'var(--primary-light)';
                icon.style.color = 'var(--primary-color)';
            }
        });
    },

    bindFeaturedEvents() {
        document.querySelectorAll('.featured-card').forEach(card => {
            card.addEventListener('click', () => {
                Router.navigate('detail', { activity_id: card.dataset.id });
            });
        });
    },

    bindActivityEvents() {
        document.querySelectorAll('.activity-item').forEach(item => {
            item.addEventListener('click', () => {
                Router.navigate('detail', { activity_id: item.dataset.id });
            });
        });
    }
};
