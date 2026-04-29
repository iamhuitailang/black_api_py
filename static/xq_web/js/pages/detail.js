const DetailPage = {
    postData: null,

    async render() {
        const params = Router.getParams();
        const postId = params.post_id;

        if (!postId) {
            Router.navigate('home');
            return;
        }

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page post-detail has-header">
                <header class="header">
                    <button class="header-back" onclick="Router.back()">‹</button>
                    <h1 class="header-title">详情</h1>
                </header>

                <div id="detailContent">
                    <div class="empty-state">
                        <div class="empty-state-icon">⏳</div>
                        <div class="empty-state-text">加载中...</div>
                    </div>
                </div>

                <div class="post-detail-footer" id="footerActions">
                </div>
            </div>
        `;

        await this.loadPost(postId);
    },

    async loadPost(postId) {
        const detailContent = document.getElementById('detailContent');

        try {
            const result = await ApiService.get('/xq/post/detail/get', { post_id: postId });

            if (result.code === 0) {
                this.postData = result.data;
                this.renderDetail();
            } else {
                detailContent.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">❌</div>
                        <div class="empty-state-text">${result.msg || '加载失败'}</div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('加载详情失败:', error);
            detailContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">❌</div>
                    <div class="empty-state-text">加载失败，点击重试</div>
                </div>
            `;
            detailContent.querySelector('.empty-state').onclick = () => this.loadPost(postId);
        }
    },

    renderDetail() {
        const post = this.postData;
        const publisher = post.publisher || {};
        const currentUser = AuthService.getCurrentUser();
        const isPublisher = currentUser && currentUser.id === post.user_id;

        const detailContent = document.getElementById('detailContent');
        const footerActions = document.getElementById('footerActions');

        const userInitial = (publisher.nickname || 'U').charAt(0).toUpperCase();
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

        detailContent.innerHTML = `
            <div class="post-detail-header">
                <div class="post-detail-user">
                    <div class="post-avatar">${userInitial}</div>
                    <div class="post-user-info">
                        <div class="post-username">${publisher.nickname || '用户' + (publisher.phone?.slice(-4) || '')}</div>
                        <div class="post-meta">
                            ${publisher.community ? `<span>📍 ${publisher.community}</span>` : ''}
                            <span>信用: ${publisher.credit || 100}分</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="post-detail-info">
                <div class="post-detail-info-row">
                    <span class="post-detail-info-label">类型</span>
                    <span class="post-detail-info-value"><span class="badge ${typeClass}">${post.type_text}</span></span>
                </div>
                <div class="post-detail-info-row">
                    <span class="post-detail-info-label">分类</span>
                    <span class="post-detail-info-value">${post.category_name}</span>
                </div>
                <div class="post-detail-info-row">
                    <span class="post-detail-info-label">状态</span>
                    <span class="post-detail-info-value">${statusBadge}</span>
                </div>
                ${post.expect_time ? `
                <div class="post-detail-info-row">
                    <span class="post-detail-info-label">期望时间</span>
                    <span class="post-detail-info-value">${this.formatDateTime(post.expect_time)}</span>
                </div>
                ` : ''}
                <div class="post-detail-info-row">
                    <span class="post-detail-info-label">浏览</span>
                    <span class="post-detail-info-value">${post.view_count || 0}次</span>
                </div>
                <div class="post-detail-info-row">
                    <span class="post-detail-info-label">发布时间</span>
                    <span class="post-detail-info-value">${this.formatDateTime(post.created_at)}</span>
                </div>
            </div>

            <div class="post-detail-content">
                <h3>${post.title}</h3>
                <p>${post.content}</p>
            </div>

            ${this.renderClaims()}
        `;

        let footerHtml = '';

        if (!isPublisher && post.status === 0) {
            footerHtml = `
                <button class="btn btn-primary btn-block" onclick="DetailPage.claimPost()">
                    我能帮
                </button>
            `;
        } else if (isPublisher && post.status === 0 && post.claims && post.claims.length > 0) {
            footerHtml = `
                <div style="text-align: center; color: var(--text-secondary); font-size: 13px;">
                    有 ${post.claims.length} 位邻居申请帮助，请在下方选择
                </div>
            `;
        }

        footerActions.innerHTML = footerHtml;
    },

    renderClaims() {
        const post = this.postData;
        const claims = post.claims || [];
        const currentUser = AuthService.getCurrentUser();
        const isPublisher = currentUser && currentUser.id === post.user_id;

        if (claims.length === 0) {
            return '';
        }

        return `
            <div class="divider"></div>
            <div class="section-title">申请帮助的邻居 (${claims.length})</div>
            <div class="claim-list">
                ${claims.map(claim => {
                    const helperInitial = 'U';
                    let statusBadge = '';
                    switch (claim.status) {
                        case 0:
                            statusBadge = '<span class="badge badge-warning">待确认</span>';
                            break;
                        case 1:
                            statusBadge = '<span class="badge badge-info">已接单</span>';
                            break;
                        case 2:
                            statusBadge = '<span class="badge badge-danger">已拒绝</span>';
                            break;
                        case 3:
                            statusBadge = '<span class="badge badge-success">已完成</span>';
                            break;
                    }

                    let actions = '';
                    if (isPublisher && claim.status === 0 && post.status === 0) {
                        actions = `
                            <div class="claim-actions">
                                <button class="btn btn-sm btn-primary" onclick="DetailPage.acceptClaim(${claim.id})">接受</button>
                                <button class="btn btn-sm btn-secondary" onclick="DetailPage.rejectClaim(${claim.id})">拒绝</button>
                            </div>
                        `;
                    } else if ((isPublisher || currentUser?.id === claim.helper_id) && 
                               (claim.status === 1 || (post.status === 1 && claim.status === 1))) {
                        actions = `
                            <div class="claim-actions">
                                <button class="btn btn-sm btn-success" onclick="DetailPage.completeClaim(${claim.id})">完成</button>
                            </div>
                        `;
                    }

                    return `
                        <div class="claim-item">
                            <div class="claim-header">
                                <div class="claim-avatar">${helperInitial}</div>
                                <div class="claim-info">
                                    <div class="claim-name">邻居 ${claim.helper_id}</div>
                                    <div class="claim-time">${Utils.formatTime(claim.created_at)}</div>
                                </div>
                                ${statusBadge}
                            </div>
                            ${claim.comment ? `<div class="claim-comment">💬 ${claim.comment}</div>` : ''}
                            ${actions}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    formatDateTime(time) {
        if (!time) return '-';
        const date = new Date(time);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },

    async claimPost() {
        const post = this.postData;
        const comment = prompt('想说点什么（选填）：');

        if (comment === null) return;

        try {
            const result = await ApiService.post('/xq/claim/create', {
                post_id: post.id,
                comment: comment || ''
            });

            if (result.code === 0) {
                Toast.success('申请成功，请等待发布者确认');
                this.loadPost(post.id);
            } else {
                Toast.error(result.msg || '申请失败');
            }
        } catch (error) {
            console.error('申请帮助失败:', error);
            Toast.error('申请失败，请检查网络');
        }
    },

    async acceptClaim(claimId) {
        if (!confirm('确定接受这位邻居的帮助吗？')) return;

        try {
            const result = await ApiService.post(`/xq/claim/accept?claim_id=${claimId}`);

            if (result.code === 0) {
                Toast.success('已确认接单');
                this.loadPost(this.postData.id);
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            console.error('接受申请失败:', error);
            Toast.error('操作失败，请检查网络');
        }
    },

    async rejectClaim(claimId) {
        if (!confirm('确定拒绝这位邻居的帮助吗？')) return;

        try {
            const result = await ApiService.post(`/xq/claim/reject?claim_id=${claimId}`);

            if (result.code === 0) {
                Toast.success('已拒绝');
                this.loadPost(this.postData.id);
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            console.error('拒绝申请失败:', error);
            Toast.error('操作失败，请检查网络');
        }
    },

    async completeClaim(claimId) {
        if (!confirm('确定标记为已完成吗？')) return;

        try {
            const result = await ApiService.post(`/xq/claim/complete?claim_id=${claimId}`);

            if (result.code === 0) {
                Toast.success('已完成，快去评价对方吧！');
                this.loadPost(this.postData.id);
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            console.error('完成订单失败:', error);
            Toast.error('操作失败，请检查网络');
        }
    }
};
