const BookDetailPage = {
    bookId: null,
    book: null,
    isFavorite: false,
    reviews: [],

    async render() {
        const params = Router.getParams();
        this.bookId = params.bookId;

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header no-tabbar book-detail">
                <div class="header">
                    <div class="header-back" id="backBtn">←</div>
                    <div class="header-title">教材详情</div>
                </div>
                
                <div id="detailContent">
                    <div class="text-center text-secondary" style="padding:40px;">加载中...</div>
                </div>
                
                <div class="book-detail-footer">
                    <button class="btn btn-outline btn-favorite" id="favoriteBtn">
                        <span id="favoriteIcon">🤍</span>
                    </button>
                    <button class="btn btn-outline" id="contactBtn">联系卖家</button>
                    <button class="btn btn-primary" id="buyBtn">立即购买</button>
                </div>
            </div>
        `;
        this.bindEvents();
        await this.loadData();
    },

    bindEvents() {
        document.getElementById('backBtn').addEventListener('click', () => Router.back());
        document.getElementById('favoriteBtn').addEventListener('click', () => this.toggleFavorite());
        document.getElementById('contactBtn').addEventListener('click', () => {
            Toast.info('聊天功能开发中');
        });
        document.getElementById('buyBtn').addEventListener('click', () => this.handleBuy());
    },

    async loadData() {
        try {
            await Promise.all([
                this.loadBookDetail(),
                this.loadFavoriteStatus(),
                this.loadReviews()
            ]);
        } catch (e) {
            console.error('加载详情失败', e);
        }
    },

    async loadBookDetail() {
        try {
            const result = await ApiService.book.getDetail(this.bookId);
            if (result.code === 0) {
                this.book = result.data;
                this.renderDetail();
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (e) {
            Toast.error('加载失败');
        }
    },

    async loadFavoriteStatus() {
        try {
            const result = await ApiService.favorite.check(this.bookId);
            if (result.code === 0) {
                this.isFavorite = result.data.is_favorite;
                this.updateFavoriteButton();
            }
        } catch (e) {
            console.error('获取收藏状态失败', e);
        }
    },

    async loadReviews() {
        try {
            const result = await ApiService.review.getList(this.bookId, { page: 1, page_size: 5 });
            if (result.code === 0) {
                this.reviews = result.data.items;
                this.renderReviews();
            }
        } catch (e) {
            console.error('加载评价失败', e);
        }
    },

    renderDetail() {
        const container = document.getElementById('detailContent');
        const book = this.book;
        
        container.innerHTML = `
            <div class="book-detail-header">
                <div class="book-detail-image">📖</div>
                <div class="book-detail-title">${Utils.escapeHtml(book.title)}</div>
                <div class="book-detail-price">
                    <span class="current">¥${Utils.formatPrice(book.price)}</span>
                    <span class="original">¥${Utils.formatPrice(book.original_price)}</span>
                </div>
                <div class="book-detail-meta">
                    <span class="book-detail-meta-item">
                        👁️ ${book.view_count || 0}
                    </span>
                    <span class="book-detail-meta-item">
                        ❤️ ${book.favorite_count || 0}
                    </span>
                    <span class="condition-badge condition-${book.condition}">
                        ${Utils.getConditionText(book.condition)}
                    </span>
                </div>
            </div>

            <div class="book-detail-seller">
                <div class="seller-avatar">${(book.seller_name || 'U')[0]}</div>
                <div class="seller-info">
                    <div class="seller-name">${Utils.escapeHtml(book.seller_name || '未知卖家')}</div>
                    <div class="seller-school">${Utils.escapeHtml(book.seller_school || '')}</div>
                </div>
                <button class="btn btn-outline btn-sm" id="viewSellerBtn">进入店铺</button>
            </div>

            <div class="book-detail-info">
                <div class="book-detail-info-title">基本信息</div>
                <div class="book-detail-info-row">
                    <div class="book-detail-info-label">作者</div>
                    <div class="book-detail-info-value">${Utils.escapeHtml(book.author || '未知')}</div>
                </div>
                <div class="book-detail-info-row">
                    <div class="book-detail-info-label">出版社</div>
                    <div class="book-detail-info-value">${Utils.escapeHtml(book.publisher || '未知')}</div>
                </div>
                <div class="book-detail-info-row">
                    <div class="book-detail-info-label">出版日期</div>
                    <div class="book-detail-info-value">${book.publish_date || '未知'}</div>
                </div>
                <div class="book-detail-info-row">
                    <div class="book-detail-info-label">ISBN</div>
                    <div class="book-detail-info-value">${book.isbn || '未知'}</div>
                </div>
                <div class="book-detail-info-row">
                    <div class="book-detail-info-label">版本</div>
                    <div class="book-detail-info-value">${book.edition || '未知'}</div>
                </div>
                <div class="book-detail-info-row">
                    <div class="book-detail-info-label">适用课程</div>
                    <div class="book-detail-info-value">${Utils.escapeHtml(book.course || '通用')}</div>
                </div>
                <div class="book-detail-info-row">
                    <div class="book-detail-info-label">分类</div>
                    <div class="book-detail-info-value">${Utils.escapeHtml(book.category_name || '未分类')}</div>
                </div>
            </div>

            <div class="book-detail-desc">
                <div class="book-detail-info-title">商品描述</div>
                <div class="book-detail-desc-content">
                    ${Utils.escapeHtml(book.description || '暂无描述')}
                </div>
            </div>

            <div class="review-section">
                <div class="section-title">用户评价 (${this.reviews.length})</div>
                <div class="review-list" id="reviewList">
                    ${this.reviews.length === 0 ? '<div class="text-center text-secondary" style="padding:20px;">暂无评价</div>' : ''}
                </div>
            </div>
        `;

        document.getElementById('viewSellerBtn')?.addEventListener('click', () => {
            Toast.info('店铺功能开发中');
        });

        this.renderReviews();
    },

    renderReviews() {
        const container = document.getElementById('reviewList');
        if (!container || this.reviews.length === 0) return;

        container.innerHTML = this.reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <div class="review-avatar">${(review.nickname || 'U')[0]}</div>
                    <div class="review-name">${Utils.escapeHtml(review.nickname || '匿名用户')}</div>
                    <div class="review-stars">${'★'.repeat(review.rating || 5)}${'☆'.repeat(5 - (review.rating || 5))}</div>
                </div>
                <div class="review-content">${Utils.escapeHtml(review.content || '好评！')}</div>
            </div>
        `).join('');
    },

    updateFavoriteButton() {
        const icon = document.getElementById('favoriteIcon');
        if (icon) {
            icon.textContent = this.isFavorite ? '❤️' : '🤍';
        }
    },

    async toggleFavorite() {
        try {
            const result = await ApiService.favorite.toggle(this.bookId);
            if (result.code === 0) {
                this.isFavorite = result.data.is_favorite;
                this.updateFavoriteButton();
                Toast.success(this.isFavorite ? '已收藏' : '已取消收藏');
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (e) {
            Toast.error('操作失败');
        }
    },

    async handleBuy() {
        if (!this.book) return;

        if (this.book.seller_id === AuthService.getUser()?.id) {
            Toast.error('不能购买自己的商品');
            return;
        }

        Utils.showLoading();
        try {
            const result = await ApiService.order.create({
                book_id: this.bookId,
                quantity: 1
            });
            if (result.code === 0) {
                Toast.success('下单成功');
                Router.navigate('orders');
            } else {
                Toast.error(result.msg || '下单失败');
            }
        } catch (e) {
            Toast.error('下单失败');
        } finally {
            Utils.hideLoading();
        }
    }
};

window.BookDetailPage = BookDetailPage;
