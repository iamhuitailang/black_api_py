const AdminServicesPage = {
    currentPage: 1, pageSize: 10, services: [], showForm: false,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div style="display:flex;min-height:100vh">
                ${AdminDashboardPage.renderSidebar('services')}
                <div class="admin-main">
                    <div class="admin-header">
                        <h2 class="admin-page-title">服务管理</h2>
                        <button class="btn btn-primary btn-sm" id="addServiceBtn">+ 新增服务</button>
                    </div>
                    <div id="serviceTable">加载中...</div>
                </div>
            </div>
        `;
        AdminDashboardPage.bindSidebar();
        document.getElementById('addServiceBtn').addEventListener('click', () => this.showServiceForm());
        await this.loadServices();
    },

    async loadServices() {
        try {
            const result = await ApiService.get('/chongwu09/service/admin/list/get', { page: this.currentPage, page_size: this.pageSize });
            if (result.code === 0) {
                this.services = result.data.items || [];
                const total = result.data.total;
                document.getElementById('serviceTable').innerHTML = `
                    <table class="admin-table">
                        <thead><tr><th>ID</th><th>名称</th><th>类型</th><th>价格</th><th>容量</th><th>状态</th><th>操作</th></tr></thead>
                        <tbody>
                            ${this.services.map(s => `
                                <tr>
                                    <td>${s.id}</td>
                                    <td>${s.title}</td>
                                    <td>${s.type_name}</td>
                                    <td>¥${s.price}/${s.price_unit}</td>
                                    <td>${s.current_booked}/${s.capacity}</td>
                                    <td><span class="badge ${s.status === 0 ? 'badge-success' : 'badge-secondary'}">${s.status === 0 ? '启用' : '禁用'}</span></td>
                                    <td>
                                        <button class="btn btn-outline btn-sm" data-edit="${s.id}">编辑</button>
                                        <button class="btn btn-outline btn-sm" data-toggle="${s.id}" style="color:var(--warning-color);border-color:var(--warning-color)">${s.status === 0 ? '禁用' : '启用'}</button>
                                        <button class="btn btn-outline btn-sm" data-delete="${s.id}" style="color:var(--danger-color);border-color:var(--danger-color)">删除</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="pagination">共 ${total} 条</div>
                `;
                this.bindTableEvents();
            }
        } catch (e) { document.getElementById('serviceTable').innerHTML = '加载失败'; }
    },

    bindTableEvents() {
        document.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => {
                const service = this.services.find(s => s.id === parseInt(btn.dataset.edit));
                if (service) this.showServiceForm(service);
            });
        });
        document.querySelectorAll('[data-toggle]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const service = this.services.find(s => s.id === parseInt(btn.dataset.toggle));
                if (!service) return;
                const newStatus = service.status === 0 ? 1 : 0;
                try {
                    const result = await ApiService.post('/chongwu09/service/update', { service_id: service.id, status: newStatus });
                    if (result.code === 0) { Toast.success('操作成功'); this.loadServices(); }
                    else { Toast.error(result.msg); }
                } catch (e) { Toast.error('操作失败'); }
            });
        });
        document.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('确定删除该服务？')) return;
                try {
                    const result = await ApiService.post('/chongwu09/service/delete', { service_id: parseInt(btn.dataset.delete) });
                    if (result.code === 0) { Toast.success('删除成功'); this.loadServices(); }
                    else { Toast.error(result.msg); }
                } catch (e) { Toast.error('删除失败'); }
            });
        });
    },

    showServiceForm(service = null) {
        const isEdit = !!service;
        const modal = document.createElement('div');
        modal.id = 'serviceModal';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:center;justify-content:center';
        modal.innerHTML = `
            <div style="background:var(--card-bg);border-radius:12px;padding:24px;width:90%;max-width:500px;max-height:80vh;overflow-y:auto">
                <h3 style="margin-bottom:16px">${isEdit ? '编辑服务' : '新增服务'}</h3>
                <div class="admin-form-group"><label class="admin-form-label">服务名称</label><input type="text" class="admin-form-control" id="svcTitle" value="${isEdit ? service.title : ''}"></div>
                <div class="admin-form-group"><label class="admin-form-label">服务类型</label>
                    <select class="admin-form-control" id="svcType">
                        <option value="daycare" ${isEdit && service.type === 'daycare' ? 'selected' : ''}>日间寄养</option>
                        <option value="boarding" ${isEdit && service.type === 'boarding' ? 'selected' : ''}>长期寄养</option>
                        <option value="grooming" ${isEdit && service.type === 'grooming' ? 'selected' : ''}>美容洗护</option>
                        <option value="walking" ${isEdit && service.type === 'walking' ? 'selected' : ''}>遛宠服务</option>
                        <option value="vet" ${isEdit && service.type === 'vet' ? 'selected' : ''}>医疗陪护</option>
                    </select>
                </div>
                <div class="admin-form-group"><label class="admin-form-label">价格</label><input type="number" class="admin-form-control" id="svcPrice" value="${isEdit ? service.price : ''}"></div>
                <div class="admin-form-group"><label class="admin-form-label">价格单位</label><input type="text" class="admin-form-control" id="svcPriceUnit" value="${isEdit ? service.price_unit : '天'}"></div>
                <div class="admin-form-group"><label class="admin-form-label">容量</label><input type="number" class="admin-form-control" id="svcCapacity" value="${isEdit ? service.capacity : 10}"></div>
                <div class="admin-form-group"><label class="admin-form-label">地址</label><input type="text" class="admin-form-control" id="svcAddress" value="${isEdit ? (service.address || '') : ''}"></div>
                <div class="admin-form-group"><label class="admin-form-label">描述</label><textarea class="admin-form-control" id="svcDesc" rows="3">${isEdit ? (service.description || '') : ''}</textarea></div>
                <div style="display:flex;gap:12px">
                    <button class="btn btn-outline btn-block" id="cancelSvc">取消</button>
                    <button class="btn btn-primary btn-block" id="saveSvc">${isEdit ? '保存' : '创建'}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        document.getElementById('cancelSvc').addEventListener('click', () => modal.remove());
        document.getElementById('saveSvc').addEventListener('click', async () => {
            const title = document.getElementById('svcTitle').value.trim();
            if (!title) { Toast.error('请输入服务名称'); return; }
            const data = {
                title,
                type: document.getElementById('svcType').value,
                price: parseFloat(document.getElementById('svcPrice').value) || 0,
                price_unit: document.getElementById('svcPriceUnit').value.trim() || '天',
                capacity: parseInt(document.getElementById('svcCapacity').value) || 10,
                address: document.getElementById('svcAddress').value.trim(),
                description: document.getElementById('svcDesc').value.trim()
            };
            try {
                let result;
                if (isEdit) {
                    result = await ApiService.post('/chongwu09/service/update', { service_id: service.id, ...data });
                } else {
                    result = await ApiService.post('/chongwu09/service/create', data);
                }
                if (result.code === 0) { Toast.success(isEdit ? '保存成功' : '创建成功'); modal.remove(); this.loadServices(); }
                else { Toast.error(result.msg); }
            } catch (e) { Toast.error('操作失败'); }
        });
    }
};
