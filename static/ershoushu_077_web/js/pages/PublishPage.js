const PublishPage = {
    template: `
    <div>
        <div class="page-header">
            <h1 class="page-title">📖 发布二手书</h1>
        </div>
        <div class="card" style="max-width:700px">
            <div style="padding:24px">
                <form @submit.prevent="handleSubmit">
                    <div style="display:flex;gap:16px;flex-wrap:wrap">
                        <div class="form-group" style="flex:1;min-width:200px">
                            <label class="form-label">书名 *</label>
                            <input v-model="form.title" placeholder="请输入书名" required>
                        </div>
                        <div class="form-group" style="flex:1;min-width:200px">
                            <label class="form-label">作者</label>
                            <input v-model="form.author" placeholder="请输入作者">
                        </div>
                    </div>
                    <div style="display:flex;gap:16px;flex-wrap:wrap">
                        <div class="form-group" style="flex:1;min-width:200px">
                            <label class="form-label">分类 *</label>
                            <select v-model="form.category" required>
                                <option value="">请选择分类</option>
                                <option v-for="cat in categories" :key="cat.code" :value="cat.code">{{ cat.name }}</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex:1;min-width:200px">
                            <label class="form-label">成色 *</label>
                            <select v-model="form.condition_level" required>
                                <option value="">请选择成色</option>
                                <option v-for="cond in conditions" :key="cond.code" :value="cond.code">{{ cond.name }}</option>
                            </select>
                        </div>
                    </div>
                    <div style="display:flex;gap:16px;flex-wrap:wrap">
                        <div class="form-group" style="flex:1;min-width:140px">
                            <label class="form-label">原价</label>
                            <input v-model.number="form.original_price" type="number" step="0.01" placeholder="0.00">
                        </div>
                        <div class="form-group" style="flex:1;min-width:140px">
                            <label class="form-label">售价 *</label>
                            <input v-model.number="form.price" type="number" step="0.01" placeholder="0.00" required>
                        </div>
                    </div>
                    <div style="display:flex;gap:16px;flex-wrap:wrap">
                        <div class="form-group" style="flex:1;min-width:200px">
                            <label class="form-label">ISBN</label>
                            <input v-model="form.isbn" placeholder="选填">
                        </div>
                        <div class="form-group" style="flex:1;min-width:200px">
                            <label class="form-label">出版社</label>
                            <input v-model="form.publisher" placeholder="选填">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">描述</label>
                        <textarea v-model="form.description" placeholder="描述书籍的详细情况..." rows="4"></textarea>
                    </div>
                    <div style="display:flex;gap:12px">
                        <button type="submit" class="btn btn-primary btn-lg" :disabled="loading">
                            <span v-if="loading" class="loading-spinner"></span>
                            {{ loading ? '发布中...' : '发布书籍' }}
                        </button>
                        <button type="button" class="btn btn-outline btn-lg" @click="resetForm">重置</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            form: { title: '', author: '', category: '', condition_level: '', original_price: 0, price: 0, isbn: '', publisher: '', description: '' },
            categories: [], conditions: [], loading: false
        };
    },
    async mounted() {
        const [catResult, condResult] = await Promise.all([BookService.getCategories(), BookService.getConditions()]);
        if (catResult.code === 0) this.categories = catResult.data;
        if (condResult.code === 0) this.conditions = condResult.data;
    },
    methods: {
        async handleSubmit() {
            if (!this.form.title || !this.form.category || !this.form.condition_level || !this.form.price) {
                this.$root.showToast('请填写必要信息', 'error'); return;
            }
            this.loading = true;
            try {
                const result = await BookService.create(this.form);
                if (result.code === 0) {
                    this.$root.showToast('发布成功', 'success');
                    this.$root.navigate('my-books');
                } else {
                    this.$root.showToast(result.msg || '发布失败', 'error');
                }
            } catch (e) { this.$root.showToast('发布失败', 'error'); }
            finally { this.loading = false; }
        },
        resetForm() {
            this.form = { title: '', author: '', category: '', condition_level: '', original_price: 0, price: 0, isbn: '', publisher: '', description: '' };
        }
    }
};
