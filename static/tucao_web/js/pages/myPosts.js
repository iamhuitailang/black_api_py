const MyPostsPage = {
    posts: [],
    deleteCode: '',

    render() {
        const app = document.getElementById('app');
        const user = AuthService.getCurrentUser();
        
        app.innerHTML = `
            <div class="app-container">
                <header class="page-header">
                    <button class="back-btn" onclick="Router.navigate('home')">←</button>
                    <h1>我的发布</h1>
                    <div style="width: 40px;"></div>
                </header>

                <main class="app-main">
                    <div class="my-posts-container">
                        <div class="delete-code-input">
                            <label>输入删除码查看发布</label>
                            <div class="code-input-group">
                                <input 
                                    type="text" 
                                    id="deleteCodeInput" 
                                    placeholder="如：AB3D-9F2K"
                                    value="${this.deleteCode}"
                                    oninput="MyPostsPage.deleteCode = this.value"
                                >
                                <button class="btn-search" onclick="MyPostsPage.search()">查询</button>
                            </div>
                            <p class="code-tip">💡 发布时生成的删除码，格式如：AB3D-9F2K</p>
                        </div>

                        <div id="myPostsList">
                            ${this.deleteCode ? '<div class="loading-indicator">加载中...</div>' : `
                                <div class="empty-state">
                                    <span class="empty-icon">🔑</span>
                                    <p>请输入删除码</p>
                                    <p class="empty-tip">查看你发布的吐槽</p>
                                </div>
                            `}
                        </div>
                    </div>
                </main>
            </div>
        `;

        if (this.deleteCode) {
            this.search();
        }
    },

    async search() {
        this.deleteCode = document.getElementById('deleteCodeInput').value.trim();
        
        if (!this.deleteCode) {
            Toast.warning('请输入删除码');
            return;
        }

        try {
            const result = await ApiService.get('/tucao/post/my/list/get', {
                delete_code: this.deleteCode,
                page: 1,
                page_size: 50
            });

            if (result.code === 0) {
                this.posts = result.data.items;
                this.renderPosts();
            } else {
                Toast.error(result.msg || '查询失败');
            }
        } catch (e) {
            Toast.error('查询失败');
        }
    },

    renderPosts() {
        const container = document.getElementById('myPostsList');
        
        if (this.posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📭</span>
                    <p>没有找到吐槽</p>
                    <p class="empty-tip">请检查删除码是否正确</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.posts.map(post => `
            <div class="post-card">
                <div class="post-header">
                    <span class="post-anonymous-id">${post.anonymous_id}</span>
                    ${post.category ? `<span class="post-category">${post.category}</span>` : ''}
                    <span class="post-time">${Utils.formatTime(post.created_at)}</span>
                </div>
                <div class="post-content">
                    <p>${post.content}</p>
                </div>
                <div class="post-actions">
                    <div class="action-item">
                        <span class="action-icon">❤️</span>
                        <span class="action-count">${post.like_count}</span>
                    </div>
                    <div class="action-item">
                        <span class="action-icon">💬</span>
                        <span class="action-count">${post.reply_count}</span>
                    </div>
                </div>
                <div class="my-post-actions">
                    <button class="btn-action" onclick="MyPostsPage.editPost(${post.id})">
                        ✏️ 编辑
                    </button>
                    <button class="btn-action btn-danger" onclick="MyPostsPage.deletePost(${post.id})">
                        🗑️ 删除
                    </button>
                </div>
            </div>
        `).join('');
    },

    editPost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        const newContent = prompt('编辑吐槽内容：', post.content);
        if (newContent === null) return;

        if (!newContent.trim()) {
            Toast.warning('内容不能为空');
            return;
        }

        if (newContent.length > 500) {
            Toast.warning('内容不能超过500字');
            return;
        }

        ApiService.post(`/tucao/post/edit?post_id=${postId}&delete_code=${this.deleteCode}`, {
            content: newContent.trim()
        }).then(result => {
            if (result.code === 0) {
                Toast.success('编辑成功');
                this.search();
            } else {
                Toast.error(result.msg || '编辑失败');
            }
        });
    },

    deletePost(postId) {
        if (!confirm('确定要删除这条吐槽吗？')) return;

        ApiService.post(`/tucao/post/delete?post_id=${postId}`, {
            delete_code: this.deleteCode
        }).then(result => {
            if (result.code === 0) {
                Toast.success('删除成功');
                this.search();
            } else {
                Toast.error(result.msg || '删除失败');
            }
        });
    }
};
