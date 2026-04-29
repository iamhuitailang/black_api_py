const MyClaimsPage = {
    currentPage: 1,
    pageSize: 10,
    claims: [],
    hasMore: true,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <button class="header-back" onclick="Router.back()">‹</button>
                    <h1 class="header-title">我的帮助</h1>
                </header>

                <div class="home-tabs">
                    <div class="home-tab active" data-status="" onclick="MyClaimsPage.filterByStatus('')">全部</div>
                    <div class="home-tab" data-status="0" onclick="MyClaimsPage.filterByStatus(0)">待确认</div>
                    <div class="home-tab" data-status="1" onclick="MyClaimsPage.filterByStatus(1)">进行中</div>
                    <div class="home-tab" data-status="3" onclick="MyClaimsPage.filterByStatus(3)">已完成</div>
                </div>

                <div class="claim-list" id="claimList">
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <div class="empty-state-text">加载中...</div>
                    </div>
                </div>
            </div>
        `;

        this.currentPage = 1;
        this.hasMore = true;
        this.claims = [];
        await this.loadClaims();
    },

    currentStatus: null,

    filterByStatus(status) {
        this.currentStatus = status === '' ? null : status;
        this.currentPage = 1;
        this.hasMore = true;
        this.claims = [];

        document.querySelectorAll('.home-tab').forEach(tab => {
            const tabStatus = tab.dataset.status === '' ? null : (tab.dataset.status === '' ? null : tab.dataset.status);
            const currentStr = this.currentStatus === null ? '' : String(this.currentStatus);
            tab.classList.toggle('active', tab.dataset.status === (this.currentStatus === null ? '' : String(this.currentStatus)));
        });

        this.loadClaims();
    },

    async loadClaims() {
        const claimList = document.getElementById('claimList');

        try {
            const params = {
                page: this.currentPage,
                page_size: this.pageSize
            };

            if (this.currentStatus !== null) {
                params.status = this.currentStatus;
            }

            const result = await ApiService.get('/xq/claim/my/list/get', params);

            if (result.code === 0) {
                const newClaims = result.data.items || [];

                if (newClaims.length === 0 && this.currentPage === 1) {
                    claimList.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">🤝</div>
                            <div class="empty-state-text">还没有帮助记录</div>
                            <div style="margin-top: 8px; font-size: 12px; color: var(--text-secondary);">
                                去首页看看有什么可以帮助邻居的吧
                            </div>
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
                        <div class="text-center" style="padding: 16px; color: var(--text-secondary); font-size: 12px;">
                            没有更多了
                        </div>
                    `;
                }

                this.bindEvents();
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (error) {
            console.error('加载我的帮助记录失败:', error);
            if (this.currentPage === 1) {
                claimList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">❌</div>
                        <div class="empty-state-text">加载失败</div>
                    </div>
                `;
            }
        }
    },

    renderClaimItem(claim) {
        const post = claim.post || {};

        let statusBadge = '';
        switch (claim.status) {
            case 0:
                statusBadge = '<span class="badge badge-warning">待确认</span>';
                break;
            case 1:
                statusBadge = '<span class="badge badge-info">进行中</span>';
                break;
            case 2:
                statusBadge = '<span class="badge badge-danger">已拒绝</span>';
                break;
            case 3:
                statusBadge = '<span class="badge badge-success">已完成</span>';
                break;
        }

        const typeClass = post.type === 'need' ? 'badge-warning' : 'badge-info';

        return `
            <div class="claim-item" data-post-id="${post.id}">
                <div class="claim-header">
                    <div class="claim-info">
                        <div class="claim-name">${post.title || '帖子已删除'}</div>
                        <div class="claim-time">${Utils.formatTime(claim.created_at)}</div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-end;">
                        ${statusBadge}
                        ${post.type_text ? `<span class="badge ${typeClass}">${post.type_text}</span>` : ''}
                    </div>
                </div>
                ${claim.comment ? `<div class="claim-comment">💬 我的留言: ${claim.comment}</div>` : ''}
                ${claim.status === 1 ? `
                    <div class="claim-actions">
                        <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); MyClaimsPage.completeClaim(${claim.id})">完成</button>
                    </div>
                ` : ''}
            </div>
        `;
    },

    bindEvents() {
        document.querySelectorAll('.claim-item').forEach(item => {
            item.addEventListener('click', () => {
                const postId = item.dataset.postId;
                if (postId) {
                    Router.navigate('detail', { post_id: postId });
                }
            });
        });
    },

    async completeClaim(claimId) {
        if (!confirm('确定标记为已完成吗？')) return;

        try {
            const result = await ApiService.post(`/xq/claim/complete?claim_id=${claimId}`);

            if (result.code === 0) {
                Toast.success('已完成');
                this.currentPage = 1;
                this.loadClaims();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            console.error('完成订单失败:', error);
            Toast.error('操作失败，请检查网络');
        }
    }
};
