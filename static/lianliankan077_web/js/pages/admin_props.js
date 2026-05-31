const AdminPropsPage = {
    props: [],
    page: 1,
    pageSize: 10,
    total: 0,
    editingProp: null,

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
                        <div class="admin-menu-item" onclick="AdminRouter.navigate('themes')">
                            <span>🎨</span> 主题管理
                        </div>
                        <div class="admin-menu-item active" onclick="AdminRouter.navigate('props')">
                            <span>🎒</span> 道具管理
                        </div>
                    </div>
                </div>
                <div class="admin-main">
                    <div class="admin-header">
                        <div class="admin-title">道具管理</div>
                        <button class="btn btn-primary" onclick="AdminPropsPage.showModal()">+ 新增道具</button>
                    </div>
                    <div class="admin-content">
                        <div class="admin-table-wrapper">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>图标</th>
                                        <th>名称</th>
                                        <th>效果类型</th>
                                        <th>效果值</th>
                                        <th>价格</th>
                                        <th>状态</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody id="propTableBody">
                                    <tr><td colspan="8" class="text-center"><div class="loading-spinner-small"></div></td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="admin-pagination" id="propPagination"></div>
                    </div>
                </div>
            </div>
            <div class="modal-overlay" id="propModal" style="display:none">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="propModalTitle">新增道具</h3>
                        <button class="modal-close" onclick="AdminPropsPage.hideModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">名称</label>
                            <input type="text" class="form-control" id="propName" placeholder="道具名称">
                        </div>
                        <div class="form-group">
                            <label class="form-label">图标(emoji)</label>
                            <input type="text" class="form-control" id="propIcon" placeholder="如: 💡">
                        </div>
                        <div class="form-group">
                            <label class="form-label">描述</label>
                            <input type="text" class="form-control" id="propDesc" placeholder="道具描述">
                        </div>
                        <div class="form-group">
                            <label class="form-label">效果类型</label>
                            <select class="form-control" id="propEffectType">
                                <option value="hint">提示</option>
                                <option value="shuffle">洗牌</option>
                                <option value="add_time">加时</option>
                                <option value="bomb">炸弹</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">效果值</label>
                            <input type="number" class="form-control" id="propEffectValue" value="1">
                        </div>
                        <div class="form-group">
                            <label class="form-label">价格</label>
                            <input type="number" class="form-control" id="propPrice" value="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">排序</label>
                            <input type="number" class="form-control" id="propSort" value="0">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="AdminPropsPage.hideModal()">取消</button>
                        <button class="btn btn-primary" onclick="AdminPropsPage.saveProp()">保存</button>
                    </div>
                </div>
            </div>
        `
        this.loadProps()
    },

    async loadProps() {
        try {
            const result = await AdminService.getAllProps(this.page, this.pageSize)
            if (result.code === 0 && result.data) {
                this.props = result.data.items
                this.total = result.data.total
                this.renderTable()
                this.renderPagination()
            }
        } catch (error) {
            Toast.error('加载失败')
        }
    },

    renderTable() {
        const tbody = document.getElementById('propTableBody')
        if (!this.props || this.props.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-secondary">暂无数据</td></tr>'
            return
        }
        const effectTypeNames = { hint: '提示', shuffle: '洗牌', add_time: '加时', bomb: '炸弹' }
        tbody.innerHTML = this.props.map(prop => `
            <tr>
                <td>${prop.id}</td>
                <td><span style="font-size:24px">${prop.icon}</span></td>
                <td>${prop.name}</td>
                <td>${effectTypeNames[prop.effect_type] || prop.effect_type}</td>
                <td>${prop.effect_value}</td>
                <td>${prop.price}</td>
                <td>${prop.status === 0 ? '<span class="badge badge-success">启用</span>' : '<span class="badge badge-secondary">禁用</span>'}</td>
                <td class="admin-actions">
                    <button class="btn btn-sm btn-outline" onclick="AdminPropsPage.editProp(${prop.id})">编辑</button>
                    ${prop.status === 0
                        ? `<button class="btn btn-sm btn-outline" onclick="AdminPropsPage.toggleStatus(${prop.id},1)">禁用</button>`
                        : `<button class="btn btn-sm btn-outline" onclick="AdminPropsPage.toggleStatus(${prop.id},0)">启用</button>`
                    }
                    <button class="btn btn-sm btn-danger" onclick="AdminPropsPage.deleteProp(${prop.id})">删除</button>
                </td>
            </tr>
        `).join('')
    },

    renderPagination() {
        const totalPages = Math.ceil(this.total / this.pageSize)
        const pagination = document.getElementById('propPagination')
        let html = ''
        if (this.page > 1) {
            html += `<button class="btn btn-sm btn-outline" onclick="AdminPropsPage.goPage(${this.page - 1})">上一页</button>`
        }
        html += `<span class="page-info">${this.page} / ${totalPages}</span>`
        if (this.page < totalPages) {
            html += `<button class="btn btn-sm btn-outline" onclick="AdminPropsPage.goPage(${this.page + 1})">下一页</button>`
        }
        pagination.innerHTML = html
    },

    goPage(p) {
        this.page = p
        this.loadProps()
    },

    showModal(prop = null) {
        this.editingProp = prop
        document.getElementById('propModalTitle').textContent = prop ? '编辑道具' : '新增道具'
        document.getElementById('propName').value = prop ? prop.name : ''
        document.getElementById('propIcon').value = prop ? prop.icon : ''
        document.getElementById('propDesc').value = prop ? prop.description : ''
        document.getElementById('propEffectType').value = prop ? prop.effect_type : 'hint'
        document.getElementById('propEffectValue').value = prop ? prop.effect_value : 1
        document.getElementById('propPrice').value = prop ? prop.price : 0
        document.getElementById('propSort').value = prop ? prop.sort_order : 0
        document.getElementById('propModal').style.display = 'flex'
    },

    hideModal() {
        document.getElementById('propModal').style.display = 'none'
        this.editingProp = null
    },

    editProp(id) {
        const prop = this.props.find(t => t.id === id)
        if (prop) this.showModal(prop)
    },

    async saveProp() {
        const data = {
            name: document.getElementById('propName').value.trim(),
            icon: document.getElementById('propIcon').value.trim(),
            description: document.getElementById('propDesc').value.trim(),
            effect_type: document.getElementById('propEffectType').value,
            effect_value: parseInt(document.getElementById('propEffectValue').value),
            price: parseInt(document.getElementById('propPrice').value),
            sort_order: parseInt(document.getElementById('propSort').value)
        }

        if (!data.name || !data.icon) {
            Toast.error('请填写完整信息')
            return
        }

        try {
            const result = this.editingProp
                ? await AdminService.updateProp(this.editingProp.id, data)
                : await AdminService.createProp(data)
            if (result.code === 0) {
                Toast.success('保存成功')
                this.hideModal()
                this.loadProps()
            } else {
                Toast.error(result.msg || '保存失败')
            }
        } catch (error) {
            Toast.error('保存失败')
        }
    },

    async toggleStatus(id, status) {
        try {
            const result = await AdminService.updatePropStatus(id, status)
            if (result.code === 0) {
                Toast.success('操作成功')
                this.loadProps()
            } else {
                Toast.error(result.msg || '操作失败')
            }
        } catch (error) {
            Toast.error('操作失败')
        }
    },

    async deleteProp(id) {
        if (!confirm('确定删除该道具吗？')) return
        try {
            const result = await AdminService.deleteProp(id)
            if (result.code === 0) {
                Toast.success('删除成功')
                this.loadProps()
            } else {
                Toast.error(result.msg || '删除失败')
            }
        } catch (error) {
            Toast.error('删除失败')
        }
    }
}
