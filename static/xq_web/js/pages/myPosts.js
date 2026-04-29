const MyPostsPage = {
    currentPage: 1,
    pageSize: 10,
    posts: [],
    hasMore: true,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <button class="header-back" onclick="Router.back()">‹</button>
                    <h1 class="header-title">我的发布</h1>
                </header>

                <div class="home-tabs">
                    <div class="home-tab active" data-type="all" onclick="MyPostsPage.filterByType('all')">全部</div>
                    <div class="home-tab" data-type="need" onclick="MyPostsPage.filterByType('need')">求助</div>
                    <div class="home-tab" data-type="help" onclick="MyPostsPage.filterByType('help')">提供帮助</div>
                </div>

                <div class="post-list" id="postList">
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <div class="empty-state-text">加载中...</div>
                    </div>
                </div>
            </div>
        `;

        this.currentPage = 1;
        this.hasMore = true;
        this.posts = [];
        await this.loadPosts();
    },

    currentType: 'all',

    filterByType(type) {
        this.currentType = type;
        this.currentPage = 1;
        this.hasMore = true;
        this.posts = [];

        document.querySelectorAll('.home-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.type === type);
        });

        this.loadPosts();
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

            const result = await ApiService.get('/xq/post/my/list/get', params);

            if (result.code === 0) {
                const newPosts = result.data.items || [];

                if (newPosts.length === 0 && this.currentPage === 1) {
                    postList.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">📭</div>
                            <div class="empty-state-text">还没有发布内容</div>
                            <button class="btn btn-primary btn-sm" style="margin-top: 16px;" onclick="Router.navigate('post')">去发布</button>
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
            console.error('加载我的发布失败:', error);
            if (this.currentPage === 1) {
                postList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">❌</div>
                        <div class="empty-state-text">加载失败</div>
                    </div>
                `;
            }
        }
    },

    renderPostItem(post) {
        const typeClass = post.type === 'need' ? 'badge-warning' : 'badge-info';

        let statusBadge = '';
        switch (post.status) {
            case 0:
                statusBadge = '<span class="badge badge-warning">进行中</span>';
                break;
            case 1:
                statusBadge = '<span class="badge badge-info">已接单</span>';
                break;
            case 2:
                statusBadge = '<span class="badge badge-success">已完成</span>';
                break;
            case 3:
                statusBadge = '<span class="badge badge-secondary">已取消</span>';
                break;
        }

        return `
            <div class="post-item" data-id="${post.id}">
                <div class="post-header">
                    <div class="post-user-info">
                        <div class="post-username">${post.type_text}</div>
                        <div class="post-meta">${Utils.formatTime(post.created_at)}</div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span class="badge ${typeClass}">${post.category_name}</span>
                        ${statusBadge}
                    </div>
                </div>
                <div class="post-content">
                    <div class="post-title">${post.title}</div>
                    <div class="post-desc">${post.content}</div>
                </div>
                <div class="post-footer">
                    <div class="post-actions">
                        <div class="post-action">
                            <span>👁️</span>
                            <span>${post.view_count || 0}</span>
                        </div>
                        ${post.status === 0 ? `
                            <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); MyPostsPage.cancelPost(${post.id})">取消</button>
                        ` : ''}
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
    },

    async cancelPost(postId) {
        if (!confirm('确定取消这个发布吗？')) return;

        try {
            const result = await ApiService.post(`/xq/post/cancel?post_id=${postId}`);

            if (result.code === 0) {
                Toast.success('已取消');
                this.currentPage = 1;
                this.loadPosts();
            } else {
                Toast.error(result.msg || '取消失败');
            }
        } catch (error) {
            console.error('取消发布失败:', error);
            Toast.error('操作失败，请检查网络');
        }
    }
};
