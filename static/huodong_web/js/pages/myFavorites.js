const MyFavoritesPage = {
    currentPage: 1,
    pageSize: 10,
    favorites: [],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <span class="header-back" onclick="Router.back()">←</span>
                    <h1 class="header-title">我的收藏</h1>
                </header>

                <div id="favoriteList">
                    <div class="empty-state"><div class="empty-state-icon">⏳</div><div class="empty-state-text">加载中...</div></div>
                </div>

                ${Tabbar.render('profile')}
            </div>
        `;
        await this.loadData();
    },

    async loadData() {
        const list = document.getElementById('favoriteList');
        try {
            const result = await ApiService.get('/huodong/favorite/my/list/get', {
                page: this.currentPage, page_size: this.pageSize
            });
            if (result.code === 0) {
                this.favorites = result.data.items || [];
                if (this.favorites.length === 0) {
                    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❤️</div><div class="empty-state-text">还没有收藏活动</div></div>';
                    return;
                }
                list.innerHTML = this.favorites.map(a => `
                    <div class="activity-item" data-id="${a.id}">
                        <div class="activity-cover">${a.category_icon || '🎉'}</div>
                        <div class="activity-info">
                            <div>
                                <div class="activity-title">${a.title}</div>
                                <div class="activity-meta">
                                    <div class="activity-meta-row"><span>📍</span><span>${a.location_name || '线上'}</span></div>
                                    <div class="activity-meta-row"><span>🕐</span><span>${Utils.formatDateTime(a.start_time)}</span></div>
                                </div>
                            </div>
                            <div class="activity-footer">
                                <span class="badge ${Utils.getStatusClass(a.status)}">${Utils.getStatusText(a.status)}</span>
                                <span class="activity-price ${a.is_free ? 'text-primary' : ''}">${a.is_free ? '免费' : a.fee || '收费'}</span>
                            </div>
                        </div>
                    </div>
                `).join('');
                document.querySelectorAll('.activity-item').forEach(item => {
                    item.addEventListener('click', () => {
                        Router.navigate('detail', { activity_id: item.dataset.id });
                    });
                });
            }
        } catch (e) {
            console.error('加载收藏失败:', e);
        }
    }
};
