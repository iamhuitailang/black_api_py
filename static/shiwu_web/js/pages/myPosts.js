const MyPostsPage = {
    currentPage: 1,
    pageSize: 10,
    currentStatus: 'all',
    hasMore: true,
    posts: [],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header no-tabbar">
                ${Header.render('我的发布', true)}
                <main class="container">
                    <div class="tabs">
                        <div class="tab-item ${this.currentStatus === 'all' ? 'active' : ''}" data-status="all">全部</div>
                        <div class="tab-item ${this.currentStatus === 'active' ? 'active' : ''}" data-status="active">进行中</div>
                        <div class="tab-item ${this.currentStatus === 'claimed' ? 'active' : ''}" data-status="claimed">已找回</div>
                        <div class="tab-item ${this.currentStatus === 'expired' ? 'active' : ''}" data-status="expired">已过期</div>
                    </div>

                    <div class="post-list" id="postList">
                        <div class="empty">
                            <div class="empty-icon">📋</div>
                            <div class="empty-text">加载中...</div>
                        </div>
                    </div>
                </main>
            </div>
        `;

        this.bindEvents();
        this.currentPage = 1;
        this.currentStatus = 'all';
        this.hasMore = true;
        this.posts = [];
        await this.loadPosts();
    },

    bindEvents() {
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentStatus = tab.dataset.status;
                this.currentPage = 1;
                this.hasMore = true;
                this.posts = [];
                this.updateTabs();
                this.loadPosts();
            });
        });
    },

    updateTabs() {
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.status === this.currentStatus);
        });
    },

    async loadPosts() {
        const postList = document.getElementById('postList');

        try {
            const params = {
                page: this.currentPage,
                page_size: this.pageSize
            };

            if (this.currentStatus && this.currentStatus !== 'all') {
                params.status = this.currentStatus;
            }

            const result = await ApiService.get('/shiwu/post/my/list/get', params);

            if (result.code === 0) {
                const newPosts = result.data.items || [];

                if (newPosts.length === 0 && this.currentPage === 1) {
                    postList.innerHTML = `
                        <div class="empty">
                            <div class="empty-icon">📭</div>
                            <div class="empty-text">暂无发布内容</div>
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
            console.error('加载我的发布失败:', error);
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
        const isClaimed = post.status === 1 || post.status === 'claimed';
        const typeClass = post.post_type === 'lost' ? 'lost' : isClaimed ? 'claimed' : 'found';
        const typeBadgeClass = post.post_type === 'lost' ? 'lost' : isClaimed ? 'claimed' : 'found';
        const typeIcon = post.post_type === 'lost' ? '🔍' : '🫴';
        const statusText = isClaimed ? '已找回' : (post.post_type === 'lost' ? '寻物中' : '待认领');

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
                        ${Utils.truncate(post.lost_location || '未知', 15)}
                    </span>
                    <span class="card-meta-item">
                        <span class="icon">⏰</span>
                        ${Utils.formatTime(post.created_at)}
                    </span>
                </div>
                <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    ${post.description || '暂无描述'}
                </p>
                <div class="card-footer">
                    <div style="display: flex; gap: 8px;">
                        <span style="font-size: 12px; color: var(--text-secondary);">💬 ${post.comment_count || 0}</span>
                        <span style="font-size: 12px; color: var(--text-secondary);">❤️ ${post.like_count || 0}</span>
                        <span style="font-size: 12px; color: var(--text-secondary);">👁️ ${post.view_count || 0}</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        ${!isClaimed ? `
                            <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); MyPostsPage.markAsClaimed(${post.id})">已找回</button>
                        ` : ''}
                        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); MyPostsPage.deletePost(${post.id})">删除</button>
                    </div>
                </div>
            </div>
        `;
    },

    bindPostEvents() {
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', () => {
                const postId = card.dataset.id;
                Router.navigate('detail', { post_id: postId });
            });
        });
    },

    async markAsClaimed(postId) {
        if (!confirm('确定要标记为已找回吗？')) return;

        try {
            const result = await ApiService.post(`/shiwu/post/found/mark?post_id=${postId}`);

            if (result.code === 0) {
                Toast.success('已标记为已找回');
                this.currentPage = 1;
                this.posts = [];
                this.loadPosts();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error('操作失败，请检查网络');
        }
    },

    async deletePost(postId) {
        if (!confirm('确定要删除这条信息吗？')) return;

        try {
            const result = await ApiService.post(`/shiwu/post/delete?post_id=${postId}`);

            if (result.code === 0) {
                Toast.success('已删除');
                this.currentPage = 1;
                this.posts = [];
                this.loadPosts();
            } else {
                Toast.error(result.msg || '删除失败');
            }
        } catch (error) {
            Toast.error('删除失败，请检查网络');
        }
    }
};

window.MyPostsPage = MyPostsPage;
