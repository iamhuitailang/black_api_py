const BookDetailPage = {
    template: `
    <div>
        <div v-if="loading" class="text-center" style="padding:40px"><span class="loading-spinner"></span></div>
        <div v-else-if="book">
            <button class="btn btn-outline btn-sm mb-2" @click="$root.back()">← 返回</button>
            <div class="card">
                <div style="display:flex;gap:24px;padding:24px;flex-wrap:wrap">
                    <div style="width:200px;height:260px;background:linear-gradient(135deg,var(--primary-light),var(--info-light));border-radius:var(--radius-lg);display:flex;align-items:center;justify-content:center;font-size:64px;color:var(--primary);flex-shrink:0">📘</div>
                    <div style="flex:1;min-width:200px">
                        <h2 style="font-size:22px;font-weight:700;margin-bottom:12px">{{ book.title }}</h2>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">
                            <span class="badge badge-primary">{{ book.condition_name }}</span>
                            <span class="badge badge-secondary">{{ book.category_name }}</span>
                            <span class="badge badge-info">👁 {{ book.view_count || 0 }}</span>
                        </div>
                        <div style="margin-bottom:16px">
                            <div style="font-size:28px;font-weight:700;color:var(--danger)">¥{{ Utils.formatPrice(book.price) }}
                                <span v-if="book.original_price > 0" style="font-size:14px;color:var(--text-light);text-decoration:line-through;font-weight:400;margin-left:8px">¥{{ Utils.formatPrice(book.original_price) }}</span>
                                <span v-if="book.original_price > 0" style="font-size:13px;color:var(--success);margin-left:8px">{{ Utils.discount(book.price, book.original_price) }}折</span>
                            </div>
                        </div>
                        <div style="font-size:13px;color:var(--text-secondary);line-height:2">
                            <div><strong>作者：</strong>{{ book.author || '未知' }}</div>
                            <div><strong>出版社：</strong>{{ book.publisher || '未知' }}</div>
                            <div v-if="book.isbn"><strong>ISBN：</strong>{{ book.isbn }}</div>
                        </div>
                    </div>
                </div>
                <div style="padding:0 24px 24px">
                    <h3 style="font-size:15px;font-weight:600;margin-bottom:8px">📖 书籍描述</h3>
                    <p style="color:var(--text-secondary);line-height:1.8;font-size:14px">{{ book.description || '暂无描述' }}</p>
                </div>
                <div v-if="book.publisher_info" style="padding:0 24px 24px;border-top:1px solid var(--border);padding-top:16px">
                    <div style="display:flex;align-items:center;gap:12px">
                        <div style="width:40px;height:40px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-weight:600">{{ (book.publisher_info.nickname || 'U').charAt(0) }}</div>
                        <div>
                            <div style="font-weight:500">{{ book.publisher_info.nickname }}</div>
                            <div style="font-size:12px;color:var(--text-secondary)">卖家</div>
                        </div>
                    </div>
                </div>
            </div>
            <div style="margin-top:16px;display:flex;gap:12px" v-if="canBuy">
                <button class="btn btn-primary btn-lg" style="flex:1" @click="handleBuy" :disabled="buying">
                    <span v-if="buying" class="loading-spinner"></span>
                    {{ buying ? '提交中...' : '发起购买' }}
                </button>
            </div>
            <div v-else-if="isOwner" style="margin-top:16px">
                <span class="badge badge-secondary" style="font-size:13px;padding:8px 16px">这是您发布的书籍</span>
            </div>
        </div>
    </div>
    `,
    data() {
        return { book: null, loading: false, buying: false, Utils: Utils };
    },
    computed: {
        isOwner() {
            const user = AuthService.getCurrentUser();
            return user && this.book && user.id === this.book.user_id;
        },
        canBuy() {
            const user = AuthService.getCurrentUser();
            return user && this.book && user.id !== this.book.user_id && this.book.status === 1;
        }
    },
    async mounted() { await this.loadBook(); },
    methods: {
        async loadBook() {
            this.loading = true;
            try {
                const bookId = this.$root.pageParams.book_id;
                const result = await BookService.getDetail(bookId);
                if (result.code === 0) this.book = result.data;
                else this.$root.showToast(result.msg || '加载失败', 'error');
            } finally { this.loading = false; }
        },
        async handleBuy() {
            if (!confirm('确定要发起购买吗？')) return;
            this.buying = true;
            try {
                const result = await TradeService.create(this.book.id);
                if (result.code === 0) {
                    this.$root.showToast('购买请求已发送', 'success');
                    this.$root.navigate('my-trades');
                } else {
                    this.$root.showToast(result.msg || '操作失败', 'error');
                }
            } catch (e) {
                this.$root.showToast('操作失败', 'error');
            } finally { this.buying = false; }
        }
    }
};
