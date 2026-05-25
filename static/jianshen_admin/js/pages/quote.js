const QuotePage = {
    state: { page: 1, pageSize: 20 },

    async render() {
        if (!AuthService.requireAuth()) return;
        Layout.render('<div class="loading"><div class="spinner"></div></div>', '每日语录');
        await this.load();
    },

    async load() {
        try {
            const res = await ApiService.get('/jianshen/admin/quote/list/get', {
                page: this.state.page,
                page_size: this.state.pageSize
            });
            if (res.code === 0) this.renderList(res.data);
        } catch (e) { console.error(e); }
    },

    renderList(data) {
        const rows = (data.items || []).map(q => `
            <tr>
                <td>${q.id}</td>
                <td>${q.quote_date}</td>
                <td>${q.content}</td>
                <td>${q.author || '-'}</td>
                <td><button class="btn btn-danger btn-sm" onclick="QuotePage.remove(${q.id})">删除</button></td>
            </tr>
        `).join('');
        Layout.renderPage(`
            <div class="card">
                <div class="card-header">
                    <h2>💬 每日语录 (${data.total})</h2>
                    <button class="btn btn-primary" onclick="QuotePage.showCreate()">+ 添加语录</button>
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead><tr><th>ID</th><th>日期</th><th>内容</th><th>作者</th><th>操作</th></tr></thead>
                        <tbody>${rows || '<tr><td colspan="5" class="empty">暂无数据</td></tr>'}</tbody>
                    </table>
                </div>
                <div class="pagination">
                    <span class="info">共 ${data.total} 条</span>
                    <button class="page-btn" ${data.page <= 1 ? 'disabled' : ''} onclick="QuotePage.changePage(${data.page - 1})">上一页</button>
                    <button class="page-btn active">${data.page} / ${data.total_pages || 1}</button>
                    <button class="page-btn" ${data.page >= data.total_pages ? 'disabled' : ''} onclick="QuotePage.changePage(${data.page + 1})">下一页</button>
                </div>
            </div>
            <div id="modal-container"></div>
        `, '每日语录');
    },

    changePage(p) { this.state.page = p; this.load(); },

    showCreate() {
        const container = document.getElementById('modal-container');
        container.innerHTML = `
            <div class="modal-overlay" id="quote-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>添加语录</h3>
                        <button class="modal-close" onclick="QuotePage.closeModal()">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>日期</label>
                            <input type="date" id="q-date" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label>内容</label>
                            <textarea id="q-content" rows="4" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:var(--radius-sm);resize:vertical;" placeholder="输入励志语录"></textarea>
                        </div>
                        <div class="form-group">
                            <label>作者（可选）</label>
                            <input type="text" id="q-author" placeholder="作者">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="QuotePage.closeModal()">取消</button>
                        <button class="btn btn-primary" onclick="QuotePage.submit()">保存</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('quote-modal').addEventListener('click', (e) => {
            if (e.target.id === 'quote-modal') QuotePage.closeModal();
        });
    },

    closeModal() {
        const container = document.getElementById('modal-container');
        if (container) container.innerHTML = '';
    },

    async submit() {
        const quote_date = document.getElementById('q-date').value;
        const content = document.getElementById('q-content').value.trim();
        const author = document.getElementById('q-author').value.trim();
        if (!quote_date || !content) {
            Toast.error('请填写日期和内容');
            return;
        }
        const res = await ApiService.post('/jianshen/admin/quote/create', { quote_date, content, author });
        if (res.code === 0) {
            Toast.success('添加成功');
            this.closeModal();
            this.load();
        } else {
            Toast.error(res.msg);
        }
    },

    async remove(id) {
        if (!confirm('确定删除这条语录吗？')) return;
        const res = await ApiService.post(`/jianshen/admin/quote/delete?quote_id=${id}`);
        if (res.code === 0) { Toast.success('已删除'); this.load(); } else Toast.error(res.msg);
    }
};
