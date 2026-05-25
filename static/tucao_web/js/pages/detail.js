const DetailPage = {
    post: null,
    showReplyInput: false,
    replyToId: null,
    replyParentId: null,

    async render(postId) {
        const app = document.getElementById('app');
        
        app.innerHTML = `
            <div class="app-container">
                <header class="page-header">
                    <button class="back-btn" onclick="Router.navigate('home')">←</button>
                    <h1>吐槽详情</h1>
                    <button class="share-btn" onclick="DetailPage.share()">🔗</button>
                </header>

                <main class="app-main">
                    <div id="detailContent">
                        <div class="loading-indicator">加载中...</div>
                    </div>
                </main>
            </div>
        `;

        await this.loadPost(postId);
    },

    async loadPost(postId) {
        try {
            const result = await ApiService.get(`/tucao/post/detail/get?post_id=${postId}`);
            
            if (result.code === 0) {
                this.post = result.data;
                this.renderPost();
            } else {
                document.getElementById('detailContent').innerHTML = `
                    <div class="error-state">
                        <span class="error-icon">😢</span>
                        <p>${result.msg || '加载失败'}</p>
                    </div>
                `;
            }
        } catch (e) {
            console.error('加载失败:', e);
            document.getElementById('detailContent').innerHTML = `
                <div class="error-state">
                    <span class="error-icon">😢</span>
                    <p>加载失败，请重试</p>
                </div>
            `;
        }
    },

    renderPost() {
        const post = this.post;
        document.getElementById('detailContent').innerHTML = `
            <div class="post-detail">
                <div class="post-card detail-card">
                    <div class="post-header">
                        <span class="post-anonymous-id">${post.anonymous_id}</span>
                        ${post.category ? `<span class="post-category">${post.category}</span>` : ''}
                        <span class="post-time">${Utils.formatTime(post.created_at)}</span>
                    </div>
                    <div class="post-content">
                        <p>${post.content}</p>
                    </div>
                    <div class="post-actions">
                        <div class="action-item ${post.is_liked ? 'liked' : ''}" onclick="DetailPage.like()">
                            <span class="action-icon">❤️</span>
                            <span class="action-count">${post.like_count}</span>
                        </div>
                        <div class="action-item" onclick="DetailPage.showReplyInput()">
                            <span class="action-icon">💬</span>
                            <span class="action-count">${post.reply_count}</span>
                        </div>
                    </div>
                </div>

                <div id="replyInputArea" class="reply-input-area hidden">
                    <textarea 
                        id="replyContent" 
                        placeholder="写下你的回复..."
                        maxlength="100"
                    ></textarea>
                    <div class="reply-actions">
                        <span class="char-hint" id="replyCharCount">0/100</span>
                        <button class="btn-reply" onclick="DetailPage.submitReply()">回复</button>
                    </div>
                </div>

                <div class="reply-list">
                    <h3 class="reply-title">回复 (${post.reply_count})</h3>
                    <div id="repliesContainer">
                        ${this.renderReplies(post.replies || [])}
                    </div>
                </div>
            </div>
        `;

        const replyInput = document.getElementById('replyContent');
        if (replyInput) {
            replyInput.addEventListener('input', () => {
                document.getElementById('replyCharCount').textContent = `${replyInput.value.length}/100`;
            });
        }
    },

    renderReplies(replies) {
        if (!replies || replies.length === 0) {
            return `
                <div class="empty-replies">
                    <span>还没有回复，来抢沙发吧！</span>
                </div>
            `;
        }

        return replies.map(reply => `
            <div class="reply-item">
                <div class="reply-content">
                    <span class="reply-id">${reply.anonymous_id}</span>
                    <p class="reply-text">${reply.content}</p>
                    <div class="reply-meta">
                        <span>${Utils.formatTime(reply.created_at)}</span>
                        <button class="reply-action-btn" onclick="DetailPage.showReplyInput(${reply.id}, ${reply.id})">回复</button>
                        ${reply.like_count > 0 ? `<span>❤️ ${reply.like_count}</span>` : ''}
                    </div>
                </div>
                ${reply.children && reply.children.length > 0 ? `
                    <div class="reply-children">
                        ${reply.children.map(child => `
                            <div class="reply-item child-reply">
                                <div class="reply-content">
                                    <span class="reply-id">${child.anonymous_id}</span>
                                    <p class="reply-text">${child.content}</p>
                                    <div class="reply-meta">
                                        <span>${Utils.formatTime(child.created_at)}</span>
                                        ${child.like_count > 0 ? `<span>❤️ ${child.like_count}</span>` : ''}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    },

    async like() {
        try {
            const result = await ApiService.post(`/tucao/post/like?post_id=${this.post.id}`);
            if (result.code === 0) {
                this.post.is_liked = result.data.liked;
                this.post.like_count += result.data.liked ? 1 : -1;
                this.renderPost();
                Toast.success(result.data.liked ? '点赞成功' : '取消成功');
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (e) {
            Toast.error('操作失败');
        }
    },

    showReplyInput(parentId = null, replyToId = null) {
        this.replyParentId = parentId;
        this.replyToId = replyToId;
        this.showReplyInput = true;
        
        const replyArea = document.getElementById('replyInputArea');
        if (replyArea) {
            replyArea.classList.remove('hidden');
            document.getElementById('replyContent').focus();
        }
    },

    async submitReply() {
        const content = document.getElementById('replyContent').value.trim();
        
        if (!content) {
            Toast.warning('请输入回复内容');
            return;
        }

        if (content.length > 100) {
            Toast.warning('回复不能超过100字');
            return;
        }

        try {
            const params = new URLSearchParams({
                post_id: this.post.id,
                parent_id: this.replyParentId || 0,
                reply_to_id: this.replyToId || 0
            }).toString();
            
            const result = await ApiService.post(`/tucao/post/reply?${params}`, {
                content: content
            });

            if (result.code === 0) {
                Toast.success('回复成功');
                document.getElementById('replyContent').value = '';
                this.replyParentId = null;
                this.replyToId = null;
                await this.loadPost(this.post.id);
            } else {
                Toast.error(result.msg || '回复失败');
            }
        } catch (e) {
            Toast.error('回复失败');
        }
    },

    share() {
        Router.navigate(`share/${this.post.id}`);
    }
};
