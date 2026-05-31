const AdminBooksPage = {
    template: `
    <div>
        <div class="page-header"><h1 class="page-title">📚 书籍管理</h1></div>
        <div class="toolbar">
            <div class="toolbar-left">
                <div class="search-box"><span class="search-icon">🔍</span><input v-model="keyword" @keyup.enter="page=1;loadBooks()" placeholder="搜索书名、作者..."></div>
            </div>
            <div class="toolbar-right">
                <select v-model="is_checked" @change="page=1;loadBooks()" style="width:120px;padding:8px">
                    <option :value="null">全部审核</option>
                    <option :value="1">已通过</option>
                    <option :value="0">待审核</option>
                </select>
            </div>
        </div>
        <div class="card">
            <div class="table-container">
                <table class="table">
                    <thead><tr><th>ID</th><th>书名</th><th>作者</th><th>分类</th><th>售价</th><th>状态</th><th>审核</th><th>操作</th></tr></thead>
                    <tbody>
                        <tr v-for="book in books" :key="book.id">
                            <td>{{ book.id }}</td>
                            <td>{{ book.title }}</td>
                            <td>{{ book.author || '-' }}</td>
                            <td>{{ book.category_name }}</td>
                            <td style="color:var(--danger)">¥{{ Utils.formatPrice(book.price) }}</td>
                            <td><span class="badge" :class="book.status===1?'badge-success':book.status===4?'badge-info':'badge-warning'">{{ book.status_text }}</span></td>
                            <td><span class="badge" :class="book.is_checked?'badge-success':'badge-warning'">{{ book.is_checked?'已通过':'待审核' }}</span></td>
                            <td><div class="table-actions">
                                <button v-if="!book.is_checked" class="btn btn-success btn-sm" @click="checkBook(book.id,1)">通过</button>
                                <button v-if="!book.is_checked" class="btn btn-danger btn-sm" @click="checkBook(book.id,0)">拒绝</button>
                            </div></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="pagination">
            <button class="pagination-btn" :disabled="page<=1" @click="page--;loadBooks()">上一页</button>
            <span style="font-size:13px;color:var(--text-secondary)">{{ page }} / {{ totalPages||1 }}</span>
            <button class="pagination-btn" :disabled="page>=totalPages" @click="page++;loadBooks()">下一页</button>
        </div>
    </div>
    `,
    data() {
        return { books: [], keyword: '', is_checked: null, page: 1, pageSize: 10, totalPages: 0, Utils: Utils };
    },
    async mounted() { await this.loadBooks(); },
    methods: {
        async loadBooks() {
            const params = { page: this.page, page_size: this.pageSize, keyword: this.keyword || undefined };
            if (this.is_checked !== null) params.is_checked = this.is_checked;
            const result = await BookService.getAdminList(params);
            if (result.code === 0) { this.books = result.data.items; this.totalPages = result.data.total_pages; }
        },
        async checkBook(bookId, isChecked) {
            const result = await BookService.checkBook(bookId, isChecked);
            if (result.code === 0) { this.$root.showToast('操作成功', 'success'); await this.loadBooks(); }
            else this.$root.showToast(result.msg || '操作失败', 'error');
        }
    }
};
