const FavoritesPage = {
    favorites: [],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <div class="header">
                    <div class="header-title">我的收藏</div>
                </div>
                
                <div class="book-grid" id="favoriteList" style="padding:12px;">
                    <div class="text-center text-secondary" style="grid-column:1/-1;padding:40px;">加载中...</div>
                </div>
                
                <div class="tabbar">
                    <div class="tabbar-item" data-page="home">
                        <div class="tabbar-icon">🏠</div>
                        <div class="tabbar-text">首页</div>
                    </div>
                    <div class="tabbar-item" data-page="orders">
                        <div class="tabbar-icon">📋</div>
                        <div class="tabbar-text">订单</div>
                    </div>
                    <div class="tabbar-item active" data-page="favorites">
                        <div class="tabbar-icon">❤️</div>
                        <div class="tabbar-text">收藏</div>
                    </div>
                    <div class="tabbar-item" data-page="profile">
                        <div class="tabbar-icon">👤</div>
                        <div class="tabbar-text">我的</div>
                    </div>
                </div>
            </div>
        `;
        this.bindEvents();
        await this.loadFavorites();
    },

    bindEvents() {
        document.querySelectorAll('.tabbar-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                Router.navigate(page);
            });
        });
    },

    async loadFavorites() {
        try {
            const result = await ApiService.favorite.getList({ page: 1, page_size: 50 });
            if (result.code === 0) {
                this.favorites = result.data.items;
                this.renderFavorites();
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (e) {
            Toast.error('加载失败');
        }
    },

    renderFavorites() {
        const container = document.getElementById('favoriteList');
        
        if (this.favorites.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <div class="empty-state-icon">❤️</div>
                    <div class="empty-state-text">暂无收藏</div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.favorites.map(item => `
            <div class="book-item" data-book-id="${item.book_id}">
                <div class="book-image">📖</div>
                <div class="book-info">
                    <div class="book-title">${Utils.escapeHtml(item.title || '教材')}</div>
                    <div class="book-author">${Utils.escapeHtml(item.seller_name || '卖家')}</div>
                    <div class="book-footer">
                        <div class="book-price">¥${Utils.formatPrice(item.price)}</div>
                    </div>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.book-item').forEach(item => {
            item.addEventListener('click', () => {
                const bookId = parseInt(item.dataset.bookId);
                Router.navigate('bookDetail', { bookId });
            });
        });
    }
};

window.FavoritesPage = FavoritesPage;
