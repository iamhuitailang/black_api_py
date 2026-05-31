const HomePage = {
    template: `
    <div>
        <div class="page-header">
            <h1 class="page-title">📚 二手书交易</h1>
            <p class="page-subtitle">让好书找到新主人</p>
        </div>
        <div class="filter-bar">
            <div class="filter-item">
                <select v-model="filters.category" @change="loadBooks">
                    <option value="">全部分类</option>
                    <option v-for="cat in categories" :key="cat.code" :value="cat.code">{{ cat.name }}</option>
                </select>
            </div>
            <div class="filter-item">
                <select v-model="filters.condition_level" @change="loadBooks">
                    <option value="">全部成色</option>
                    <option v-for="cond in conditions" :key="cond.code" :value="cond.code">{{ cond.name }}</option>
                </select>
            </div>
            <div class="filter-item" style="position:relative">
                <input v-model="filters.keyword" @keyup.enter="loadBooks" placeholder="搜索书名、作者..." style="padding-right:60px">
                <button class="btn btn-primary btn-sm" style="position:absolute;right:4px;top:50%;transform:translateY(-50%)" @click="loadBooks">搜索</button>
            </div>
        </div>
        <div v-if="loading" class="text-center" style="padding:40px"><span class="loading-spinner"></span></div>
        <div v-else-if="books.length === 0" class="empty-state">
            <div class="empty-state-icon">📭</div>
            <div class="empty-state-text">暂无书籍，快来发布第一本吧</div>
        </div>
        <div v-else class="book-grid">
            <div v-for="book in books" :key="book.id" class="book-card" @click="goDetail(book.id)">
                <div class="book-card-cover">📘</div>
                <div class="book-card-body">
                    <div class="book-card-title" :title="book.title">{{ book.title }}</div>
                    <div class="book-card-author">{{ book.author || '未知作者' }}</div>
                    <div class="book-card-footer">
                        <div class="book-card-price">
                            ¥{{ Utils.formatPrice(book.price) }}
                            <span v-if="book.original_price > 0" class="original">¥{{ Utils.formatPrice(book.original_price) }}</span>
                        </div>
                        <span class="badge badge-primary">{{ book.condition_name }}</span>
                    </div>
                    <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center">
                        <span class="badge badge-secondary">{{ book.category_name }}</span>
                        <span style="font-size:12px;color:var(--text-light)">{{ Utils.formatTime(book.created_at) }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="books.length > 0" class="pagination">
            <button class="pagination-btn" :disabled="page<=1" @click="page--;loadBooks()">上一页</button>
            <span style="font-size:13px;color:var(--text-secondary);padding:0 8px">{{ page }} / {{ totalPages || 1 }}</span>
            <button class="pagination-btn" :disabled="page>=totalPages" @click="page++;loadBooks()">下一页</button>
        </div>
    </div>
    `,
    data() {
        return {
            books: [],
            categories: [],
            conditions: [],
            filters: { category: '', condition_level: '', keyword: '' },
            page: 1,
            pageSize: 12,
            total: 0,
            totalPages: 0,
            loading: false,
            Utils: Utils
        };
    },
    async mounted() {
        await Promise.all([this.loadCategories(), this.loadConditions(), this.loadBooks()]);
    },
    methods: {
        async loadCategories() {
            const result = await BookService.getCategories();
            if (result.code === 0) this.categories = result.data;
        },
        async loadConditions() {
            const result = await BookService.getConditions();
            if (result.code === 0) this.conditions = result.data;
        },
        async loadBooks() {
            this.loading = true;
            try {
                const params = { page: this.page, page_size: this.pageSize };
                if (this.filters.category) params.category = this.filters.category;
                if (this.filters.condition_level) params.condition_level = this.filters.condition_level;
                if (this.filters.keyword) params.keyword = this.filters.keyword;
                const result = await BookService.getList(params);
                if (result.code === 0) {
                    this.books = result.data.items;
                    this.total = result.data.total;
                    this.totalPages = result.data.total_pages;
                }
            } finally { this.loading = false; }
        },
        goDetail(bookId) { this.$root.navigate('book-detail', { book_id: bookId }); }
    }
};
