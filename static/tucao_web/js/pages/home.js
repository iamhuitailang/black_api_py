const HomePage = {
    posts: [],
    currentPage: 1,
    pageSize: 10,
    loading: false,
    hasMore: true,
    orderBy: 'created_at DESC',
    selectedCategory: '',
    keyword: '',

    async render() {
        const app = document.getElementById('app');
        const user = AuthService.getCurrentUser();
        
        app.innerHTML = `
            <div class="app-container">
                <header class="app-header">
                    <div class="header-content">
                        <div class="header-logo" onclick="Router.navigate('home')">
                            <span class="logo-icon">📮</span>
                            <span class="logo-text">匿名吐槽箱</span>
                        </div>
                        <div class="header-actions">
                            ${user ? `
                                <div class="user-info" onclick="Router.navigate('settings')">
                                    <span class="user-avatar">${(user.nickname || user.username || 'U').charAt(0).toUpperCase()}</span>
                                </div>
                            ` : `
                                <button class="btn-login" onclick="Router.navigate('login')">登录</button>
                            `}
                        </div>
                    </div>
                    <div class="header-tabs">
                        <div class="tab-item ${this.orderBy === 'created_at DESC' ? 'active' : ''}" onclick="HomePage.changeOrder('created_at DESC')">最新</div>
                        <div class="tab-item ${this.orderBy === 'hot' ? 'active' : ''}" onclick="HomePage.changeOrder('hot')">最热</div>
                        <div class="tab-search">
                            <input type="text" id="searchInput" placeholder="搜索..." onkeypress="if(event.key==='Enter')HomePage.search()">
                        </div>
                    </div>
                    <div class="category-bar" id="categoryBar"></div>
                </header>

                <main class="app-main">
                    <div class="post-list" id="postList">
                        <div class="loading-indicator">加载中...</div>
                    </div>
                    <div id="loadMoreIndicator" class="load-more hidden">
                        <span>加载更多...</span>
                    </div>
                </main>

                <div class="fab-container">
                    <button class="fab" onclick="Router.navigate('post')">
                        <span class="fab-icon">✏️</span>
                    </button>
                </div>
            </div>
        `;

        this.posts = [];
        this.currentPage = 1;
        this.hasMore = true;
        
        await this.loadCategories();
        await this.loadPosts();
        
        this.bindScroll();
    },

    async loadCategories() {
        try {
            const result = await ApiService.get('/tucao/post/categories/get');
            if (result.code === 0 && result.data) {
                const categoryBar = document.getElementById('categoryBar');
                categoryBar.innerHTML = `
                    <div class="category-chip ${this.selectedCategory === '' ? 'active' : ''}" onclick="HomePage.selectCategory('')">全部</div>
                    ${result.data.map(cat => `
                        <div class="category-chip ${this.selectedCategory === cat.code ? 'active' : ''}" 
                             style="border-color: ${cat.color}; ${this.selectedCategory === cat.code ? `background: ${cat.color}20;` : ''}"
                             onclick="HomePage.selectCategory('${cat.code}')">
                            ${cat.icon} ${cat.name}
                        </div>
                    `).join('')}
                `;
            }
        } catch (e) {
            console.error('加载分类失败:', e);
        }
    },

    async loadPosts() {
        if (this.loading || !this.hasMore) return;
        
        this.loading = true;
        
        const params = {
            page: this.currentPage,
            page_size: this.pageSize,
            order_by: this.orderBy
        };
        
        if (this.selectedCategory) {
            params.category = this.selectedCategory;
        }
        
        if (this.keyword) {
            params.keyword = this.keyword;
        }

        try {
            const result = await ApiService.get('/tucao/post/list/get', params);
            
            if (result.code === 0) {
                const newPosts = result.data.items;
                
                if (newPosts.length < this.pageSize) {
                    this.hasMore = false;
                }
                
                if (this.currentPage === 1) {
                    this.posts = newPosts;
                } else {
                    this.posts = [...this.posts, ...newPosts];
                }
                
                this.renderPosts();
            }
        } catch (e) {
            console.error('加载失败:', e);
            if (this.currentPage === 1) {
                document.getElementById('postList').innerHTML = `
                    <div class="error-state">
                        <span class="error-icon">😢</span>
                        <p>加载失败，请重试</p>
                    </div>
                `;
            }
        }
        
        this.loading = false;
        document.getElementById('loadMoreIndicator').classList.add('hidden');
    },

    renderPosts() {
        const postList = document.getElementById('postList');
        
        if (this.posts.length === 0) {
            postList.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📭</span>
                    <p>还没有吐槽</p>
                    <p class="empty-tip">来发布第一条吐槽吧</p>
                </div>
            `;
            return;
        }

        postList.innerHTML = this.posts.map(post => this.renderPostCard(post)).join('');
    },

    renderPostCard(post) {
        return `
            <div class="post-card" onclick="Router.navigate('detail/${post.id}')">
                <div class="post-header">
                    <span class="post-anonymous-id">${post.anonymous_id}</span>
                    ${post.category ? `<span class="post-category">${post.category}</span>` : ''}
                    <span class="post-time">${Utils.formatTime(post.created_at)}</span>
                </div>
                <div class="post-content">
                    <p class="${post.content.length > 100 ? 'collapsed' : ''}">${post.content}</p>
                    ${post.content.length > 100 ? '<div class="expand-btn">展开</div>' : ''}
                </div>
                <div class="post-actions">
                    <div class="action-item ${post.is_liked ? 'liked' : ''}" onclick="event.stopPropagation(); HomePage.likePost(${post.id}, this)">
                        <span class="action-icon">❤️</span>
                        <span class="action-count">${post.like_count}</span>
                    </div>
                    <div class="action-item" onclick="event.stopPropagation(); Router.navigate('detail/${post.id}')">
                        <span class="action-icon">💬</span>
                        <span class="action-count">${post.reply_count}</span>
                    </div>
                    <div class="action-item action-more" onclick="event.stopPropagation(); HomePage.showMoreMenu(event, ${post.id})">
                        <span class="action-icon">⋯</span>
                    </div>
                </div>
            </div>
        `;
    },

    async likePost(postId, element) {
        try {
            const result = await ApiService.post(`/tucao/post/like?post_id=${postId}`);
            if (result.code === 0) {
                const countEl = element.querySelector('.action-count');
                const currentCount = parseInt(countEl.textContent);
                
                if (result.data.liked) {
                    element.classList.add('liked');
                    countEl.textContent = currentCount + 1;
                } else {
                    element.classList.remove('liked');
                    countEl.textContent = Math.max(0, currentCount - 1);
                }
                
                Toast.success(result.data.liked ? '点赞成功' : '取消成功');
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (e) {
            Toast.error('操作失败');
        }
    },

    showMoreMenu(event, postId) {
        event.preventDefault();
        const menu = document.createElement('div');
        menu.className = 'more-menu';
        menu.innerHTML = `
            <div class="menu-item" onclick="HomePage.reportPost(${postId})">
                <span>⚠️</span> 举报
            </div>
            <div class="menu-item" onclick="HomePage.sharePost(${postId})">
                <span>🔗</span> 分享
            </div>
        `;
        
        const rect = event.target.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.right = (window.innerWidth - rect.right) + 'px';
        menu.style.top = rect.bottom + 'px';
        
        document.body.appendChild(menu);
        
        setTimeout(() => {
            const closeMenu = (e) => {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 0);
    },

    async reportPost(postId) {
        const reportTypes = ['垃圾信息', '广告', '色情', '暴力', '其他'];
        const type = prompt(`请选择举报类型:\n${reportTypes.map((t, i) => `${i + 1}. ${t}`).join('\n')}`);
        
        if (!type) return;
        
        const typeIndex = parseInt(type);
        if (isNaN(typeIndex) || typeIndex < 1 || typeIndex > reportTypes.length) {
            Toast.warning('无效的选择');
            return;
        }
        
        try {
            const result = await ApiService.post(`/tucao/post/report?post_id=${postId}`, {
                report_type: reportTypes[typeIndex - 1]
            });
            
            if (result.code === 0) {
                Toast.success('举报成功');
            } else {
                Toast.error(result.msg || '举报失败');
            }
        } catch (e) {
            Toast.error('举报失败');
        }
    },

    sharePost(postId) {
        const shareUrl = `${window.location.origin}/static/tucao_web/#share/${postId}`;
        Utils.copyToClipboard(shareUrl);
    },

    changeOrder(orderBy) {
        this.orderBy = orderBy;
        this.currentPage = 1;
        this.hasMore = true;
        document.querySelector('.post-list').innerHTML = '<div class="loading-indicator">加载中...</div>';
        this.loadPosts();
        
        document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
        event.target.classList.add('active');
    },

    selectCategory(category) {
        this.selectedCategory = category;
        this.currentPage = 1;
        this.hasMore = true;
        this.loadCategories();
        document.querySelector('.post-list').innerHTML = '<div class="loading-indicator">加载中...</div>';
        this.loadPosts();
    },

    search() {
        this.keyword = document.getElementById('searchInput').value.trim();
        this.currentPage = 1;
        this.hasMore = true;
        document.querySelector('.post-list').innerHTML = '<div class="loading-indicator">加载中...</div>';
        this.loadPosts();
    },

    bindScroll() {
        window.addEventListener('scroll', () => {
            if (Router.getCurrentRoute() !== 'home') return;
            
            const scrollTop = window.scrollY;
            const windowHeight = window.innerHeight;
            const docHeight = document.body.offsetHeight;
            
            if (scrollTop + windowHeight >= docHeight - 100) {
                if (!this.loading && this.hasMore) {
                    this.currentPage++;
                    document.getElementById('loadMoreIndicator').classList.remove('hidden');
                    this.loadPosts();
                }
            }
        });
    }
};
