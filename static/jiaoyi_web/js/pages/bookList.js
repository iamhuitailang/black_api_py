const BookListPage = {
    books: [],
    currentPage: 1,
    pageSize: 10,
    hasMore: true,
    keyword: '',
    categoryId: null,
    conditions: [
        { value: '', label: '全部' },
        { value: 'new', label: '全新' },
        { value: 'like_new', label: '几乎全新' },
        { value: 'good', label: '良好' },
        { value: 'fair', label: '一般' }
    ],
    currentCondition: '',
    minPrice: null,
    maxPrice: null,

    async render() {
        const params = Router.getParams();
        this.keyword = params.keyword || '';
        this.categoryId = params.categoryId || null;

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <div class="header">
                    <div class="header-back" id="backBtn">←</div>
                    <div class="header-title">教材列表</div>
                </div>
                
                <div class="search-bar">
                    <div class="search-input-wrapper">
                        <span class="search-icon">🔍</span>
                        <input type="text" class="search-input" id="searchInput" placeholder="搜索教材" value="${Utils.escapeHtml(this.keyword)}">
                    </div>
                    <button class="search-btn" id="searchBtn">搜索</button>
                </div>
                
                <div class="filter-bar">
                    <div class="filter-item ${this.currentCondition === '' ? 'active' : ''}" data-condition="">全部</div>
                    ${this.conditions.slice(1).map(c => `
                        <div class="filter-item ${this.currentCondition === c.value ? 'active' : ''}" data-condition="${c.value}">${c.label}</div>
                    `).join('')}
                </div>
                
                <div class="book-grid" id="bookList">
                    <div class="text-center text-secondary" style="grid-column:1/-1;padding:40px;">加载中...</div>
                </div>
                
                <div class="load-more" id="loadMore" style="display:none;">加载更多</div>
            </div>
        `;
        this.bindEvents();
        await this.loadBooks();
    },

    bindEvents() {
        document.getElementById('backBtn').addEventListener('click', () => Router.back());

        document.getElementById('searchBtn').addEventListener('click', () => {
            this.keyword = document.getElementById('searchInput').value.trim();
            this.currentPage = 1;
            this.books = [];
            this.loadBooks();
        });

        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.keyword = document.getElementById('searchInput').value.trim();
                this.currentPage = 1;
                this.books = [];
                this.loadBooks();
            }
        });

        document.querySelectorAll('.filter-item').forEach(item => {
            item.addEventListener('click', () => {
                this.currentCondition = item.dataset.condition;
                document.querySelectorAll('.filter-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.currentPage = 1;
                this.books = [];
                this.loadBooks();
            });
        });

        document.getElementById('loadMore').addEventListener('click', () => {
            if (this.hasMore) {
                this.currentPage++;
                this.loadBooks(true);
            }
        });
    },

    async loadBooks(append = false) {
        try {
            const params = {
                page: this.currentPage,
                page_size: this.pageSize,
                status: 1
            };

            if (this.keyword) {
                params.keyword = this.keyword;
            }
            if (this.categoryId) {
                params.category_id = this.categoryId;
            }
            if (this.currentCondition) {
                params.condition = this.currentCondition;
            }

            const result = await ApiService.book.getList(params);
            if (result.code === 0) {
                if (append) {
                    this.books = this.books.concat(result.data.items);
                } else {
                    this.books = result.data.items;
                }
                this.hasMore = result.data.page < result.data.total_pages;
                this.renderBooks();
            }
        } catch (e) {
            console.error('加载教材失败', e);
            Toast.error('加载失败');
        }
    },

    renderBooks() {
        const container = document.getElementById('bookList');
        const loadMore = document.getElementById('loadMore');
        
        if (this.books.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <div class="empty-state-icon">📚</div>
                    <div class="empty-state-text">暂无相关教材</div>
                </div>
            `;
            loadMore.style.display = 'none';
            return;
        }

        if (!container.querySelector('.book-item') || !container.dataset.rendered) {
            container.innerHTML = '';
            container.dataset.rendered = 'true';
        }

        const newBooks = this.books.slice(container.querySelectorAll('.book-item').length);
        
        newBooks.forEach(book => {
            const item = document.createElement('div');
            item.className = 'book-item';
            item.dataset.bookId = book.id;
            item.innerHTML = `
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
            `;
            item.addEventListener('click', () => {
                Router.navigate('bookDetail', { bookId: book.id });
            });
            container.appendChild(item);
        });

        loadMore.style.display = this.hasMore ? 'block' : 'none';
    }
};

window.BookListPage = BookListPage;
