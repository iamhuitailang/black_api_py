const SharePage = {
    post: null,

    async render(postId) {
        const app = document.getElementById('app');
        
        app.innerHTML = `
            <div class="app-container">
                <header class="page-header">
                    <button class="back-btn" onclick="Router.navigate('home')">←</button>
                    <h1>分享</h1>
                    <div style="width: 40px;"></div>
                </header>

                <main class="app-main">
                    <div id="shareContent">
                        <div class="loading-indicator">加载中...</div>
                    </div>
                </main>
            </div>
        `;

        await this.loadPost(postId);
    },

    async loadPost(postId) {
        try {
            const result = await ApiService.get(`/tucao/post/share/get?post_id=${postId}`);
            
            if (result.code === 0) {
                this.post = result.data;
                this.renderShare();
            } else {
                document.getElementById('shareContent').innerHTML = `
                    <div class="error-state">
                        <span class="error-icon">😢</span>
                        <p>${result.msg || '内容不存在'}</p>
                    </div>
                `;
            }
        } catch (e) {
            document.getElementById('shareContent').innerHTML = `
                <div class="error-state">
                    <span class="error-icon">😢</span>
                    <p>加载失败</p>
                </div>
            `;
        }
    },

    renderShare() {
        const post = this.post;
        const shareCard = Utils.generateShareCard(post);
        
        document.getElementById('shareContent').innerHTML = `
            <div class="share-container">
                <div class="share-preview">
                    <img src="${shareCard}" alt="分享卡片" class="share-card-img">
                </div>
                
                <div class="post-card share-post">
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
                </div>
                
                <div class="share-actions">
                    <button class="btn-share" onclick="SharePage.saveImage()">
                        <span>💾</span> 保存图片
                    </button>
                    <button class="btn-share" onclick="SharePage.copyLink()">
                        <span>🔗</span> 复制链接
                    </button>
                </div>
                
                <div class="share-tip">
                    <p>📌 此页面为只读模式，无法点赞或回复</p>
                </div>
            </div>
        `;
    },

    saveImage() {
        const img = document.querySelector('.share-card-img');
        const link = document.createElement('a');
        link.download = `吐槽_${this.post.id}.png`;
        link.href = img.src;
        link.click();
        Toast.success('图片已保存');
    },

    copyLink() {
        const shareUrl = window.location.href;
        Utils.copyToClipboard(shareUrl);
    }
};
