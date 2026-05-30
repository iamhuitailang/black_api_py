const MyClaimsPage = {
    currentPage: 1,
    pageSize: 10,
    currentStatus: 'all',
    hasMore: true,
    claims: [],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header no-tabbar">
                ${Header.render('我的申请', true)}
                <main class="container">
                    <div class="tabs">
                        <div class="tab-item ${this.currentStatus === 'all' ? 'active' : ''}" data-status="all">全部</div>
                        <div class="tab-item ${this.currentStatus === 'pending' ? 'active' : ''}" data-status="pending">待审核</div>
                        <div class="tab-item ${this.currentStatus === 'approved' ? 'active' : ''}" data-status="approved">已通过</div>
                        <div class="tab-item ${this.currentStatus === 'rejected' ? 'active' : ''}" data-status="rejected">已拒绝</div>
                    </div>

                    <div class="post-list" id="claimList">
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
        this.claims = [];
        await this.loadClaims();
    },

    bindEvents() {
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentStatus = tab.dataset.status;
                this.currentPage = 1;
                this.hasMore = true;
                this.claims = [];
                this.updateTabs();
                this.loadClaims();
            });
        });
    },

    updateTabs() {
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.status === this.currentStatus);
        });
    },

    async loadClaims() {
        const claimList = document.getElementById('claimList');

        try {
            const params = {
                page: this.currentPage,
                page_size: this.pageSize
            };

            if (this.currentStatus && this.currentStatus !== 'all') {
                params.status = this.currentStatus;
            }

            const result = await ApiService.get('/shiwu/claim/my/list/get', params);

            if (result.code === 0) {
                const newClaims = result.data.items || [];

                if (newClaims.length === 0 && this.currentPage === 1) {
                    claimList.innerHTML = `
                        <div class="empty">
                            <div class="empty-icon">📭</div>
                            <div class="empty-text">暂无认领申请</div>
                        </div>
                    `;
                    return;
                }

                if (newClaims.length < this.pageSize) {
                    this.hasMore = false;
                }

                if (this.currentPage === 1) {
                    this.claims = newClaims;
                } else {
                    this.claims = [...this.claims, ...newClaims];
                }

                claimList.innerHTML = this.claims.map(claim => this.renderClaimItem(claim)).join('');

                if (!this.hasMore && this.claims.length > 0) {
                    claimList.innerHTML += `
                        <div style="text-align: center; padding: 16px; color: var(--text-secondary); font-size: 12px;">
                            没有更多了
                        </div>
                    `;
                }

                this.bindClaimEvents();
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (error) {
            console.error('加载我的申请失败:', error);
            if (this.currentPage === 1) {
                claimList.innerHTML = `
                    <div class="empty">
                        <div class="empty-icon">❌</div>
                        <div class="empty-text">加载失败，点击重试</div>
                    </div>
                `;
                claimList.querySelector('.empty').onclick = () => this.loadClaims();
            }
        }
    },

    renderClaimItem(claim) {
        const post = claim.post || {};
        const statusBadge = {
            'pending': 'admin-badge pending',
            'approved': 'admin-badge approved',
            'rejected': 'admin-badge rejected',
            'completed': 'admin-badge approved'
        }[claim.status] || 'admin-badge pending';

        return `
            <div class="card" data-id="${claim.id}" data-post-id="${post.id}">
                <div class="card-header">
                    <h3 class="card-title" style="margin-bottom: 0; font-size: 16px;">${post.title || '物品信息'}</h3>
                    <span class="${statusBadge}">${Utils.getClaimStatusText(claim.status)}</span>
                </div>
                <div class="card-meta">
                    <span class="card-meta-item">
                        <span class="icon">${post.post_type === 'lost' ? '🔍' : '🫴'}</span>
                        ${post.post_type === 'lost' ? '寻物启事' : '招领启事'}
                    </span>
                    <span class="card-meta-item">
                        <span class="icon">⏰</span>
                        ${Utils.formatTime(claim.created_at)}
                    </span>
                </div>
                <div style="margin: 12px 0; padding: 12px; background: var(--gray-light); border-radius: var(--radius-md);">
                    <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 4px;"><strong>我的描述：</strong></p>
                    <p style="font-size: 13px; color: var(--text-primary);">${claim.description}</p>
                </div>
                ${claim.status === 'approved' ? `
                    <div style="margin-bottom: 12px; padding: 12px; background: var(--success-light); border-radius: var(--radius-md);">
                        <p style="font-size: 13px; color: var(--success-color);">📞 对方联系方式：${claim.contact || '暂无'}</p>
                    </div>
                ` : ''}
                ${claim.status === 'rejected' && claim.reject_reason ? `
                    <div style="margin-bottom: 12px; padding: 12px; background: var(--danger-light); border-radius: var(--radius-md);">
                        <p style="font-size: 13px; color: var(--danger-color);">❌ 拒绝原因：${claim.reject_reason}</p>
                    </div>
                ` : ''}
                <div class="card-footer">
                    <span style="font-size: 12px; color: var(--text-secondary);">申请时间：${Utils.formatTime(claim.created_at)}</span>
                    ${claim.status === 'approved' ? `
                        <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); MyClaimsPage.completeClaim(${claim.id})">确认完成</button>
                    ` : ''}
                </div>
            </div>
        `;
    },

    bindClaimEvents() {
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', () => {
                const postId = card.dataset.postId;
                if (postId) {
                    Router.navigate('detail', { post_id: postId });
                }
            });
        });
    },

    async completeClaim(claimId) {
        if (!confirm('确认物品已归还，完成认领流程吗？')) return;

        try {
            const result = await ApiService.post(`/shiwu/claim/complete?claim_id=${claimId}`);

            if (result.code === 0) {
                Toast.success('已完成');
                this.currentPage = 1;
                this.claims = [];
                this.loadClaims();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error('操作失败，请检查网络');
        }
    }
};

window.MyClaimsPage = MyClaimsPage;
