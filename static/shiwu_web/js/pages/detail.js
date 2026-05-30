const DetailPage = {
    post: null,
    comments: [],
    clues: [],
    claims: [],
    showClaimModal: false,
    showClueModal: false,
    showCommentModal: false,

    async render() {
        const params = Router.getParams();
        const postId = params.post_id;

        if (!postId) {
            Router.navigate('home');
            return;
        }

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header no-tabbar">
                ${Header.render('详情', true)}
                <main class="container" id="detailContainer">
                    <div class="loading">
                        <div class="loading-spinner"></div>
                    </div>
                </main>

                ${this.renderModals()}
            </div>
        `;

        await this.loadData(postId);
    },

    renderModals() {
        return `
            <div id="claimModal" style="display: none;">
                <div class="modal-overlay" onclick="DetailPage.closeClaimModal()">
                    <div class="modal" onclick="event.stopPropagation()">
                        <div class="modal-header">
                            <h3 class="modal-title">申请认领</h3>
                            <span class="modal-close" onclick="DetailPage.closeClaimModal()">×</span>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label class="form-label">请描述物品特征 <span class="required">*</span></label>
                                <textarea class="form-textarea" id="claimDescription" placeholder="请详细描述物品的特征，如：品牌、颜色、型号、内含物品等，只有描述正确才能通过审核"></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">联系方式 <span class="required">*</span></label>
                                <input type="text" class="form-input" id="claimContact" placeholder="请输入您的手机号或微信号">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" onclick="DetailPage.closeClaimModal()">取消</button>
                            <button class="btn btn-primary" onclick="DetailPage.submitClaim()">提交申请</button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="clueModal" style="display: none;">
                <div class="modal-overlay" onclick="DetailPage.closeClueModal()">
                    <div class="modal" onclick="event.stopPropagation()">
                        <div class="modal-header">
                            <h3 class="modal-title">提供线索</h3>
                            <span class="modal-close" onclick="DetailPage.closeClueModal()">×</span>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label class="form-label">线索描述 <span class="required">*</span></label>
                                <textarea class="form-textarea" id="clueDescription" placeholder="请描述您见到该物品的时间、地点或其他相关信息"></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">联系方式</label>
                                <input type="text" class="form-input" id="clueContact" placeholder="请输入您的手机号或微信号（选填）">
                            </div>
                            <p style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
                                💡 线索仅发布者可见，您的隐私将得到保护
                            </p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" onclick="DetailPage.closeClueModal()">取消</button>
                            <button class="btn btn-primary" onclick="DetailPage.submitClue()">提交线索</button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="commentModal" style="display: none;">
                <div class="modal-overlay" onclick="DetailPage.closeCommentModal()">
                    <div class="modal" onclick="event.stopPropagation()">
                        <div class="modal-header">
                            <h3 class="modal-title">发表评论</h3>
                            <span class="modal-close" onclick="DetailPage.closeCommentModal()">×</span>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label class="form-label">评论内容 <span class="required">*</span></label>
                                <textarea class="form-textarea" id="commentContent" placeholder="请输入您的评论..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" onclick="DetailPage.closeCommentModal()">取消</button>
                            <button class="btn btn-primary" onclick="DetailPage.submitComment()">发表评论</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadData(postId) {
        try {
            const [postResult, commentsResult] = await Promise.all([
                ApiService.get(`/shiwu/post/detail/get`, { post_id: postId }),
                ApiService.get(`/shiwu/comment/by/post/get`, { post_id: postId, page_size: 100 })
            ]);

            if (postResult.code === 0) {
                this.post = postResult.data;
            } else {
                Toast.error(postResult.msg || '加载失败');
                Router.navigate('home');
                return;
            }

            if (commentsResult.code === 0) {
                this.comments = commentsResult.data.items || [];
            }

            if (this.post.post_type === 'lost') {
                const cluesResult = await ApiService.get(`/shiwu/clue/by/post/get`, { post_id: postId });
                if (cluesResult.code === 0) {
                    this.clues = cluesResult.data.items || cluesResult.data || [];
                }
            } else {
                const claimsResult = await ApiService.get(`/shiwu/claim/by/post/get`, { post_id: postId });
                if (claimsResult.code === 0) {
                    this.claims = claimsResult.data.items || claimsResult.data || [];
                }
            }

            this.renderDetail();
        } catch (error) {
            console.error('加载详情失败:', error);
            document.getElementById('detailContainer').innerHTML = `
                <div class="empty">
                    <div class="empty-icon">❌</div>
                    <div class="empty-text">加载失败，点击重试</div>
                </div>
            `;
            document.querySelector('.empty').onclick = () => this.loadData(postId);
        }
    },

    renderDetail() {
        if (!this.post) return;

        const post = this.post;
        const publisher = post.user || {};
        const currentUser = AuthService.getCurrentUser() || {};
        const isOwner = currentUser.id === post.user_id;
        const isClaimed = post.status === 1 || post.status === 'claimed';
        const typeClass = post.post_type === 'lost' ? 'lost' : isClaimed ? 'claimed' : 'found';
        const typeIcon = post.post_type === 'lost' ? '🔍' : '🫴';
        const statusText = isClaimed ? '已认领' : (post.post_type === 'lost' ? '寻物启事' : '招领启事');

        const container = document.getElementById('detailContainer');
        container.innerHTML = `
            <div class="card ${typeClass}">
                <div class="card-header">
                    <span class="card-type-badge ${typeClass}">
                        ${typeIcon} ${statusText}
                    </span>
                    ${post.is_top ? '<span style="background: var(--warning-light); color: var(--warning-color); padding: 2px 8px; border-radius: 10px; font-size: 11px;">置顶</span>' : ''}
                </div>
                <h2 class="card-title" style="font-size: 20px; margin-bottom: 16px;">${post.title}</h2>
                
                <div class="card-meta" style="margin-bottom: 16px;">
                    <span class="card-meta-item">
                        <span class="icon">${Utils.getCategoryIcon(post.category_code)}</span>
                        ${Utils.getCategoryName(post.category_code)}
                    </span>
                    <span class="card-meta-item">
                        <span class="icon">📍</span>
                        ${post.location}
                    </span>
                    ${post.lost_time ? `
                        <span class="card-meta-item">
                            <span class="icon">⏰</span>
                            ${Utils.formatTime(post.lost_time)}
                        </span>
                    ` : ''}
                    <span class="card-meta-item">
                        <span class="icon">📅</span>
                        ${Utils.formatTime(post.created_at)}
                    </span>
                </div>

                ${post.images && post.images.length > 0 ? `
                    <div class="images-preview" style="grid-template-columns: repeat(${Math.min(post.images.length, 3)}, 1fr); margin-bottom: 16px;">
                        ${post.images.map(img => `<img src="${img}" alt="物品图片" style="cursor: pointer;">`).join('')}
                    </div>
                ` : ''}

                <div style="margin-bottom: 16px;">
                    <h4 style="font-size: 15px; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">详细描述</h4>
                    <p style="color: var(--text-secondary); line-height: 1.8; white-space: pre-wrap;">${post.description || '暂无描述'}</p>
                </div>

                ${post.contact ? `
                    <div style="margin-bottom: 16px; padding: 12px; background: var(--primary-blue-light); border-radius: var(--radius-md);">
                        <span style="font-size: 13px; color: var(--primary-blue);">📞 联系方式：${post.contact}</span>
                    </div>
                ` : ''}

                <div class="card-footer">
                    <div class="card-user">
                        <div class="card-avatar">${Utils.getInitial(publisher.nickname)}</div>
                        <div>
                            <div style="font-size: 14px; font-weight: 500; color: var(--text-primary);">${publisher.nickname || '匿名用户'}</div>
                            ${publisher.college ? `<div style="font-size: 12px; color: var(--text-secondary);">${publisher.college}</div>` : ''}
                        </div>
                    </div>
                    <div class="card-actions">
                        <span class="card-action ${post.is_liked ? 'liked' : ''}" onclick="DetailPage.toggleLike()">
                            <span class="icon">${post.is_liked ? '❤️' : '🤍'}</span>
                            ${post.like_count || 0}
                        </span>
                        <span class="card-action" onclick="DetailPage.openCommentModal()">
                            <span class="icon">💬</span>
                            ${this.comments.length}
                        </span>
                        <span class="card-action">
                            <span class="icon">👁️</span>
                            ${post.view_count || 0}
                        </span>
                    </div>
                </div>
            </div>

            ${!isClaimed && !isOwner ? `
                <div style="margin-top: 16px;">
                    ${post.post_type === 'found' ? `
                        <button class="btn btn-success btn-block btn-lg" onclick="DetailPage.openClaimModal()">
                            🫴 申请认领
                        </button>
                    ` : `
                        <button class="btn btn-primary btn-block btn-lg" onclick="DetailPage.openClueModal()">
                            💡 提供线索
                        </button>
                    `}
                </div>
            ` : ''}

            ${isOwner && !isClaimed ? `
                <div style="margin-top: 16px; display: flex; gap: 12px;">
                    <button class="btn btn-outline" style="flex: 1;" onclick="DetailPage.markAsClaimed()">
                        ✅ 标记已找回
                    </button>
                    <button class="btn btn-danger" style="flex: 1;" onclick="DetailPage.deletePost()">
                        🗑️ 删除
                    </button>
                </div>
            ` : ''}

            ${this.claims.length > 0 ? `
                <div class="card" style="margin-top: 16px;">
                    <h4 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">📋 认领申请 (${this.claims.length})</h4>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${this.claims.map(claim => this.renderClaimItem(claim, isOwner)).join('')}
                    </div>
                </div>
            ` : ''}

            ${this.clues.length > 0 ? `
                <div class="card" style="margin-top: 16px;">
                    <h4 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">💡 收到的线索 (${this.clues.length})</h4>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${this.clues.map(clue => this.renderClueItem(clue, isOwner)).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="card" style="margin-top: 16px;">
                <h4 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">💬 评论 (${this.comments.length})</h4>
                ${this.comments.length === 0 ? `
                    <div class="empty" style="padding: 30px 20px;">
                        <div class="empty-icon">💭</div>
                        <div class="empty-text">暂无评论，快来抢沙发吧</div>
                    </div>
                ` : `
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${this.comments.map(comment => this.renderCommentItem(comment)).join('')}
                    </div>
                `}
            </div>
        `;
    },

    renderClaimItem(claim, isOwner) {
        const claimant = claim.user || {};
        const statusBadge = {
            'pending': 'admin-badge pending',
            'approved': 'admin-badge approved',
            'rejected': 'admin-badge rejected',
            'completed': 'admin-badge approved'
        }[claim.status] || 'admin-badge pending';

        return `
            <div style="padding: 12px; background: var(--gray-light); border-radius: var(--radius-md);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-green) 100%); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 500;">
                            ${Utils.getInitial(claimant.nickname)}
                        </div>
                        <span style="font-size: 14px; font-weight: 500;">${claimant.nickname || '匿名用户'}</span>
                    </div>
                    <span class="${statusBadge}">${Utils.getClaimStatusText(claim.status)}</span>
                </div>
                <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">${claim.description}</p>
                ${claim.status === 'approved' ? `
                    <p style="font-size: 12px; color: var(--primary-green);">📞 联系方式：${claim.contact}</p>
                ` : ''}
                ${isOwner && claim.status === 'pending' ? `
                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                        <button class="btn btn-success btn-sm" style="flex: 1;" onclick="DetailPage.approveClaim(${claim.id})">通过</button>
                        <button class="btn btn-danger btn-sm" style="flex: 1;" onclick="DetailPage.rejectClaim(${claim.id})">拒绝</button>
                    </div>
                ` : ''}
            </div>
        `;
    },

    renderClueItem(clue, isOwner) {
        const provider = clue.user || {};
        return `
            <div style="padding: 12px; background: var(--warning-light); border-radius: var(--radius-md);">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--warning-color); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 500;">
                        ${Utils.getInitial(provider.nickname)}
                    </div>
                    <span style="font-size: 14px; font-weight: 500;">${provider.nickname || '匿名用户'}</span>
                    <span style="font-size: 11px; color: var(--text-secondary);">${Utils.formatTime(clue.created_at)}</span>
                </div>
                <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">${clue.description}</p>
                ${clue.contact ? `
                    <p style="font-size: 12px; color: var(--warning-color);">📞 联系方式：${clue.contact}</p>
                ` : ''}
            </div>
        `;
    },

    renderCommentItem(comment) {
        const commenter = comment.user || {};
        return `
            <div style="display: flex; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);">
                <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-green) 100%); color: white; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 500; flex-shrink: 0;">
                    ${Utils.getInitial(commenter.nickname)}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span style="font-size: 14px; font-weight: 500;">${commenter.nickname || '匿名用户'}</span>
                        <span style="font-size: 11px; color: var(--text-light);">${Utils.formatTime(comment.created_at)}</span>
                    </div>
                    <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">${comment.content}</p>
                </div>
            </div>
        `;
    },

    openClaimModal() {
        document.getElementById('claimModal').style.display = 'block';
    },

    closeClaimModal() {
        document.getElementById('claimModal').style.display = 'none';
    },

    async submitClaim() {
        const description = document.getElementById('claimDescription').value.trim();
        const contact = document.getElementById('claimContact').value.trim();

        if (!description) {
            Toast.error('请描述物品特征');
            return;
        }

        if (!contact) {
            Toast.error('请输入联系方式');
            return;
        }

        try {
            const result = await ApiService.post('/shiwu/claim/create', {
                post_id: this.post.id,
                description,
                contact
            });

            if (result.code === 0) {
                Toast.success('申请已提交');
                this.closeClaimModal();
                this.loadData(this.post.id);
            } else {
                Toast.error(result.msg || '提交失败');
            }
        } catch (error) {
            Toast.error('提交失败，请检查网络');
        }
    },

    openClueModal() {
        document.getElementById('clueModal').style.display = 'block';
    },

    closeClueModal() {
        document.getElementById('clueModal').style.display = 'none';
    },

    async submitClue() {
        const description = document.getElementById('clueDescription').value.trim();
        const contact = document.getElementById('clueContact').value.trim();

        if (!description) {
            Toast.error('请输入线索描述');
            return;
        }

        try {
            const result = await ApiService.post('/shiwu/clue/create', {
                post_id: this.post.id,
                description,
                contact
            });

            if (result.code === 0) {
                Toast.success('线索已提交');
                this.closeClueModal();
                this.loadData(this.post.id);
            } else {
                Toast.error(result.msg || '提交失败');
            }
        } catch (error) {
            Toast.error('提交失败，请检查网络');
        }
    },

    openCommentModal() {
        document.getElementById('commentModal').style.display = 'block';
    },

    closeCommentModal() {
        document.getElementById('commentModal').style.display = 'none';
    },

    async submitComment() {
        const content = document.getElementById('commentContent').value.trim();

        if (!content) {
            Toast.error('请输入评论内容');
            return;
        }

        try {
            const result = await ApiService.post('/shiwu/comment/create', {
                post_id: this.post.id,
                content
            });

            if (result.code === 0) {
                Toast.success('评论已发表');
                this.closeCommentModal();
                document.getElementById('commentContent').value = '';
                this.loadData(this.post.id);
            } else {
                Toast.error(result.msg || '发表失败');
            }
        } catch (error) {
            Toast.error('发表失败，请检查网络');
        }
    },

    async toggleLike() {
        try {
            const result = await ApiService.post('/shiwu/like/toggle', { post_id: this.post.id });
            if (result.code === 0) {
                this.post.is_liked = result.data.is_liked;
                this.post.like_count = result.data.like_count;
                this.renderDetail();
            }
        } catch (error) {
            console.error('点赞失败:', error);
        }
    },

    async approveClaim(claimId) {
        try {
            const result = await ApiService.post(`/shiwu/claim/approve?claim_id=${claimId}`);
            if (result.code === 0) {
                Toast.success('已通过申请');
                this.loadData(this.post.id);
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error('操作失败，请检查网络');
        }
    },

    async rejectClaim(claimId) {
        try {
            const result = await ApiService.post(`/shiwu/claim/reject?claim_id=${claimId}`);
            if (result.code === 0) {
                Toast.success('已拒绝申请');
                this.loadData(this.post.id);
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error('操作失败，请检查网络');
        }
    },

    async markAsClaimed() {
        if (!confirm('确定要标记为已找回吗？')) return;

        try {
            const result = await ApiService.post(`/shiwu/post/found/mark?post_id=${this.post.id}`);

            if (result.code === 0) {
                Toast.success('已标记为已找回');
                this.loadData(this.post.id);
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error('操作失败，请检查网络');
        }
    },

    async deletePost() {
        if (!confirm('确定要删除这条信息吗？')) return;

        try {
            const result = await ApiService.post(`/shiwu/post/delete?post_id=${this.post.id}`);

            if (result.code === 0) {
                Toast.success('已删除');
                Router.navigate('home');
            } else {
                Toast.error(result.msg || '删除失败');
            }
        } catch (error) {
            Toast.error('删除失败，请检查网络');
        }
    }
};

window.DetailPage = DetailPage;
