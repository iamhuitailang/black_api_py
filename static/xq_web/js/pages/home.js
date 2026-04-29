const HomePage = {
    currentPage: 1,
    pageSize: 10,
    currentType: 'all',
    currentCategory: null,
    keyword: '',
    hasMore: true,
    posts: [],
    categories: [
        { code: 'tools', name: '工具借用', icon: '🔧' },
        { code: 'errand', name: '跑腿帮忙', icon: '🏃' },
        { code: 'repair', name: '维修', icon: '🔨' },
        { code: 'care', name: '照顾', icon: '👶' },
        { code: 'study', name: '学习', icon: '📚' },
        { code: 'life', name: '生活', icon: '🏠' }
    ],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <h1 class="header-title">邻里互助</h1>
                </header>

                <div class="home-banner">
                    <h2 class="home-banner-title">🤝 邻里互助 · 小帮手</h2>
                    <p class="home-banner-subtitle">远亲不如近邻，让邻里之间互相帮助</p>
                </div>

                <div class="home-categories" id="categoryContainer">
                    ${this.renderCategories()}
                </div>

                <div class="home-tabs">
                    <div class="home-tab ${this.currentType === 'all' ? 'active' : ''}" data-type="all">全部</div>
                    <div class="home-tab ${this.currentType === 'need' ? 'active' : ''}" data-type="need">求助</div>
                    <div class="home-tab ${this.currentType === 'help' ? 'active' : ''}" data-type="help">提供帮助</div>
                </div>

                <div class="post-list" id="postList">
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <div class="empty-state-text">加载中...</div>
                    </div>
                </div>

                <button class="fab" onclick="Router.navigate('post')">+</button>

                ${Tabbar.render('home')}
            </div>
        `;

        this.bindEvents();
        this.currentPage = 1;
        this.currentType = 'all';
        this.currentCategory = null;
        this.hasMore = true;
        this.posts = [];
        await this.loadPosts();
    },

    renderCategories() {
        return this.categories.map(cat => `
            <div class="home-category" data-category="${cat.code}">
                <div class="home-category-icon">${cat.icon}</div>
                <div class="home-category-text">${cat.name}</div>
            </div>
        `).join('');
    },

    bindEvents() {
        document.querySelectorAll('.home-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentType = tab.dataset.type;
                this.currentPage = 1;
                this.hasMore = true;
                this.posts = [];
                this.updateTabs();
                this.loadPosts();
            });
        });

        document.querySelectorAll('.home-category').forEach(cat => {
            cat.addEventListener('click', () => {
                if (this.currentCategory === cat.dataset.category) {
                    this.currentCategory = null;
                } else {
                    this.currentCategory = cat.dataset.category;
                }
                this.currentPage = 1;
                this.hasMore = true;
                this.posts = [];
                this.updateCategories();
                this.loadPosts();
            });
        });
    },

    updateTabs() {
        document.querySelectorAll('.home-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.type === this.currentType);
        });
    },

    updateCategories() {
        document.querySelectorAll('.home-category').forEach(cat => {
            cat.classList.toggle('active', cat.dataset.category === this.currentCategory);
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

    async loadPosts() {
        const postList = document.getElementById('postList');

        try {
            const params = {
                page: this.currentPage,
                page_size: this.pageSize
            };

            if (this.currentType && this.currentType !== 'all') {
                params.type = this.currentType;
            }

            if (this.currentCategory) {
                params.category = this.currentCategory;
            }

            const result = await ApiService.get('/xq/post/list/get', params);

            if (result.code === 0) {
                const newPosts = result.data.items || [];

                if (newPosts.length === 0 && this.currentPage === 1) {
                    postList.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">📭</div>
                            <div class="empty-state-text">暂无内容，快来发布第一条吧</div>
                        </div>
                    `;
                    return;
                }

                if (newPosts.length < this.pageSize) {
                    this.hasMore = false;
                }

                if (this.currentPage === 1) {
                    this.posts = newPosts;
                } else {
                    this.posts = [...this.posts, ...newPosts];
                }

                postList.innerHTML = this.posts.map(post => this.renderPostItem(post)).join('');

                if (!this.hasMore && this.posts.length > 0) {
                    postList.innerHTML += `
                        <div class="text-center" style="padding: 16px; color: var(--text-secondary); font-size: 12px;">
                            没有更多了
                        </div>
                    `;
                }

                this.bindPostEvents();
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (error) {
            console.error('加载帖子列表失败:', error);
            if (this.currentPage === 1) {
                postList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">❌</div>
                        <div class="empty-state-text">加载失败，点击重试</div>
                    </div>
                `;
                postList.querySelector('.empty-state').onclick = () => this.loadPosts();
            }
        }
    },

    renderPostItem(post) {
        const publisher = post.publisher || {};
        const userInitial = (publisher.nickname || 'U').charAt(0).toUpperCase();
        const typeClass = post.type === 'need' ? 'badge-warning' : 'badge-info';

        return `
            <div class="post-item" data-id="${post.id}">
                <div class="post-header">
                    <div class="post-avatar">${userInitial}</div>
                    <div class="post-user-info">
                        <div class="post-username">${publisher.nickname || '用户' + (publisher.phone?.slice(-4) || '')}</div>
                        <div class="post-meta">${Utils.formatTime(post.created_at)}</div>
                    </div>
                    <div class="post-type">
                        <span class="badge ${typeClass}">${post.type_text}</span>
                    </div>
                </div>
                <div class="post-content">
                    <div class="post-title">${post.title}</div>
                    <div class="post-desc">${post.content}</div>
                </div>
                <div class="post-footer">
                    <div class="post-tags">
                        <span class="badge badge-secondary">${post.category_name}</span>
                    </div>
                    <div class="post-actions">
                        <div class="post-action">
                            <span>👁️</span>
                            <span>${post.view_count || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    bindPostEvents() {
        document.querySelectorAll('.post-item').forEach(item => {
            item.addEventListener('click', () => {
                const postId = item.dataset.id;
                Router.navigate('detail', { post_id: postId });
            });
        });
    }
};
