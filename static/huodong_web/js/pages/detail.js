const DetailPage = {
    activityId: null,
    activity: null,
    isFavorited: false,

    async render() {
        this.activityId = Router.getParams().activity_id;
        if (!this.activityId) {
            Router.navigate('home');
            return;
        }
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page no-tabbar" style="padding-bottom: 70px;">
                <header class="header">
                    <span class="header-back" onclick="Router.back()">←</span>
                    <h1 class="header-title">活动详情</h1>
                    <span class="header-action" id="actionMenu">⋮</span>
                </header>

                <div id="detailContent">
                    <div class="empty-state"><div class="empty-state-icon">⏳</div><div class="empty-state-text">加载中...</div></div>
                </div>
            </div>
        `;
        await this.loadDetail();
    },

    async loadDetail() {
        try {
            const result = await ApiService.get('/huodong/activity/detail/get', { activity_id: this.activityId });
            if (result.code === 0) {
                this.activity = result.data;
                this.isFavorited = result.data.is_favorited || false;
                this.renderDetail();
            } else {
                document.getElementById('detailContent').innerHTML = `
                    <div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-text">${result.msg || '加载失败'}</div></div>
                `;
            }
        } catch (e) {
            console.error('加载详情失败:', e);
        }
    },

    renderDetail() {
        const a = this.activity;
        const priceText = a.is_free ? '免费' : a.fee || '收费';
        const container = document.getElementById('detailContent');
        container.innerHTML = `
            <div class="detail-cover">${a.category_icon || '&#127881;'}</div>
            <div class="detail-body">
                <h2 class="detail-title">${a.title}</h2>
                <div class="detail-tags">
                    <span class="badge badge-primary">${a.category_name}</span>
                    <span class="badge ${Utils.getStatusClass(a.status)}">${Utils.getStatusText(a.status)}</span>
                    <span class="badge ${a.is_free ? 'badge-success' : 'badge-warning'}">${priceText}</span>
                </div>

                <div class="detail-info-card">
                    <div class="detail-info-row">
                        <span class="detail-info-icon">&#128336;</span>
                        <span class="detail-info-text">${Utils.formatDateTime(a.start_time)}${a.end_time ? ' ~ ' + Utils.formatDateTime(a.end_time) : ''}</span>
                    </div>
                    <div class="detail-info-row">
                        <span class="detail-info-icon">&#128205;</span>
                        <span class="detail-info-text">${a.location_name || '线上'}${a.location_address ? ' · ' + a.location_address : ''}</span>
                    </div>
                    <div class="detail-info-row">
                        <span class="detail-info-icon">&#128101;</span>
                        <span class="detail-info-text">${a.current_participants || 0}人参加${a.max_participants > 0 ? ' / 限' + a.max_participants + '人' : ''}</span>
                    </div>
                    <div class="detail-info-row">
                        <span class="detail-info-icon">&#128065;</span>
                        <span class="detail-info-text">${a.view_count || 0}次浏览</span>
                    </div>
                    ${a.publisher ? `
                    <div class="detail-info-row">
                        <span class="detail-info-icon">&#128100;</span>
                        <span class="detail-info-text">${a.publisher.nickname || '用户'}</span>
                    </div>
                    ` : ''}
                </div>

                <div class="detail-section">
                    <div class="detail-section-title">&#128221; 活动详情</div>
                    <div class="detail-content">${a.description || '暂无详细描述'}</div>
                </div>

                ${a.tags ? `
                <div class="detail-section">
                    <div class="detail-section-title">&#127991; 标签</div>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;">
                        ${a.tags.split(',').filter(t => t.trim()).map(t => `<span class="badge badge-secondary">${t.trim()}</span>`).join('')}
                    </div>
                </div>
                ` : ''}

                <div class="detail-section">
                    <div class="detail-section-title">&#128248; 活动相册</div>
                    <div id="photoGallery" class="photo-gallery"></div>
                    ${a.publisher && a.publisher.id === (AuthService.getCurrentUser()?.id) ? `
                    <div style="margin-top:12px;">
                        <input type="file" id="photoInput" accept="image/*" style="display:none;">
                        <button class="btn btn-outline btn-sm" id="addPhotoBtn">+ 添加照片</button>
                    </div>
                    ` : ''}
                </div>

                <div class="detail-section">
                    <div class="detail-section-title">&#128172; 话题讨论 <span style="font-weight:400;font-size:13px;color:var(--text-secondary)" id="commentCount"></span></div>
                    <div id="commentList"></div>
                    <div style="margin-top:12px;display:flex;gap:8px;">
                        <input type="text" id="commentInput" class="form-control" placeholder="说点什么..." style="flex:1;">
                        <button class="btn btn-primary btn-sm" id="commentBtn">发送</button>
                    </div>
                </div>
            </div>

            <div class="detail-footer">
                <button class="btn btn-fav" id="favBtn">${this.isFavorited ? '❤️' : '🤍'}</button>
                <button class="btn ${a.is_registered ? 'btn-outline' : 'btn-primary'}" id="signupBtn" style="flex:1;">
                    ${a.is_registered ? '✅ 已报名' : '立即报名'}
                </button>
            </div>
        `;
        this.bindEvents();
        this.loadComments();
        this.renderPhotos();
    },

    renderPhotos() {
        const photos = this.activity.photos || [];
        const gallery = document.getElementById('photoGallery');
        if (!gallery) return;
        if (photos.length === 0) {
            gallery.innerHTML = '<div class="photo-empty">暂无照片，活动组织者可上传活动照片</div>';
            return;
        }
        gallery.innerHTML = photos.map((p, i) => `
            <div class="photo-item" data-index="${i}" data-photo-id="${p.id}">
                <img src="${p.url}" alt="活动照片" class="photo-img">
            </div>
        `).join('');
    },

    bindEvents() {
        document.getElementById('favBtn').addEventListener('click', async () => {
            if (!AuthService.isLoggedIn()) {
                Toast.error('请先登录');
                Router.navigate('login');
                return;
            }
            try {
                const result = await ApiService.post(`/huodong/favorite/toggle?activity_id=${this.activityId}`);
                if (result.code === 0) {
                    this.isFavorited = !this.isFavorited;
                    document.getElementById('favBtn').textContent = this.isFavorited ? '❤️' : '🤍';
                    Toast.success(this.isFavorited ? '已收藏' : '已取消收藏');
                } else {
                    Toast.error(result.msg || '操作失败');
                }
            } catch (e) {
                Toast.error('操作失败');
            }
        });

        document.getElementById('signupBtn').addEventListener('click', async () => {
            if (this.activity.is_registered) {
                try {
                    const result = await ApiService.post(`/huodong/registration/cancel?activity_id=${this.activityId}`);
                    if (result.code === 0) {
                        Toast.success('已取消报名');
                        this.loadDetail();
                    } else {
                        Toast.error(result.msg || '取消失败');
                    }
                } catch (e) {
                    Toast.error('操作失败');
                }
            } else {
                try {
                    const result = await ApiService.post('/huodong/registration/signup', {
                        activity_id: this.activityId
                    });
                    if (result.code === 0) {
                        Toast.success('报名成功！');
                        this.loadDetail();
                    } else {
                        Toast.error(result.msg || '报名失败');
                    }
                } catch (e) {
                    Toast.error('报名失败');
                }
            }
        });

        document.getElementById('commentBtn').addEventListener('click', async () => {
            const input = document.getElementById('commentInput');
            const content = input.value.trim();
            if (!content) {
                Toast.error('请输入评论内容');
                return;
            }
            try {
                const result = await ApiService.post('/huodong/comment/create', {
                    activity_id: this.activityId,
                    content: content
                });
                if (result.code === 0) {
                    input.value = '';
                    Toast.success('评论成功');
                    this.loadComments();
                } else {
                    Toast.error(result.msg || '评论失败');
                }
            } catch (e) {
                Toast.error('评论失败');
            }
        });

        const addPhotoBtn = document.getElementById('addPhotoBtn');
        if (addPhotoBtn) {
            addPhotoBtn.addEventListener('click', () => {
                document.getElementById('photoInput').click();
            });
        }

        const photoInput = document.getElementById('photoInput');
        if (photoInput) {
            photoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.uploadPhoto(file);
                }
            });
        }

        const actionMenu = document.getElementById('actionMenu');
        if (actionMenu) {
            actionMenu.addEventListener('click', () => {
                this.showActionMenu();
            });
        }
    },

    showActionMenu() {
        const isOwner = this.activity.publisher && this.activity.publisher.id === (AuthService.getCurrentUser()?.id);
        if (!isOwner) {
            return;
        }
        const action = confirm('选择操作：\n点击确定进入编辑页面\n点击取消删除活动');
        if (action) {
            Router.navigate('editActivity', { activity_id: this.activityId });
        } else {
            if (confirm('确定要删除该活动吗？')) {
                this.deleteActivity();
            }
        }
    },

    async deleteActivity() {
        try {
            const result = await ApiService.post(`/huodong/activity/delete?activity_id=${this.activityId}`);
            if (result.code === 0) {
                Toast.success('删除成功');
                Router.navigate('home');
            } else {
                Toast.error(result.msg || '删除失败');
            }
        } catch (e) {
            Toast.error('删除失败');
        }
    },

    async uploadPhoto(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const imgUrl = e.target.result;
            try {
                const result = await ApiService.post('/huodong/photo/add', {
                    activity_id: this.activityId,
                    url: imgUrl,
                    description: ''
                });
                if (result.code === 0) {
                    Toast.success('上传成功');
                    this.loadDetail();
                } else {
                    Toast.error(result.msg || '上传失败');
                }
            } catch (err) {
                Toast.error('上传失败');
            }
        };
        reader.readAsDataURL(file);
    },

    async loadComments() {
        try {
            const result = await ApiService.get('/huodong/comment/list/get', {
                activity_id: this.activityId,
                page: 1,
                page_size: 20
            });
            if (result.code === 0) {
                const items = result.data.items || [];
                document.getElementById('commentCount').textContent = `(${result.data.total || 0})`;
                const list = document.getElementById('commentList');
                if (items.length === 0) {
                    list.innerHTML = '<div style="color:var(--text-secondary);font-size:13px;padding:8px 0;">暂无评论，快来抢沙发~</div>';
                    return;
                }
                list.innerHTML = items.map(c => `
                    <div class="comment-item">
                        <div class="comment-avatar">${(c.user?.nickname || 'U').charAt(0)}</div>
                        <div class="comment-body">
                            <div class="comment-name">${c.user?.nickname || '用户'}</div>
                            <div class="comment-text">${c.content}</div>
                            <div class="comment-time">${Utils.formatTime(c.created_at)}</div>
                        </div>
                    </div>
                `).join('');
            }
        } catch (e) {
            console.error('加载评论失败:', e);
        }
    }
};
