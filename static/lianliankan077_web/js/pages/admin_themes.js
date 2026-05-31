const AdminThemesPage = {
    themes: [],
    page: 1,
    pageSize: 10,
    total: 0,
    editingTheme: null,

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
                        <div class="admin-menu-item" onclick="AdminRouter.navigate('users')">
                            <span>👥</span> 用户管理
                        </div>
                        <div class="admin-menu-item active" onclick="AdminRouter.navigate('themes')">
                            <span>🎨</span> 主题管理
                        </div>
                        <div class="admin-menu-item" onclick="AdminRouter.navigate('props')">
                            <span>🎒</span> 道具管理
                        </div>
                    </div>
                </div>
                <div class="admin-main">
                    <div class="admin-header">
                        <div class="admin-title">主题管理</div>
                        <button class="btn btn-primary" onclick="AdminThemesPage.showModal()">+ 新增主题</button>
                    </div>
                    <div class="admin-content">
                        <div class="admin-table-wrapper">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>图标</th>
                                        <th>名称</th>
                                        <th>规格</th>
                                        <th>难度</th>
                                        <th>状态</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody id="themeTableBody">
                                    <tr><td colspan="7" class="text-center"><div class="loading-spinner-small"></div></td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="admin-pagination" id="themePagination"></div>
                    </div>
                </div>
            </div>
            <div class="modal-overlay" id="themeModal" style="display:none">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modalTitle">新增主题</h3>
                        <button class="modal-close" onclick="AdminThemesPage.hideModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">名称</label>
                            <input type="text" class="form-control" id="themeName" placeholder="主题名称">
                        </div>
                        <div class="form-group">
                            <label class="form-label">图标(emoji)</label>
                            <input type="text" class="form-control" id="themeIcon" placeholder="如: 🎨">
                        </div>
                        <div class="form-group">
                            <label class="form-label">描述</label>
                            <input type="text" class="form-control" id="themeDesc" placeholder="主题描述">
                        </div>
                        <div class="form-group">
                            <label class="form-label">元素列表(JSON数组)</label>
                            <textarea class="form-control" id="themeItems" rows="3" placeholder='["🐶","🐱","🐰",...]</textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">行数</label>
                                <input type="number" class="form-control" id="themeRows" value="4">
                            </div>
                            <div class="form-group">
                                <label class="form-label">列数</label>
                                <input type="number" class="form-control" id="themeCols" value="6">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">难度等级</label>
                            <input type="number" class="form-control" id="themeDifficulty" value="1" min="1" max="5">
                        </div>
                        <div class="form-group">
                            <label class="form-label">排序</label>
                            <input type="number" class="form-control" id="themeSort" value="0">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="AdminThemesPage.hideModal()">取消</button>
                        <button class="btn btn-primary" onclick="AdminThemesPage.saveTheme()">保存</button>
                    </div>
                </div>
            </div>
        `
        this.loadThemes()
    },

    async loadThemes() {
        try {
            const result = await AdminService.getAllThemes(this.page, this.pageSize)
            if (result.code === 0 && result.data) {
                this.themes = result.data.items
                this.total = result.data.total
                this.renderTable()
                this.renderPagination()
            }
        } catch (error) {
            Toast.error('加载失败')
        }
    },

    renderTable() {
        const tbody = document.getElementById('themeTableBody')
        if (!this.themes || this.themes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-secondary">暂无数据</td></tr>'
            return
        }
        tbody.innerHTML = this.themes.map(theme => `
            <tr>
                <td>${theme.id}</td>
                <td><span style="font-size:24px">${theme.icon}</span></td>
                <td>${theme.name}</td>
                <td>${theme.rows}×${theme.cols}</td>
                <td>${theme.difficulty}</td>
                <td>${theme.status === 0 ? '<span class="badge badge-success">启用</span>' : '<span class="badge badge-secondary">禁用</span>'}</td>
                <td class="admin-actions">
                    <button class="btn btn-sm btn-outline" onclick="AdminThemesPage.editTheme(${theme.id})">编辑</button>
                    ${theme.status === 0
                        ? `<button class="btn btn-sm btn-outline" onclick="AdminThemesPage.toggleStatus(${theme.id},1)">禁用</button>`
                        : `<button class="btn btn-sm btn-outline" onclick="AdminThemesPage.toggleStatus(${theme.id},0)">启用</button>`
                    }
                    <button class="btn btn-sm btn-danger" onclick="AdminThemesPage.deleteTheme(${theme.id})">删除</button>
                </td>
            </tr>
        `).join('')
    },

    renderPagination() {
        const totalPages = Math.ceil(this.total / this.pageSize)
        const pagination = document.getElementById('themePagination')
        let html = ''
        if (this.page > 1) {
            html += `<button class="btn btn-sm btn-outline" onclick="AdminThemesPage.goPage(${this.page - 1})">上一页</button>`
        }
        html += `<span class="page-info">${this.page} / ${totalPages}</span>`
        if (this.page < totalPages) {
            html += `<button class="btn btn-sm btn-outline" onclick="AdminThemesPage.goPage(${this.page + 1})">下一页</button>`
        }
        pagination.innerHTML = html
    },

    goPage(p) {
        this.page = p
        this.loadThemes()
    },

    showModal(theme = null) {
        this.editingTheme = theme
        document.getElementById('modalTitle').textContent = theme ? '编辑主题' : '新增主题'
        document.getElementById('themeName').value = theme ? theme.name : ''
        document.getElementById('themeIcon').value = theme ? theme.icon : ''
        document.getElementById('themeDesc').value = theme ? theme.description : ''
        document.getElementById('themeItems').value = theme ? theme.items_json : ''
        document.getElementById('themeRows').value = theme ? theme.rows : 4
        document.getElementById('themeCols').value = theme ? theme.cols : 6
        document.getElementById('themeDifficulty').value = theme ? theme.difficulty : 1
        document.getElementById('themeSort').value = theme ? theme.sort_order : 0
        document.getElementById('themeModal').style.display = 'flex'
    },

    hideModal() {
        document.getElementById('themeModal').style.display = 'none'
        this.editingTheme = null
    },

    editTheme(id) {
        const theme = this.themes.find(t => t.id === id)
        if (theme) this.showModal(theme)
    },

    async saveTheme() {
        const data = {
            name: document.getElementById('themeName').value.trim(),
            icon: document.getElementById('themeIcon').value.trim(),
            description: document.getElementById('themeDesc').value.trim(),
            items_json: document.getElementById('themeItems').value.trim(),
            rows: parseInt(document.getElementById('themeRows').value),
            cols: parseInt(document.getElementById('themeCols').value),
            difficulty: parseInt(document.getElementById('themeDifficulty').value),
            sort_order: parseInt(document.getElementById('themeSort').value)
        }

        if (!data.name || !data.icon || !data.items_json) {
            Toast.error('请填写完整信息')
            return
        }

        try {
            const result = this.editingTheme
                ? await AdminService.updateTheme(this.editingTheme.id, data)
                : await AdminService.createTheme(data)
            if (result.code === 0) {
                Toast.success('保存成功')
                this.hideModal()
                this.loadThemes()
            } else {
                Toast.error(result.msg || '保存失败')
            }
        } catch (error) {
            Toast.error('保存失败')
        }
    },

    async toggleStatus(id, status) {
        try {
            const result = await AdminService.updateThemeStatus(id, status)
            if (result.code === 0) {
                Toast.success('操作成功')
                this.loadThemes()
            } else {
                Toast.error(result.msg || '操作失败')
            }
        } catch (error) {
            Toast.error('操作失败')
        }
    },

    async deleteTheme(id) {
        if (!confirm('确定删除该主题吗？')) return
        try {
            const result = await AdminService.deleteTheme(id)
            if (result.code === 0) {
                Toast.success('删除成功')
                this.loadThemes()
            } else {
                Toast.error(result.msg || '删除失败')
            }
        } catch (error) {
            Toast.error('删除失败')
        }
    }
}
