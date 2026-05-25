const UsersPage = {
    currentPage: 1,
    pageSize: 10,
    currentFilter: {
        role: null
    },

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
                <div class="header-title">用户管理</div>
            </div>
            <div class="filter-bar">
                <div class="filter-item ${this.currentFilter.role === null ? 'active' : ''}" data-role="">全部</div>
                <div class="filter-item ${this.currentFilter.role === 'student' ? 'active' : ''}" data-role="student">学生</div>
                <div class="filter-item ${this.currentFilter.role === 'repairman' ? 'active' : ''}" data-role="repairman">维修工</div>
                <div class="filter-item ${this.currentFilter.role === 'admin' ? 'active' : ''}" data-role="admin">管理员</div>
            </div>
            <div id="usersContent"></div>
        `;

        this.bindEvents();
        this.loadUsers();
    },

    bindEvents() {
        document.querySelectorAll('.filter-item').forEach(item => {
            item.onclick = () => {
                document.querySelectorAll('.filter-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.currentFilter.role = item.dataset.role === '' ? null : item.dataset.role;
                this.currentPage = 1;
                this.loadUsers();
            };
        });
    },

    async loadUsers() {
        const container = document.getElementById('usersContent');
        Utils.showLoading(container);

        const params = {
            page: this.currentPage,
            page_size: this.pageSize
        };

        if (this.currentFilter.role) {
            params.role = this.currentFilter.role;
        }

        try {
            const result = await ApiService.get('/baoxiu/user/list/get', params);
            if (result.code === 0) {
                this.renderUsers(result.data);
            } else {
                Utils.showEmpty(container, '加载失败');
            }
        } catch (error) {
            Utils.showEmpty(container, '加载失败');
        }
    },

    renderUsers(data) {
        const container = document.getElementById('usersContent');
        const items = data.items || [];

        if (items.length === 0) {
            Utils.showEmpty(container, '暂无用户');
            return;
        }

        container.innerHTML = items.map(user => `
            <div class="list-item" data-id="${user.id}">
                <div class="avatar" style="margin-right: 12px;">${user.real_name?.charAt(0) || user.username?.charAt(0) || '?'}</div>
                <div class="list-item-content">
                    <div class="list-item-title">${user.real_name || user.username}</div>
                    <div class="list-item-desc">${user.username} · ${user.phone || '无手机号'} · ${user.role_text}</div>
                </div>
                <div class="list-item-extra">
                    <span class="badge ${user.status === 0 ? 'badge-success' : 'badge-secondary'}">${user.status_text}</span>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.list-item').forEach(item => {
            item.onclick = () => {
                const id = parseInt(item.dataset.id);
                this.showUserActions(id);
            };
        });
    },

    showUserActions(userId) {
        Utils.showSelectModal('用户操作', [
            { label: '启用账号', value: 'enable' },
            { label: '禁用账号', value: 'disable' }
        ], async (selected) => {
            const status = selected.value === 'enable' ? 0 : 1;
            try {
                const result = await ApiService.post(`/baoxiu/user/status/update?user_id=${userId}`, {
                    status
                });
                if (result.code === 0) {
                    Utils.showToast('操作成功');
                    this.loadUsers();
                } else {
                    Utils.showToast(result.msg);
                }
            } catch (e) {
                Utils.showToast('操作失败');
            }
        });
    }
};
