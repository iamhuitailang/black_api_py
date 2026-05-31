const AdminPetsPage = {
    currentPage: 1, pageSize: 10,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div style="display:flex;min-height:100vh">
                ${AdminDashboardPage.renderSidebar('pets')}
                <div class="admin-main">
                    <div class="admin-header"><h2 class="admin-page-title">宠物管理</h2></div>
                    <div id="petTable">加载中...</div>
                </div>
            </div>
        `;
        AdminDashboardPage.bindSidebar();
        await this.loadPets();
    },

    async loadPets() {
        try {
            const result = await ApiService.get('/chongwu09/pet/admin/list/get', { page: this.currentPage, page_size: this.pageSize });
            if (result.code === 0) {
                const items = result.data.items || [];
                document.getElementById('petTable').innerHTML = `
                    <table class="admin-table">
                        <thead><tr><th>ID</th><th>名称</th><th>类型</th><th>品种</th><th>年龄</th><th>性别</th><th>疫苗</th><th>主人ID</th><th>操作</th></tr></thead>
                        <tbody>
                            ${items.map(p => `
                                <tr>
                                    <td>${p.id}</td>
                                    <td>${p.name}</td>
                                    <td>${p.pet_type_name}</td>
                                    <td>${p.breed || '-'}</td>
                                    <td>${p.age || '-'}</td>
                                    <td>${p.gender || '-'}</td>
                                    <td>${p.vaccine_status ? '✅' : '❌'}</td>
                                    <td>${p.user_id}</td>
                                    <td><button class="btn btn-outline btn-sm" data-delete="${p.id}" style="color:var(--danger-color);border-color:var(--danger-color)">删除</button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="pagination">共 ${result.data.total} 条</div>
                `;
                document.querySelectorAll('[data-delete]').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        if (!confirm('确定删除？')) return;
                        try {
                            const result = await ApiService.post('/chongwu09/pet/admin/delete', { pet_id: parseInt(btn.dataset.delete) });
                            if (result.code === 0) { Toast.success('删除成功'); this.loadPets(); }
                            else { Toast.error(result.msg); }
                        } catch (e) { Toast.error('操作失败'); }
                    });
                });
            }
        } catch (e) { document.getElementById('petTable').innerHTML = '加载失败'; }
    }
};
