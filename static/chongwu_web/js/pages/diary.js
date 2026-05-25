const DiaryPage = {
    petId: null,
    records: [],

    render() {
        this.petId = Storage.getCurrentPetId();
        if (!this.petId) {
            Router.navigate('home');
            return;
        }

        this.loadRecords();
    },

    async loadRecords() {
        this.showLoading();

        try {
            const result = await ChongwuApi.getDiaryList(this.petId, { page: 1, page_size: 50 });
            if (result.code === 0) {
                this.records = result.data.items || [];
                this.renderPage();
            } else {
                Toast.error(result.msg || '加载失败');
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
            <div class="page has-header no-tabbar">
                <div class="header">
                    <div class="header-back" id="back-btn">←</div>
                    <div class="header-title"><span class="paw-icon">📝</span>成长日记</div>
                    <div class="header-action" id="add-btn">+</div>
                </div>
                <div class="loading"><div class="spinner"></div><span>加载中...</span></div>
            </div>
        `;
        document.getElementById('back-btn').addEventListener('click', () => Router.back());
        document.getElementById('add-btn').addEventListener('click', () => this.showForm());
    },

    renderPage() {
        const app = document.getElementById('app');

        const grouped = {};
        this.records.forEach(r => {
            if (!grouped[r.diary_date]) grouped[r.diary_date] = [];
            grouped[r.diary_date].push(r);
        });
        const dates = Object.keys(grouped).sort().reverse();

        app.innerHTML = `
            <div class="paw-bg"></div>
            <div class="page has-header no-tabbar">
                <div class="header">
                    <div class="header-back" id="back-btn">←</div>
                    <div class="header-title"><span class="paw-icon">📝</span>成长日记</div>
                    <div class="header-action" id="add-btn">+</div>
                </div>

                ${dates.length > 0 ? dates.map(date => `
                    <div class="diary-date-group">
                        <div class="diary-date-header"><span class="title-icon">📅</span>${date}</div>
                        ${grouped[date].map(r => this.renderRecord(r)).join('')}
                    </div>
                `).join('') : `
                    <div class="empty-state">
                        <div class="empty-icon">📝</div>
                        <div class="empty-text">还没有日记</div>
                        <div class="empty-hint">记录宠物的每一个成长瞬间</div>
                    </div>
                `}
            </div>
        `;

        document.getElementById('back-btn').addEventListener('click', () => Router.back());
        document.getElementById('add-btn').addEventListener('click', () => this.showForm());

        this.records.forEach(r => {
            const editBtn = document.getElementById(`edit-diary-${r.id}`);
            const deleteBtn = document.getElementById(`delete-diary-${r.id}`);
            if (editBtn) editBtn.addEventListener('click', (e) => { e.stopPropagation(); this.showForm(r); });
            if (deleteBtn) deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); this.deleteRecord(r.id); });
        });
    },

    renderRecord(r) {
        return `
            <div class="card">
                <div style="font-size: 14px; color: var(--text-primary); line-height: 1.7; white-space: pre-wrap; margin-bottom: 8px;">
                    ${r.content || '（无内容）'}
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                    <div class="swipe-btn edit" id="edit-diary-${r.id}">✏️</div>
                    <div class="swipe-btn delete" id="delete-diary-${r.id}">🗑️</div>
                </div>
            </div>
        `;
    },

    showForm(record = null) {
        const isEdit = !!record;
        const modal = document.createElement('div');
        modal.className = 'modal-mask';

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">${isEdit ? '编辑' : '写'}日记</div>
                    <div class="modal-close" onclick="this.closest('.modal-mask').remove()">×</div>
                </div>

                <div class="form-group">
                    <label class="form-label required">日期</label>
                    <input type="date" class="form-input" id="diary-date" value="${record?.diary_date || ''}">
                </div>

                <div class="form-group">
                    <label class="form-label">内容</label>
                    <textarea class="form-textarea" id="diary-content" placeholder="今天和小团在公园里玩..." style="min-height: 150px;">${record?.content || ''}</textarea>
                </div>

                <button class="btn btn-primary btn-block" id="save-diary-btn">${isEdit ? '保存' : '记录'}</button>
            </div>
        `;

        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);

        modal.querySelector('#save-diary-btn').addEventListener('click', async () => {
            const date = modal.querySelector('#diary-date').value;
            const content = modal.querySelector('#diary-content').value.trim();

            if (!date) {
                Toast.error('请选择日期');
                return;
            }

            try {
                let result;
                if (isEdit) {
                    result = await ChongwuApi.updateDiary(record.id, { diary_date: date, content });
                } else {
                    result = await ChongwuApi.createDiary(this.petId, { diary_date: date, content });
                }

                if (result.code === 0) {
                    Toast.success(isEdit ? '保存成功' : '记录成功');
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
        if (!confirm('确定要删除这篇日记吗？')) return;

        try {
            const result = await ChongwuApi.deleteDiary(id);
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