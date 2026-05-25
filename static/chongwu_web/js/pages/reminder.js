const ReminderPage = {
    petId: null,
    records: [],

    render() {
        this.petId = Storage.getCurrentPetId();
        if (!this.petId) {
            this.renderNoPet();
            return;
        }

        this.loadRecords();
    },

    renderNoPet() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="paw-bg"></div>
            <div class="page has-header">
                <div class="header">
                    <div class="header-title"><span class="paw-icon">⏰</span>提醒事项</div>
                </div>
                <div class="empty-state">
                    <div class="empty-icon">🐾</div>
                    <div class="empty-text">请先选择一只宠物</div>
                    <div class="empty-hint">回到首页点击宠物卡片查看提醒</div>
                    <button class="btn btn-primary" id="go-home-btn" style="margin-top:12px;">去首页</button>
                </div>
                <div class="tabbar">
                    <div class="tabbar-item" data-page="home">
                        <div class="tab-icon">🏠</div>
                        <div class="tab-label">首页</div>
                    </div>
                    <div class="tabbar-item" data-page="photos">
                        <div class="tab-icon">📷</div>
                        <div class="tab-label">萌照</div>
                    </div>
                    <div class="tabbar-item active">
                        <div class="tab-icon">⏰</div>
                        <div class="tab-label">提醒</div>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('go-home-btn').addEventListener('click', () => Router.navigate('home'));
        document.querySelectorAll('.tabbar-item[data-page]').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page === Router.getCurrentRoute()) return;
                Router.navigate(page);
            });
        });
    },

    async loadRecords() {
        this.showLoading();

        try {
            const result = await ChongwuApi.getReminderList({ pet_id: this.petId, page: 1, page_size: 50 });
            if (result.code === 0) {
                this.records = result.data.items || [];
                this.renderPage();
            } else {
                this.renderPage();
            }
        } catch (e) {
            console.error(e);
            this.renderPage();
        }
    },

    showLoading() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="paw-bg"></div>
            <div class="page has-header">
                <div class="header">
                    <div class="header-back" id="back-btn">←</div>
                    <div class="header-title"><span class="paw-icon">⏰</span>提醒事项</div>
                    <div class="header-action" id="add-btn">+</div>
                </div>
                <div class="loading"><div class="spinner"></div><span>加载中...</span></div>
                <div class="tabbar">
                    <div class="tabbar-item" data-page="home">
                        <div class="tab-icon">🏠</div>
                        <div class="tab-label">首页</div>
                    </div>
                    <div class="tabbar-item" data-page="photos">
                        <div class="tab-icon">📷</div>
                        <div class="tab-label">萌照</div>
                    </div>
                    <div class="tabbar-item active">
                        <div class="tab-icon">⏰</div>
                        <div class="tab-label">提醒</div>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('back-btn').addEventListener('click', () => Router.back());
        document.getElementById('add-btn').addEventListener('click', () => this.showForm());
        document.querySelectorAll('.tabbar-item[data-page]').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page === Router.getCurrentRoute()) return;
                Router.navigate(page);
            });
        });
    },

    renderPage() {
        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="paw-bg"></div>
            <div class="page has-header">
                <div class="header">
                    <div class="header-back" id="back-btn">←</div>
                    <div class="header-title"><span class="paw-icon">⏰</span>提醒事项</div>
                    <div class="header-action" id="add-btn">+</div>
                </div>

                ${this.records.length > 0 ? this.records.map(r => this.renderRecord(r)).join('') : `
                    <div class="empty-state">
                        <div class="empty-icon">⏰</div>
                        <div class="empty-text">暂无提醒</div>
                        <div class="empty-hint">添加提醒不错过每一个重要时刻</div>
                    </div>
                `}

                <div class="tabbar">
                    <div class="tabbar-item ${Router.getCurrentRoute() === 'home' ? 'active' : ''}" data-page="home">
                        <div class="tab-icon">🏠</div>
                        <div class="tab-label">首页</div>
                    </div>
                    <div class="tabbar-item ${Router.getCurrentRoute() === 'photos' ? 'active' : ''}" data-page="photos">
                        <div class="tab-icon">📷</div>
                        <div class="tab-label">萌照</div>
                    </div>
                    <div class="tabbar-item active">
                        <div class="tab-icon">⏰</div>
                        <div class="tab-label">提醒</div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('back-btn').addEventListener('click', () => Router.back());
        document.getElementById('add-btn').addEventListener('click', () => this.showForm());

        document.querySelectorAll('.tabbar-item[data-page]').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page === Router.getCurrentRoute()) return;
                Router.navigate(page);
            });
        });

        this.records.forEach(r => {
            const editBtn = document.getElementById(`edit-reminder-${r.id}`);
            const deleteBtn = document.getElementById(`delete-reminder-${r.id}`);
            if (editBtn) editBtn.addEventListener('click', (e) => { e.stopPropagation(); this.showForm(r); });
            if (deleteBtn) deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); this.deleteRecord(r.id); });
        });
    },

    renderRecord(r) {
        return `
            <div class="card">
                <div class="card-title"><span class="title-icon">⏰</span>${r.title}</div>
                <div style="display: flex; gap: 16px; margin-bottom: 8px;">
                    <div style="flex: 1;">
                        <div style="font-size: 12px; color: var(--text-secondary);">提醒时间</div>
                        <div style="font-size: 16px; font-weight: 600; color: var(--primary-pink-dark);">${r.reminder_time}</div>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-size: 12px; color: var(--text-secondary);">重复</div>
                        <div style="font-size: 14px;">${r.repeat_text}</div>
                    </div>
                </div>
                ${r.notes ? `<div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">📝 ${r.notes}</div>` : ''}
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                    <div class="swipe-btn edit" id="edit-reminder-${r.id}">✏️</div>
                    <div class="swipe-btn delete" id="delete-reminder-${r.id}">🗑️</div>
                </div>
            </div>
        `;
    },

    showForm(record = null) {
        const isEdit = !!record;
        const modal = document.createElement('div');
        modal.className = 'modal-mask';

        const repeatOptions = [
            { value: 'daily', label: '每天' },
            { value: 'weekly', label: '每周' },
            { value: 'monthly', label: '每月' },
            { value: 'yearly', label: '每年' }
        ];

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">${isEdit ? '编辑' : '添加'}提醒</div>
                    <div class="modal-close" onclick="this.closest('.modal-mask').remove()">×</div>
                </div>

                <div class="form-group">
                    <label class="form-label required">提醒事项</label>
                    <input type="text" class="form-input" id="reminder-title" value="${record?.title || ''}" placeholder="如：每天10点提醒喂饭">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label required">提醒时间</label>
                        <input type="time" class="form-input" id="reminder-time" value="${record?.reminder_time || '10:00'}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">重复</label>
                        <select class="form-select" id="reminder-repeat">
                            ${repeatOptions.map(opt => `
                                <option value="${opt.value}" ${record?.repeat_pattern === opt.value ? 'selected' : ''}>${opt.label}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">备注</label>
                    <textarea class="form-textarea" id="reminder-notes" placeholder="选填">${record?.notes || ''}</textarea>
                </div>

                <button class="btn btn-primary btn-block" id="save-reminder-btn">${isEdit ? '保存' : '添加'}</button>
            </div>
        `;

        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);

        modal.querySelector('#save-reminder-btn').addEventListener('click', async () => {
            const title = modal.querySelector('#reminder-title').value.trim();
            const time = modal.querySelector('#reminder-time').value;
            const repeat = modal.querySelector('#reminder-repeat').value;
            const notes = modal.querySelector('#reminder-notes').value.trim();

            if (!title) {
                Toast.error('请输入提醒事项');
                return;
            }
            if (!time) {
                Toast.error('请选择提醒时间');
                return;
            }

            const data = { title, reminder_time: time, repeat_pattern: repeat, notes };

            try {
                let result;
                if (isEdit) {
                    result = await ChongwuApi.updateReminder(record.id, data);
                } else {
                    result = await ChongwuApi.createReminder(this.petId, data);
                }

                if (result.code === 0) {
                    Toast.success(isEdit ? '保存成功' : '添加成功');
                    modal.remove();
                    this.loadRecords();
                } else {
                    Toast.error(result.msg || '保存失败');
                }
            } catch (e) {
                console.error(e);
                Toast.error('保存失败');
            }
        });
    },

    async deleteRecord(id) {
        if (!confirm('确定要删除这条提醒吗？')) return;

        try {
            const result = await ChongwuApi.deleteReminder(id);
            if (result.code === 0) {
                Toast.success('删除成功');
                this.loadRecords();
            } else {
                Toast.error(result.msg || '删除失败');
            }
        } catch (e) {
            Toast.error('删除失败');
        }
    }
};