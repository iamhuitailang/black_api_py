const AdminUsersPage = {
    users: [],
    page: 1,
    pageSize: 10,
    total: 0,
    keyword: '',

    render() {
        const app = document.getElementById('app')
        app.innerHTML = `
            <div class="admin-layout">
                <div class="admin-sidebar">
                    <div class="admin-logo">🧩 管理后台</div>
                    <div class="admin-menu">
                        <div class="admin-menu-item" onclick="AdminRouter.navigate('dashboard')">
                            <span>📊</span> 数据统计
                        </div>
                        <div class="admin-menu-item active" onclick="AdminRouter.navigate('users')">
                            <span>👥</span> 用户管理
                        </div>
                        <div class="admin-menu-item" onclick="AdminRouter.navigate('themes')">
                            <span>🎨</span> 主题管理
                        </div>
                        <div class="admin-menu-item" onclick="AdminRouter.navigate('props')">
                            <span>🎒</span> 道具管理
                        </div>
                    </div>
                </div>
                <div class="admin-main">
                    <div class="admin-header">
                        <div class="admin-title">用户管理</div>
                        <div class="admin-search">
                            <input type="text" id="userSearch" class="form-control" placeholder="搜索用户..." onkeyup="if(event.key==='Enter')AdminUsersPage.doSearch()">
                            <button class="btn btn-sm btn-primary" onclick="AdminUsersPage.doSearch()">搜索</button>
                        </div>
                    </div>
                    <div class="admin-content">
                        <div class="admin-table-wrapper">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>用户名</th>
                                        <th>昵称</th>
                                        <th>总分</th>
                                        <th>游戏次数</th>
                                        <th>状态</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody id="userTableBody">
                                    <tr><td colspan="7" class="text-center"><div class="loading-spinner-small"></div></td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="admin-pagination" id="userPagination"></div>
                    </div>
                </div>
            </div>
        `
        this.loadUsers()
    },

    doSearch() {
        this.keyword = document.getElementById('userSearch').value.trim()
        this.page = 1
        this.loadUsers()
    },

    async loadUsers() {
        try {
            const result = await AdminService.getUsers(this.page, this.pageSize, null, this.keyword)
            if (result.code === 0 && result.data) {
                this.users = result.data.items
                this.total = result.data.total
                this.renderTable()
                this.renderPagination()
            }
        } catch (error) {
            Toast.error('加载失败')
        }
    },

    renderTable() {
        const tbody = document.getElementById('userTableBody')
        if (!this.users || this.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-secondary">暂无数据</td></tr>'
            return
        }
        tbody.innerHTML = this.users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.nickname || '-'}</td>
                <td>${user.total_score || 0}</td>
                <td>${user.games_played || 0}</td>
                <td>${user.status === 0 ? '<span class="badge badge-success">正常</span>' : '<span class="badge badge-danger">封禁</span>'}</td>
                <td class="admin-actions">
                    ${user.status === 0
                        ? `<button class="btn btn-sm btn-outline" onclick="AdminUsersPage.banUser(${user.id})">封禁</button>`
                        : `<button class="btn btn-sm btn-outline" onclick="AdminUsersPage.unbanUser(${user.id})">解封</button>`
                    }
                    <button class="btn btn-sm btn-danger" onclick="AdminUsersPage.deleteUser(${user.id})">删除</button>
                </td>
            </tr>
        `).join('')
    },

    renderPagination() {
        const totalPages = Math.ceil(this.total / this.pageSize)
        const pagination = document.getElementById('userPagination')
        let html = ''
        if (this.page > 1) {
            html += `<button class="btn btn-sm btn-outline" onclick="AdminUsersPage.goPage(${this.page - 1})">上一页</button>`
        }
        html += `<span class="page-info">${this.page} / ${totalPages}</span>`
        if (this.page < totalPages) {
            html += `<button class="btn btn-sm btn-outline" onclick="AdminUsersPage.goPage(${this.page + 1})">下一页</button>`
        }
        pagination.innerHTML = html
    },

    goPage(p) {
        this.page = p
        this.loadUsers()
    },

    async banUser(userId) {
        if (!confirm('确定封禁该用户吗？')) return
        try {
            const result = await AdminService.banUser(userId)
            if (result.code === 0) {
                Toast.success('封禁成功')
                this.loadUsers()
            } else {
                Toast.error(result.msg || '操作失败')
            }
        } catch (error) {
            Toast.error('操作失败')
        }
    },

    async unbanUser(userId) {
        if (!confirm('确定解封该用户吗？')) return
        try {
            const result = await AdminService.unbanUser(userId)
            if (result.code === 0) {
                Toast.success('解封成功')
                this.loadUsers()
            } else {
                Toast.error(result.msg || '操作失败')
            }
        } catch (error) {
            Toast.error('操作失败')
        }
    },

    async deleteUser(userId) {
        if (!confirm('确定删除该用户吗？此操作不可恢复！')) return
        try {
            const result = await AdminService.deleteUser(userId)
            if (result.code === 0) {
                Toast.success('删除成功')
                this.loadUsers()
            } else {
                Toast.error(result.msg || '操作失败')
            }
        } catch (error) {
            Toast.error('操作失败')
        }
    }
}
