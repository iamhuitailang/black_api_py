const PostsPage = {
    currentPage: 1,
    pageSize: 10,
    type: '',
    render: async function(params) {
        this.type = params.type || '';
        const pageContent = document.getElementById('page-content');
        
        pageContent.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">📝 骑行动态</h1>
                <div class="page-actions">
                    <button class="btn btn-green" data-route="create-post">+ 发布动态</button>
                </div>
            </div>

            <div id="posts-list">
                ${App.renderLoading()}
            </div>

            <div id="pagination" class="mt-4 text-center">
            </div>
        `;

        this.loadPosts();
    },
    loadPosts: async function() {
        const container = document.getElementById('posts-list');
        container.innerHTML = App.renderLoading();

        try {
            let result;
            
            if (this.type === 'my') {
                if (!Auth.isLoggedIn()) {
                    Router.go('login');
                    return;
                }
                result = await API.get('/post/my/list/get', {
                    page: this.currentPage,
                    page_size: this.pageSize
                });
            } else {
                result = await API.get('/post/feed/get', {
                    page: this.currentPage,
                    page_size: this.pageSize
                });
            }

            if (result.code === 0 && result.data) {
                this.renderPosts(result.data.list || []);
                this.renderPagination(result.data.total || 0);
            } else {
                container.innerHTML = App.renderEmpty('📝', '暂无动态', '快来分享你的骑行故事吧');
            }
        } catch (error) {
            console.error('Load posts error:', error);
            container.innerHTML = App.renderEmpty('❌', '加载失败', '请稍后重试');
        }
    },
    renderPosts: function(posts) {
        const container = document.getElementById('posts-list');

        if (!posts || posts.length === 0) {
            container.innerHTML = App.renderEmpty('📝', '暂无动态', '快来分享你的骑行故事吧');
            return;
        }

        container.innerHTML = posts.map(post => {
            const userAvatar = post.user_nickname ? post.user_nickname.charAt(0).toUpperCase() : 'U';
            let imagesHtml = '';
            
            if (post.images && post.images.length > 0) {
                const images = Array.isArray(post.images) ? post.images : [];
                if (images.length > 0) {
                    imagesHtml = `
                        <div class="post-images">
                            ${images.slice(0, 9).map(() => `
                                <div class="post-image" style="background-color: var(--bg-tertiary);"></div>
                            `).join('')}
                        </div>
                    `;
                }
            }

            return `
                <div class="card post-card mb-4">
                    <div class="card-body">
                        <div class="post-header">
                            <div class="post-avatar">${userAvatar}</div>
                            <div class="post-user-info">
                                <div class="post-user-name">${post.user_nickname || '用户'}</div>
                                <div class="post-time">${post.created_at || ''}</div>
                            </div>
                        </div>
                        ${post.content ? `
                            <div class="post-content">${post.content}</div>
                        ` : ''}
                        ${imagesHtml}
                        <div class="post-footer">
                            <div class="post-action" data-action="like" data-id="${post.id}">
                                <span>❤️</span>
                                <span>${post.like_count || 0}</span>
                            </div>
                            ${this.type === 'my' ? `
                                <div class="post-action text-danger" data-action="delete" data-id="${post.id}">
                                    <span>🗑️</span>
                                    <span>删除</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.setupActionListeners();
    },
    setupActionListeners: function() {
        const self = this;

        document.querySelectorAll('[data-action="like"]').forEach(btn => {
            btn.addEventListener('click', async function() {
                const postId = parseInt(this.dataset.id);
                const likeCount = this.querySelector('span:last-child');
                
                try {
                    const result = await API.post('/post/like', { post_id: postId });
                    
                    if (result.code === 0) {
                        this.classList.toggle('liked');
                        if (this.classList.contains('liked')) {
                            likeCount.textContent = parseInt(likeCount.textContent) + 1;
                        }
                    } else {
                        App.showToast(result.msg || '操作失败', 'error');
                    }
                } catch (error) {
                    App.showToast('操作失败，请稍后重试', 'error');
                }
            });
        });

        document.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', async function() {
                const postId = parseInt(this.dataset.id);
                if (!confirm('确定要删除这条动态吗？')) {
                    return;
                }

                try {
                    const result = await API.post('/post/delete', { post_id: postId });
                    
                    if (result.code === 0) {
                        App.showToast('删除成功', 'success');
                        self.loadPosts();
                    } else {
                        App.showToast(result.msg || '删除失败', 'error');
                    }
                } catch (error) {
                    App.showToast('删除失败，请稍后重试', 'error');
                }
            });
        });
    },
    renderPagination: function(total) {
        const pagination = document.getElementById('pagination');
        const totalPages = Math.ceil(total / this.pageSize);

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = '<div class="flex justify-center items-center gap-2">';
        
        if (this.currentPage > 1) {
            html += `<button class="btn btn-sm btn-outline" data-page="${this.currentPage - 1}">上一页</button>`;
        }

        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                html += `<button class="btn btn-sm btn-green" data-page="${i}">${i}</button>`;
            } else {
                html += `<button class="btn btn-sm btn-outline" data-page="${i}">${i}</button>`;
            }
        }

        if (this.currentPage < totalPages) {
            html += `<button class="btn btn-sm btn-outline" data-page="${this.currentPage + 1}">下一页</button>`;
        }

        html += '</div>';
        pagination.innerHTML = html;

        const self = this;
        pagination.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', function() {
                self.currentPage = parseInt(this.dataset.page);
                self.loadPosts();
            });
        });
    }
};

Router.register('posts', function(params) {
    PostsPage.render(params);
});
