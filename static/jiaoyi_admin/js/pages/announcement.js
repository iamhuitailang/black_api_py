const AnnouncementPage = {
    data: {
        list: [],
        total: 0,
        page: 1,
        pageSize: 10
    },

    render() {
        const token = Storage.getToken();
        if (!token) {
            Router.navigate('login');
            return;
        }

        const content = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">公告管理</h3>
                    <button class="btn btn-primary" id="addBtn">+ 发布公告</button>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>标题</th>
                                    <th>类型</th>
                                    <th>状态</th>
                                    <th>发布时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="announcementTable">
                                <tr><td colspan="6" class="text-center text-secondary">加载中...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination">
                        <div class="pagination-info" id="paginationInfo"></div>
                        <div class="pagination-buttons" id="paginationButtons"></div>
                    </div>
                </div>
            </div>

            <div id="modalContainer"></div>
        `;

        Layout.render(content, 'announcement');
        this.bindEvents();
        this.loadData();
    },

    bindEvents() {
        document.getElementById('addBtn').addEventListener('click', () => {
            this.showModal();
        });
    },

    async loadData() {
        try {
            const result = await Api.get('/announcements', {
                page: this.data.page,
                page_size: this.data.pageSize
            });

            if (result.code === 200) {
                this.data.list = result.data.list || result.data || [];
                this.data.total = result.data.total || this.data.list.length;
                this.renderTable();
                this.renderPagination();
            }
        } catch (error) {
            console.error('加载公告数据失败:', error);
        }
    },

    renderTable() {
        const tbody = document.getElementById('announcementTable');
        if (this.data.list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary">暂无公告数据</td></tr>';
            return;
        }

        const typeMap = {
            system: { text: '系统公告', class: 'badge-info' },
            activity: { text: '活动公告', class: 'badge-primary' },
            other: { text: '其他', class: 'badge-secondary' }
        };

        tbody.innerHTML = this.data.list.map(announcement => {
            const type = typeMap[announcement.type] || { text: announcement.type, class: 'badge-secondary' };
            return `
                <tr>
                    <td>${announcement.id}</td>
                    <td>${Layout.escapeHtml(announcement.title || '-')}</td>
                    <td><span class="badge ${type.class}">${type.text}</span></td>
                    <td>
                        <span class="badge ${announcement.status === 1 ? 'badge-success' : 'badge-secondary'}">
                            ${announcement.status === 1 ? '已发布' : '草稿'}
                        </span>
                    </td>
                    <td>${Layout.formatDate(announcement.created_at)}</td>
                    <td>
                        <div class="actions">
                            <button class="btn btn-outline btn-sm" onclick="AnnouncementPage.editAnnouncement(${announcement.id})">编辑</button>
                            <button class="btn btn-danger btn-sm" onclick="AnnouncementPage.deleteAnnouncement(${announcement.id})">删除</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    renderPagination() {
        const totalPages = Math.ceil(this.data.total / this.data.pageSize);
        const start = (this.data.page - 1) * this.data.pageSize + 1;
        const end = Math.min(this.data.page * this.data.pageSize, this.data.total);

        document.getElementById('paginationInfo').textContent =
            `共 ${this.data.total} 条，显示 ${start}-${end} 条`;

        let buttons = '';
        buttons += `<button class="pagination-btn" ${this.data.page === 1 ? 'disabled' : ''} onclick="AnnouncementPage.goToPage(${this.data.page - 1})">上一页</button>`;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.data.page - 2 && i <= this.data.page + 2)) {
                buttons += `<button class="pagination-btn ${i === this.data.page ? 'active' : ''}" onclick="AnnouncementPage.goToPage(${i})">${i}</button>`;
            } else if (i === this.data.page - 3 || i === this.data.page + 3) {
                buttons += '<span class="pagination-btn">...</span>';
            }
        }

        buttons += `<button class="pagination-btn" ${this.data.page === totalPages ? 'disabled' : ''} onclick="AnnouncementPage.goToPage(${this.data.page + 1})">下一页</button>`;

        document.getElementById('paginationButtons').innerHTML = buttons;
    },

    goToPage(page) {
        this.data.page = page;
        this.loadData();
    },

    showModal(announcement = null) {
        const isEdit = announcement !== null;
        const modalHtml = `
            <div class="modal-overlay" onclick="if(event.target === this) AnnouncementPage.closeModal()">
                <div class="modal" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3 class="modal-title">${isEdit ? '编辑公告' : '发布公告'}</h3>
                        <span class="modal-close" onclick="AnnouncementPage.closeModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="announcementForm">
                            <div class="form-group">
                                <label class="form-label">标题</label>
                                <input type="text" class="form-control" id="announcementTitle" value="${isEdit ? Layout.escapeHtml(announcement.title || '') : ''}" placeholder="请输入公告标题">
                            </div>
                            <div class="form-group">
                                <label class="form-label">类型</label>
                                <select class="form-control" id="announcementType">
                                    <option value="system" ${isEdit && announcement.type === 'system' ? 'selected' : ''}>系统公告</option>
                                    <option value="activity" ${isEdit && announcement.type === 'activity' ? 'selected' : ''}>活动公告</option>
                                    <option value="other" ${isEdit && announcement.type === 'other' ? 'selected' : ''}>其他</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">内容</label>
                                <textarea class="form-control" id="announcementContent" rows="5" placeholder="请输入公告内容">${isEdit ? Layout.escapeHtml(announcement.content || '') : ''}</textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">状态</label>
                                <select class="form-control" id="announcementStatus">
                                    <option value="1" ${isEdit && announcement.status === 1 ? 'selected' : ''}>已发布</option>
                                    <option value="0" ${isEdit && announcement.status === 0 ? 'selected' : ''}>草稿</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="AnnouncementPage.closeModal()">取消</button>
                        <button class="btn btn-primary" onclick="AnnouncementPage.saveAnnouncement(${isEdit ? announcement.id : 'null'})">保存</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('modalContainer').innerHTML = modalHtml;
    },

    editAnnouncement(id) {
        const announcement = this.data.list.find(a => a.id === id);
        if (announcement) {
            this.showModal(announcement);
        }
    },

    async saveAnnouncement(id) {
        try {
            const data = {
                title: document.getElementById('announcementTitle').value,
                type: document.getElementById('announcementType').value,
                content: document.getElementById('announcementContent').value,
                status: parseInt(document.getElementById('announcementStatus').value)
            };

            let result;
            if (id) {
                result = await Api.put(`/announcements/${id}`, data);
            } else {
                result = await Api.post('/announcements', data);
            }

            if (result.code === 200) {
                Toast.success('保存成功');
                this.closeModal();
                this.loadData();
            }
        } catch (error) {
            console.error('保存失败:', error);
        }
    },

    async deleteAnnouncement(id) {
        if (!confirm('确定要删除此公告吗？')) return;

        try {
            const result = await Api.delete(`/announcements/${id}`);
            if (result.code === 200) {
                Toast.success('删除成功');
                this.loadData();
            }
        } catch (error) {
            console.error('删除失败:', error);
        }
    },

    closeModal() {
        document.getElementById('modalContainer').innerHTML = '';
    }
};
