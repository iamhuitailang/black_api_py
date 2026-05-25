const CheckinPage = {
    state: { page: 1, pageSize: 10, keyword: '', userId: '' },

    async render() {
        if (!AuthService.requireAuth()) return;
        Layout.render('<div class="loading"><div class="spinner"></div></div>', '打卡记录');
        await this.load();
    },

    async load() {
        try {
            const params = { page: this.state.page, page_size: this.state.pageSize };
            if (this.state.keyword) params.keyword = this.state.keyword;
            if (this.state.userId) params.user_id = this.state.userId;
            const res = await ApiService.get('/jianshen/admin/checkin/list/get', params);
            if (res.code === 0) this.renderList(res.data);
        } catch (e) { console.error(e); }
    },

    renderList(data) {
        const rows = (data.items || []).map(c => {
            let projects = '';
            try { projects = JSON.parse(c.projects || '[]').join('、'); } catch (e) { projects = c.projects || ''; }
            return `
                <tr>
                    <td>${c.id}</td>
                    <td>${c.username || c.user_id}</td>
                    <td>${c.checkin_date}</td>
                    <td>${projects || '-'}</td>
                    <td>${c.duration || 0} 分钟</td>
                    <td>${c.calories || 0} kcal</td>
                    <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${c.remark || '-'}</td>
                    <td><button class="btn btn-danger btn-sm" onclick="CheckinPage.remove(${c.id})">删除</button></td>
                </tr>`;
        }).join('');
        Layout.renderPage(`
            <div class="card">
                <div class="card-header"><h2>📝 打卡记录 (${data.total})</h2></div>
                <div class="toolbar">
                    <input class="search-input" placeholder="搜索备注/项目/日期" value="${this.state.keyword}" id="ci-search">
                    <input class="search-input" style="flex: 0 0 140px;" placeholder="用户ID" value="${this.state.userId}" id="ci-user">
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead><tr><th>ID</th><th>用户</th><th>日期</th><th>项目</th><th>时长</th><th>消耗</th><th>备注</th><th>操作</th></tr></thead>
                        <tbody>${rows || '<tr><td colspan="8" class="empty">暂无数据</td></tr>'}</tbody>
                    </table>
                </div>
                <div class="pagination">
                    <span class="info">共 ${data.total} 条</span>
                    <button class="page-btn" ${data.page <= 1 ? 'disabled' : ''} onclick="CheckinPage.changePage(${data.page - 1})">上一页</button>
                    <button class="page-btn active">${data.page} / ${data.total_pages || 1}</button>
                    <button class="page-btn" ${data.page >= data.total_pages ? 'disabled' : ''} onclick="CheckinPage.changePage(${data.page + 1})">下一页</button>
                </div>
            </div>
        `, '打卡记录');
        document.getElementById('ci-search').addEventListener('change', (e) => { this.state.keyword = e.target.value; this.state.page = 1; this.load(); });
        document.getElementById('ci-user').addEventListener('change', (e) => { this.state.userId = e.target.value; this.state.page = 1; this.load(); });
    },

    changePage(p) { this.state.page = p; this.load(); },

    async remove(id) {
        if (!confirm('确定删除这条打卡记录吗？')) return;
        const res = await ApiService.post(`/jianshen/admin/checkin/delete?checkin_id=${id}`);
        if (res.code === 0) { Toast.success('已删除'); this.load(); } else Toast.error(res.msg);
    }
};
