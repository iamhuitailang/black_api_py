const HomePage = {
    currentPage: 1,
    pageSize: 10,
    currentType: 'all',
    currentCategory: null,
    keyword: '',
    hasMore: true,
    posts: [],
    categories: [],
    stats: { lost: 0, found: 0, claimed: 0 },

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                ${Header.render('校园失物招领', false, '<button onclick="Router.navigate(\'post\')">+</button>')}

                <div class="hero-section">
                    <h1 class="hero-title">🔍 校园失物招领平台</h1>
                    <p class="hero-subtitle">帮助同学们找回丢失的物品，共建和谐校园</p>
                    <div class="hero-stats">
                        <div class="hero-stat">
                            <div class="number" id="statLost">0</div>
                            <div class="label">寻物启事</div>
                        </div>
                        <div class="hero-stat">
                            <div class="number" id="statFound">0</div>
                            <div class="label">招领启事</div>
                        </div>
                        <div class="hero-stat">
                            <div class="number" id="statClaimed">0</div>
                            <div class="label">已认领</div>
                        </div>
                    </div>
                </div>

                <div class="container">
                    <div class="search-box">
                        <span style="color: var(--primary-blue);">🔍</span>
                        <input type="text" class="search-input" id="searchInput" placeholder="搜索物品名称、描述...">
                        <button class="search-btn" id="searchBtn">搜索</button>
                    </div>

                    <div class="category-grid" id="categoryGrid">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                        </div>
                    </div>

                    <div class="tabs">
                        <div class="tab-item ${this.currentType === 'all' ? 'active' : ''}" data-type="all">全部</div>
                        <div class="tab-item ${this.currentType === 'lost' ? 'active' : ''}" data-type="lost">🔍 寻物</div>
                        <div class="tab-item ${this.currentType === 'found' ? 'active' : ''}" data-type="found">🫴 招领</div>
                        <div class="tab-item ${this.currentType === 'claimed' ? 'active' : ''}" data-type="claimed">✅ 已认领</div>
                    </div>

                    <div class="post-list" id="postList">
                        <div class="empty">
                            <div class="empty-icon">📋</div>
                            <div class="empty-text">加载中...</div>
                        </div>
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
        
        await Promise.all([
            this.loadCategories(),
            this.loadStats(),
            this.loadPosts()
        ]);
    },

    bindEvents() {
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentType = tab.dataset.type;
                this.currentPage = 1;
                this.hasMore = true;
                this.posts = [];
                this.updateTabs();
                this.loadPosts();
            });
        });

        document.getElementById('searchBtn').addEventListener('click', () => {
            this.keyword = document.getElementById('searchInput').value.trim();
            this.currentPage = 1;
            this.hasMore = true;
            this.posts = [];
            this.loadPosts();
        });

        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('searchBtn').click();
            }
        });
    },

    updateTabs() {
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.type === this.currentType);
        });
    },

    async loadCategories() {
        try {
            const result = await ApiService.get('/shiwu/category/list/get');
            if (result.code === 0) {
                this.categories = result.data || [];
                this.renderCategories();
            }
        } catch (error) {
            console.error('加载分类失败:', error);
        }
    },

    renderCategories() {
        const grid = document.getElementById('categoryGrid');
        const allCategory = { code: null, name: '全部', icon: '📋' };
        const displayCategories = [allCategory, ...this.categories];

        grid.innerHTML = displayCategories.map(cat => `
            <div class="category-item ${this.currentCategory === cat.code ? 'active' : ''}" data-category="${cat.code || ''}">
                <div class="category-icon">${cat.icon || Utils.getCategoryIcon(cat.code)}</div>
                <div class="category-name">${cat.name}</div>
            </div>
        `).join('');

        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', () => {
                const code = item.dataset.category || null;
                this.currentCategory = this.currentCategory === code ? null : code;
                this.currentPage = 1;
                this.hasMore = true;
                this.posts = [];
                this.renderCategories();
                this.loadPosts();
            });
        });
    },

    async loadStats() {
        try {
            const [lostResult, foundResult, claimedResult] = await Promise.all([
                ApiService.get('/shiwu/post/list/get', { post_type: 'lost', page_size: 1 }),
                ApiService.get('/shiwu/post/list/get', { post_type: 'found', page_size: 1 }),
                ApiService.get('/shiwu/post/list/get', { status: 'claimed', page_size: 1 })
            ]);

            document.getElementById('statLost').textContent = lostResult.data?.total || 0;
            document.getElementById('statFound').textContent = foundResult.data?.total || 0;
            document.getElementById('statClaimed').textContent = claimedResult.data?.total || 0;
        } catch (error) {
            console.error('加载统计数据失败:', error);
        }
    },

    async loadPosts() {
        const postList = document.getElementById('postList');

        try {
            const params = {
                page: this.currentPage,
                page_size: this.pageSize
            };

            if (this.currentType && this.currentType !== 'all') {
                if (this.currentType === 'claimed') {
                    params.status = 'claimed';
                } else {
                    params.post_type = this.currentType;
                }
            }

            if (this.currentCategory) {
                params.category_code = this.currentCategory;
            }

            if (this.keyword) {
                params.keyword = this.keyword;
            }

            const result = await ApiService.get('/shiwu/post/list/get', params);

            if (result.code === 0) {
                const newPosts = result.data.items || [];

                if (newPosts.length === 0 && this.currentPage === 1) {
                    postList.innerHTML = `
                        <div class="empty">
                            <div class="empty-icon">📭</div>
                            <div class="empty-text">暂无内容，快来发布第一条吧</div>
                            <button class="btn btn-primary" style="margin-top: 16px;" onclick="Router.navigate('post')">去发布</button>
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
                        <div style="text-align: center; padding: 16px; color: var(--text-secondary); font-size: 12px;">
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
                    <div class="empty">
                        <div class="empty-icon">❌</div>
                        <div class="empty-text">加载失败，点击重试</div>
                    </div>
                `;
                postList.querySelector('.empty').onclick = () => this.loadPosts();
            }
        }
    },

    renderPostItem(post) {
        const publisher = post.user || {};
        const typeClass = post.post_type === 'lost' ? 'lost' : post.status === 'claimed' ? 'claimed' : 'found';
        const typeBadgeClass = post.post_type === 'lost' ? 'lost' : post.status === 'claimed' ? 'claimed' : 'found';
        const typeIcon = post.post_type === 'lost' ? '🔍' : '🫴';
        const statusText = post.status === 'claimed' ? '已认领' : (post.post_type === 'lost' ? '寻物启事' : '招领启事');

        return `
            <div class="card ${typeClass}" data-id="${post.id}">
                <div class="card-header">
                    <span class="card-type-badge ${typeBadgeClass}">
                        ${typeIcon} ${statusText}
                    </span>
                    ${post.is_top ? '<span style="background: var(--warning-light); color: var(--warning-color); padding: 2px 8px; border-radius: 10px; font-size: 11px;">置顶</span>' : ''}
                </div>
                <h3 class="card-title">${post.title}</h3>
                <div class="card-meta">
                    <span class="card-meta-item">
                        <span class="icon">${Utils.getCategoryIcon(post.category_code)}</span>
                        ${Utils.getCategoryName(post.category_code)}
                    </span>
                    <span class="card-meta-item">
                        <span class="icon">📍</span>
                        ${Utils.truncate(post.location, 15)}
                    </span>
                    <span class="card-meta-item">
                        <span class="icon">⏰</span>
                        ${Utils.formatTime(post.created_at)}
                    </span>
                </div>
                <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    ${post.description || '暂无描述'}
                </p>
                ${post.images && post.images.length > 0 ? `
                    <div class="images-preview" style="grid-template-columns: repeat(${Math.min(post.images.length, 3)}, 1fr); margin-bottom: 12px;">
                        ${post.images.slice(0, 3).map(img => `<img src="${img}" alt="物品图片">`).join('')}
                    </div>
                ` : ''}
                <div class="card-footer">
                    <div class="card-user">
                        <div class="card-avatar">${Utils.getInitial(publisher.nickname)}</div>
                        <span class="card-nickname">${publisher.nickname || '匿名用户'}</span>
                    </div>
                    <div class="card-actions">
                        <span class="card-action ${post.is_liked ? 'liked' : ''}" data-action="like" data-id="${post.id}">
                            <span class="icon">${post.is_liked ? '❤️' : '🤍'}</span>
                            ${post.like_count || 0}
                        </span>
                        <span class="card-action">
                            <span class="icon">💬</span>
                            ${post.comment_count || 0}
                        </span>
                        <span class="card-action">
                            <span class="icon">👁️</span>
                            ${post.view_count || 0}
                        </span>
                    </div>
                </div>
            </div>
        `;
    },

    bindPostEvents() {
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('[data-action]')) {
                    e.stopPropagation();
                    const action = e.target.closest('[data-action]').dataset.action;
                    const id = e.target.closest('[data-action]').dataset.id;
                    if (action === 'like') {
                        this.handleLike(id);
                    }
                    return;
                }
                const postId = card.dataset.id;
                Router.navigate('detail', { post_id: postId });
            });
        });
    },

    async handleLike(postId) {
        try {
            const result = await ApiService.post('/shiwu/like/toggle', { post_id: parseInt(postId) });
            if (result.code === 0) {
                const post = this.posts.find(p => p.id == postId);
                if (post) {
                    post.is_liked = result.data.is_liked;
                    post.like_count = result.data.like_count;
                    const postList = document.getElementById('postList');
                    postList.innerHTML = this.posts.map(p => this.renderPostItem(p)).join('');
                    this.bindPostEvents();
                }
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            console.error('点赞失败:', error);
        }
    }
};

window.HomePage = HomePage;
