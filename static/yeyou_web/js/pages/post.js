const PostDetailPage = {
    name: 'post-detail',
    requiresAuth: true,
    template: `
        <div class="page has-header no-tabbar post-detail">
            <div class="header white">
                <div class="header-back" onclick="Router.back()">←</div>
                <div class="header-title">动态详情</div>
            </div>
            
            <div id="postContent">
                <div class="empty-state">
                    <div class="empty-state-icon">🔄</div>
                    <div class="empty-state-text">加载中...</div>
                </div>
            </div>
            
            <div class="post-detail-footer">
                <div class="post-detail-action" id="likeBtn">
                    <span class="post-detail-action-icon">❤️</span>
                    <span class="post-detail-action-text" id="likeCount">0</span>
                </div>
                <div class="post-detail-action">
                    <span class="post-detail-action-icon">💬</span>
                    <span class="post-detail-action-text">评论</span>
                </div>
                <div class="post-detail-action">
                    <span class="post-detail-action-icon">↗️</span>
                    <span class="post-detail-action-text">分享</span>
                </div>
            </div>
        </div>
    `,

    postId: null,
    postData: null,
    isLiked: false,

    init(params) {
        if (!params || !params.id) {
            Utils.showToast('参数错误');
            Router.back();
            return;
        }
        
        this.postId = params.id;
        this.loadPost();
        this.initActions();
    },

    async loadPost() {
        const contentEl = document.getElementById('postContent');
        
        try {
            const result = await ApiService.get('/yeyou/post/detail', { id: this.postId });
            
            if (result.code === 0 && result.data) {
                this.postData = result.data;
                this.renderPost(contentEl);
            } else {
                Utils.showToast(result.msg || '加载失败');
                Router.back();
            }
        } catch (error) {
            console.error('Load post error:', error);
            Utils.showToast('网络错误');
            Router.back();
        }
    },

    renderPost(container) {
        const post = this.postData;
        const user = post.user || {};
        const avatar = user.avatar || user.nickname?.charAt(0) || '🧑';
        const nickname = user.nickname || '用户';
        const createdAt = post.created_at ? Utils.formatDate(post.created_at) : '';
        
        let imagesHtml = '';
        if (post.images) {
            try {
                const images = JSON.parse(post.images);
                if (images && images.length > 0) {
                    imagesHtml = '<div class="post-detail-images">';
                    images.forEach(img => {
                        imagesHtml += `<div class="post-detail-image" style="height:200px;background-image:url('${img}');background-size:cover;background-position:center;"></div>`;
                    });
                    imagesHtml += '</div>';
                }
            } catch (e) {
                // ignore
            }
        }
        
        const likeCountEl = document.getElementById('likeCount');
        if (likeCountEl) {
            likeCountEl.textContent = post.like_count || 0;
        }
        
        container.innerHTML = `
            <div class="post-detail-header">
                <div class="post-header">
                    <div class="post-avatar">${avatar}</div>
                    <div class="post-user-info">
                        <div class="post-username">${Utils.escapeHtml(nickname)}</div>
                        <div class="post-meta">
                            <span>${createdAt}</span>
                            ${post.activity_id ? '<span class="badge badge-info">来自活动</span>' : ''}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="post-detail-content">
                ${Utils.escapeHtml(post.content || '').replace(/\n/g, '<br>')}
            </div>
            
            ${imagesHtml}
        `;
    },

    initActions() {
        const likeBtn = document.getElementById('likeBtn');
        likeBtn.addEventListener('click', async () => {
            try {
                const action = this.isLiked ? '/yeyou/post/unlike' : '/yeyou/post/like';
                const result = await ApiService.post(action, {
                    post_id: parseInt(this.postId)
                });
                
                if (result.code === 0) {
                    this.isLiked = !this.isLiked;
                    const likeCountEl = document.getElementById('likeCount');
                    const currentCount = parseInt(likeCountEl.textContent) || 0;
                    likeCountEl.textContent = this.isLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
                    
                    likeBtn.classList.toggle('text-primary', this.isLiked);
                } else {
                    Utils.showToast(result.msg || '操作失败');
                }
            } catch (error) {
                console.error('Like error:', error);
                Utils.showToast('网络错误');
            }
        });
    }
};

const CreatePostPage = {
    name: 'create-post',
    requiresAuth: true,
    template: `
        <div class="page has-header no-tabbar create-page">
            <div class="header white">
                <div class="header-back" onclick="Router.back()">←</div>
                <div class="header-title">发布动态</div>
                <div class="header-action" id="submitBtn">发布</div>
            </div>
            
            <div class="post-create-content">
                <textarea class="post-create-textarea" id="postContent" placeholder="分享你的户外故事..."></textarea>
            </div>
            
            <div class="post-create-images">
                <div class="post-create-image-add" id="addImageBtn">
                    <div class="post-create-image-add-icon">+</div>
                    <span>添加图片</span>
                </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="list">
                <div class="list-item" id="bindActivityBtn">
                    <div class="list-item-content">
                        <div class="list-item-title">关联活动</div>
                        <div class="list-item-desc text-secondary" id="selectedActivity">选择关联的活动（可选）</div>
                    </div>
                    <div class="list-item-arrow">›</div>
                </div>
            </div>
        </div>
    `,

    selectedImages: [],
    selectedActivityId: null,

    init() {
        this.initSubmit();
        this.initImageAdd();
        this.initActivityBind();
    },

    initSubmit() {
        const submitBtn = document.getElementById('submitBtn');
        const contentInput = document.getElementById('postContent');
        
        submitBtn.addEventListener('click', async () => {
            const content = contentInput.value.trim();
            
            if (!content && this.selectedImages.length === 0) {
                Utils.showToast('请输入内容或添加图片');
                return;
            }
            
            if (content && content.length < 2) {
                Utils.showToast('内容至少2个字符');
                return;
            }
            
            Utils.showLoading();
            try {
                const data = {
                    content: content || ''
                };
                
                if (this.selectedActivityId) {
                    data.activity_id = this.selectedActivityId;
                }
                
                if (this.selectedImages.length > 0) {
                    data.images = JSON.stringify(this.selectedImages);
                }
                
                const result = await ApiService.post('/yeyou/post/create', data);
                Utils.hideLoading();
                
                if (result.code === 0) {
                    Utils.showToast('发布成功');
                    Router.navigate('home');
                } else {
                    Utils.showToast(result.msg || '发布失败');
                }
            } catch (error) {
                Utils.hideLoading();
                Utils.showToast('网络错误');
                console.error('Create post error:', error);
            }
        });
    },

    initImageAdd() {
        const addBtn = document.getElementById('addImageBtn');
        addBtn.addEventListener('click', () => {
            Utils.showToast('图片上传功能开发中');
        });
    },

    initActivityBind() {
        const bindBtn = document.getElementById('bindActivityBtn');
        bindBtn.addEventListener('click', async () => {
            Utils.showToast('选择活动功能开发中');
        });
    }
};
