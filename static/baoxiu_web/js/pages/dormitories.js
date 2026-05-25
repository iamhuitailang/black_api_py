const DormitoriesPage = {
    currentPage: 1,
    pageSize: 10,

    render() {
        const user = AuthService.getCurrentUser();
        if (user?.role !== 'admin') {
            Router.navigate('home');
            return;
        }

        const app = document.getElementById('app');
        app.className = 'page has-header no-tabbar';
        app.innerHTML = `
            <div class="header">
                <div class="header-back" onclick="Router.back()">←</div>
                <div class="header-title">宿舍楼管理</div>
            </div>
            <div id="dormitoriesContent"></div>
            <div class="fab" id="addDormitory">+</div>
        `;

        this.bindEvents();
        this.loadDormitories();
    },

    bindEvents() {
        document.getElementById('addDormitory').onclick = () => this.showAddModal();
    },

    async loadDormitories() {
        const container = document.getElementById('dormitoriesContent');
        Utils.showLoading(container);

        try {
            const result = await ApiService.get('/baoxiu/dormitory/list/get', {
                page: this.currentPage,
                page_size: this.pageSize
            });
            if (result.code === 0) {
                this.renderDormitories(result.data);
            } else {
                Utils.showEmpty(container, '加载失败');
            }
        } catch (error) {
            Utils.showEmpty(container, '加载失败');
        }
    },

    renderDormitories(data) {
        const container = document.getElementById('dormitoriesContent');
        const items = data.items || [];

        if (items.length === 0) {
            Utils.showEmpty(container, '暂无宿舍楼');
            return;
        }

        container.innerHTML = items.map(d => `
            <div class="list-item" data-id="${d.id}">
                <div class="list-item-content">
                    <div class="list-item-title">${d.name}</div>
                    <div class="list-item-desc">${d.address || '无地址'} · ${d.floors}层 · 每层${d.rooms_per_floor}间</div>
                </div>
                <div class="list-item-extra">
                    <span class="badge ${d.status === 0 ? 'badge-success' : 'badge-secondary'}">${d.status_text}</span>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.list-item').forEach(item => {
            item.onclick = () => {
                const id = parseInt(item.dataset.id);
                this.showDormitoryActions(id);
            };
        });
    },

    showAddModal() {
        Utils.showModal({
            title: '添加宿舍楼',
            content: `
                <div class="form-group">
                    <label class="form-label">宿舍楼名称</label>
                    <input type="text" class="form-input" id="dormName" placeholder="如：1号宿舍楼">
                </div>
                <div class="form-group">
                    <label class="form-label">地址</label>
                    <input type="text" class="form-input" id="dormAddress" placeholder="请输入地址">
                </div>
                <div class="form-group">
                    <label class="form-label">楼层数</label>
                    <input type="number" class="form-input" id="dormFloors" value="6" min="1">
                </div>
                <div class="form-group">
                    <label class="form-label">每层房间数</label>
                    <input type="number" class="form-input" id="dormRooms" value="10" min="1">
                </div>
            `,
            onConfirm: async () => {
                const name = document.getElementById('dormName').value.trim();
                if (!name) {
                    Utils.showToast('请输入宿舍楼名称');
                    return;
                }

                try {
                    const result = await ApiService.post('/baoxiu/dormitory/create', {
                        name,
                        address: document.getElementById('dormAddress').value.trim(),
                        floors: parseInt(document.getElementById('dormFloors').value) || 6,
                        rooms_per_floor: parseInt(document.getElementById('dormRooms').value) || 10
                    });
                    if (result.code === 0) {
                        Utils.showToast('添加成功');
                        this.loadDormitories();
                    } else {
                        Utils.showToast(result.msg);
                    }
                } catch (e) {
                    Utils.showToast('添加失败');
                }
            }
        });
    },

    showDormitoryActions(dormId) {
        Utils.showSelectModal('宿舍楼操作', [
            { label: '编辑', value: 'edit' },
            { label: '启用', value: 'enable' },
            { label: '停用', value: 'disable' },
            { label: '删除', value: 'delete' }
        ], async (selected) => {
            if (selected.value === 'edit') {
                this.showEditModal(dormId);
            } else if (selected.value === 'delete') {
                Utils.showModal({
                    title: '确认删除',
                    content: '<p>确定要删除该宿舍楼吗？</p>',
                    onConfirm: async () => {
                        try {
                            const result = await ApiService.post(`/baoxiu/dormitory/delete?dormitory_id=${dormId}`);
                            if (result.code === 0) {
                                Utils.showToast('删除成功');
                                this.loadDormitories();
                            } else {
                                Utils.showToast(result.msg);
                            }
                        } catch (e) {
                            Utils.showToast('删除失败');
                        }
                    }
                });
            } else {
                const status = selected.value === 'enable' ? 0 : 1;
                try {
                    const result = await ApiService.post(`/baoxiu/dormitory/status/update?dormitory_id=${dormId}&status=${status}`);
                    if (result.code === 0) {
                        Utils.showToast('操作成功');
                        this.loadDormitories();
                    } else {
                        Utils.showToast(result.msg);
                    }
                } catch (e) {
                    Utils.showToast('操作失败');
                }
            }
        });
    },

    async showEditModal(dormId) {
        try {
            const result = await ApiService.get('/baoxiu/dormitory/detail/get', { dormitory_id: dormId });
            if (result.code !== 0 || !result.data) {
                Utils.showToast('加载失败');
                return;
            }

            const dorm = result.data;
            Utils.showModal({
                title: '编辑宿舍楼',
                content: `
                    <div class="form-group">
                        <label class="form-label">宿舍楼名称</label>
                        <input type="text" class="form-input" id="editDormName" value="${dorm.name}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">地址</label>
                        <input type="text" class="form-input" id="editDormAddress" value="${dorm.address || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">楼层数</label>
                        <input type="number" class="form-input" id="editDormFloors" value="${dorm.floors}" min="1">
                    </div>
                    <div class="form-group">
                        <label class="form-label">每层房间数</label>
                        <input type="number" class="form-input" id="editDormRooms" value="${dorm.rooms_per_floor}" min="1">
                    </div>
                `,
                onConfirm: async () => {
                    const name = document.getElementById('editDormName').value.trim();
                    if (!name) {
                        Utils.showToast('请输入宿舍楼名称');
                        return;
                    }

                    try {
                        const updateResult = await ApiService.post(`/baoxiu/dormitory/update?dormitory_id=${dormId}`, {
                            name,
                            address: document.getElementById('editDormAddress').value.trim(),
                            floors: parseInt(document.getElementById('editDormFloors').value) || 6,
                            rooms_per_floor: parseInt(document.getElementById('editDormRooms').value) || 10
                        });
                        if (updateResult.code === 0) {
                            Utils.showToast('更新成功');
                            this.loadDormitories();
                        } else {
                            Utils.showToast(updateResult.msg);
                        }
                    } catch (e) {
                        Utils.showToast('更新失败');
                    }
                }
            });
        } catch (e) {
            Utils.showToast('加载失败');
        }
    }
};
