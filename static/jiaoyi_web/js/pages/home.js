const HomePage = {
    categories: [],
    books: [],
    currentPage: 1,
    pageSize: 10,
    hasMore: true,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <div class="header">
                    <div class="header-title">二手教材</div>
                </div>
                
                <div class="search-bar">
                    <div class="search-input-wrapper">
                        <span class="search-icon">🔍</span>
                        <input type="text" class="search-input" id="searchInput" placeholder="搜索教材名称、作者">
                    </div>
                    <button class="search-btn" id="searchBtn">搜索</button>
                </div>
                
                <div class="home-banner">
                    <div class="home-banner-title">📚 校园二手教材</div>
                    <div class="home-banner-subtitle">让闲置教材流动，为环保助力</div>
                </div>
                
                <div class="announcement-banner" id="announcementBanner">
                    <span class="announcement-icon">📢</span>
                    <span class="announcement-text">欢迎使用校园二手教材交易平台</span>
                </div>
                
                <div class="section-title">教材分类</div>
                <div class="home-categories" id="categories">
                    <div class="text-center text-secondary" style="width:100%;padding:20px;">加载中...</div>
                </div>
                
                <div class="section-title">推荐教材</div>
                <div class="book-grid" id="bookList">
                    <div class="text-center text-secondary" style="grid-column:1/-1;padding:40px;">加载中...</div>
                </div>
                
                <div class="fab" id="publishBtn">+</div>
                
                <div class="tabbar">
                    <div class="tabbar-item active" data-page="home">
                        <div class="tabbar-icon">🏠</div>
                        <div class="tabbar-text">首页</div>
                    </div>
                    <div class="tabbar-item" data-page="orders">
                        <div class="tabbar-icon">📋</div>
                        <div class="tabbar-text">订单</div>
                    </div>
                    <div class="tabbar-item" data-page="favorites">
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
        await this.loadData();
    },

    bindEvents() {
        document.querySelectorAll('.tabbar-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                Router.navigate(page);
            });
        });

        document.getElementById('searchBtn').addEventListener('click', () => {
            const keyword = document.getElementById('searchInput').value.trim();
            Router.navigate('bookList', { keyword });
        });

        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const keyword = document.getElementById('searchInput').value.trim();
                Router.navigate('bookList', { keyword });
            }
        });

        document.getElementById('publishBtn').addEventListener('click', () => {
            if (AuthService.canPublish()) {
                Router.navigate('publish');
            } else {
                Toast.error('请先升级为卖家账号');
            }
        });
    },

    async loadData() {
        try {
            await Promise.all([
                this.loadCategories(),
                this.loadBooks(),
                this.loadAnnouncement()
            ]);
        } catch (e) {
            console.error('加载数据失败', e);
        }
    },

    async loadAnnouncement() {
        try {
            const result = await ApiService.announcement.getList({ page: 1, page_size: 1, status: 1 });
            if (result.code === 0 && result.data.items.length > 0) {
                const ann = result.data.items[0];
                document.getElementById('announcementBanner').querySelector('.announcement-text').textContent = ann.title;
            }
        } catch (e) {
            console.error('加载公告失败', e);
        }
    },

    async loadCategories() {
        try {
            const result = await ApiService.category.getList();
            if (result.code === 0) {
                this.categories = result.data;
                this.renderCategories();
            }
        } catch (e) {
            console.error('加载分类失败', e);
        }
    },

    renderCategories() {
        const container = document.getElementById('categories');
        const displayCategories = this.categories.slice(0, 8);
        
        container.innerHTML = displayCategories.map(cat => `
            <div class="home-category" data-category-id="${cat.id}">
                <div class="home-category-icon">${cat.icon || '📚'}</div>
                <div class="home-category-text">${cat.name}</div>
            </div>
        `).join('');

        container.querySelectorAll('.home-category').forEach(item => {
            item.addEventListener('click', () => {
                const categoryId = parseInt(item.dataset.categoryId);
                Router.navigate('bookList', { categoryId });
            });
        });
    },

    async loadBooks() {
        try {
            const result = await ApiService.book.getList({
                page: this.currentPage,
                page_size: this.pageSize,
                status: 1
            });
            if (result.code === 0) {
                this.books = result.data.items;
                this.hasMore = result.data.page < result.data.total_pages;
                this.renderBooks();
            }
        } catch (e) {
            console.error('加载教材失败', e);
        }
    },

    renderBooks() {
        const container = document.getElementById('bookList');
        
        if (this.books.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <div class="empty-state-icon">📚</div>
                    <div class="empty-state-text">暂无教材</div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.books.map(book => `
            <div class="book-item" data-book-id="${book.id}">
                <div class="book-image">📖</div>
                <div class="book-info">
                    <div class="book-title">${Utils.escapeHtml(book.title)}</div>
                    <div class="book-author">${Utils.escapeHtml(book.author || '未知作者')}</div>
                    <div class="book-footer">
                        <div class="book-price">
                            ¥${Utils.formatPrice(book.price)}
                            <span class="original">¥${Utils.formatPrice(book.original_price)}</span>
                        </div>
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

window.HomePage = HomePage;
