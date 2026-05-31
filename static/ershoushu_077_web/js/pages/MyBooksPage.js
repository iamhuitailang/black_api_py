const MyBooksPage = {
    template: `
    <div>
        <div class="page-header flex-between">
            <h1 class="page-title">📕 我的书籍</h1>
            <button class="btn btn-primary" @click="$root.navigate('publish')">+ 发布书籍</button>
        </div>
        <div v-if="loading" class="text-center" style="padding:40px"><span class="loading-spinner"></span></div>
        <div v-else-if="books.length===0" class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">暂无书籍，快去发布吧</div></div>
        <div v-else>
            <div class="table-container">
                <table class="table">
                    <thead><tr><th>书名</th><th>分类</th><th>成色</th><th>售价</th><th>状态</th><th>发布时间</th><th>操作</th></tr></thead>
                    <tbody>
                        <tr v-for="book in books" :key="book.id">
                            <td>{{ book.title }}</td>
                            <td>{{ book.category_name }}</td>
                            <td>{{ book.condition_name }}</td>
                            <td style="color:var(--danger);font-weight:600">¥{{ Utils.formatPrice(book.price) }}</td>
                            <td><span class="badge" :class="book.status===1?'badge-success':book.status===4?'badge-secondary':'badge-warning'">{{ book.status_text }}</span></td>
                            <td>{{ Utils.formatDateTime(book.created_at) }}</td>
                            <td>
                                <div class="table-actions">
                                    <button class="btn btn-outline btn-sm" @click="$root.navigate('book-detail',{book_id:book.id})">查看</button>
                                    <button v-if="book.status!==4" class="btn btn-danger btn-sm" @click="deleteBook(book.id)">删除</button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="pagination">
                <button class="pagination-btn" :disabled="page<=1" @click="page--;loadBooks()">上一页</button>
                <span style="font-size:13px;color:var(--text-secondary)">{{ page }} / {{ totalPages||1 }}</span>
                <button class="pagination-btn" :disabled="page>=totalPages" @click="page++;loadBooks()">下一页</button>
            </div>
        </div>
    </div>
    `,
    data() {
        return { books: [], loading: false, page: 1, pageSize: 10, totalPages: 0, Utils: Utils };
    },
    async mounted() { await this.loadBooks(); },
    methods: {
        async loadBooks() {
            this.loading = true;
            try {
                const result = await BookService.getMyBooks({ page: this.page, page_size: this.pageSize });
                if (result.code === 0) { this.books = result.data.items; this.totalPages = result.data.total_pages; }
            } finally { this.loading = false; }
        },
        async deleteBook(bookId) {
            if (!confirm('确定删除？')) return;
            const result = await BookService.delete(bookId);
            if (result.code === 0) { this.$root.showToast('删除成功', 'success'); await this.loadBooks(); }
            else this.$root.showToast(result.msg || '删除失败', 'error');
        }
    }
};
