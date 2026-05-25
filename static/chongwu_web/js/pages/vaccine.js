const VaccinePage = {
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
            const result = await ChongwuApi.getVaccineList(this.petId, { page: 1, page_size: 50 });
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
            <div class="page has-header no-tabbar">
                <div class="header">
                    <div class="header-back" id="back-btn">←</div>
                    <div class="header-title"><span class="paw-icon">💉</span>疫苗记录</div>
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

        app.innerHTML = `
            <div class="paw-bg"></div>
            <div class="page has-header no-tabbar">
                <div class="header">
                    <div class="header-back" id="back-btn">←</div>
                    <div class="header-title"><span class="paw-icon">💉</span>疫苗记录</div>
                    <div class="header-action" id="add-btn">+</div>
                </div>

                ${this.records.length > 0 ? this.records.map(r => this.renderRecord(r)).join('') : `
                    <div class="empty-state">
                        <div class="empty-icon">💉</div>
                        <div class="empty-text">暂无疫苗记录</div>
                        <div class="empty-hint">添加疫苗接种记录</div>
                    </div>
                `}
            </div>
        `;

        document.getElementById('back-btn').addEventListener('click', () => Router.back());
        document.getElementById('add-btn').addEventListener('click', () => this.showForm());

        this.records.forEach(r => {
            const editBtn = document.getElementById(`edit-vaccine-${r.id}`);
            const deleteBtn = document.getElementById(`delete-vaccine-${r.id}`);
            if (editBtn) editBtn.addEventListener('click', (e) => { e.stopPropagation(); this.showForm(r); });
            if (deleteBtn) deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); this.deleteRecord(r.id); });
        });
    },

    renderRecord(r) {
        const isUpcoming = r.next_date && new Date(r.next_date) > new Date();
        return `
            <div class="card">
                <div class="card-title"><span class="title-icon">💉</span>${r.vaccine_name}</div>
                <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 6px;">📅 接种日期：${r.vaccine_date}</div>
                ${r.next_date ? `
                    <div style="font-size: 13px; color: ${isUpcoming ? 'var(--accent-orange)' : 'var(--text-light)'}; margin-bottom: 6px;">
                        🔔 下次接种：${r.next_date} ${isUpcoming ? '(即将到期)' : ''}
                    </div>
                ` : ''}
                ${r.hospital ? `<div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 6px;">🏥 ${r.hospital}</div>` : ''}
                ${r.notes ? `<div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 6px;">📝 ${r.notes}</div>` : ''}
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                    <div class="swipe-btn edit" id="edit-vaccine-${r.id}">✏️</div>
                    <div class="swipe-btn delete" id="delete-vaccine-${r.id}">🗑️</div>
                </div>
            </div>
        `;
    },

    showForm(record = null) {
        const isEdit = !!record;
        const modal = document.createElement('div');
        modal.className = 'modal-mask';

        const today = new Date().toISOString().split('T')[0];

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">${isEdit ? '编辑' : '添加'}疫苗记录</div>
                    <div class="modal-close" onclick="this.closest('.modal-mask').remove()">×</div>
                </div>

                <div class="form-group">
                    <label class="form-label required">疫苗名称</label>
                    <input type="text" class="form-input" id="vaccine-name" value="${record?.vaccine_name || ''}" placeholder="如：狂犬疫苗">
                </div>

                <div class="form-group">
                    <label class="form-label required">接种日期</label>
                    <input type="date" class="form-input" id="vaccine-date" value="${record?.vaccine_date || today}">
                </div>

                <div class="form-group">
                    <label class="form-label">下次接种日期</label>
                    <input type="date" class="form-input" id="next-date" value="${record?.next_date || ''}">
                </div>

                <div class="form-group">
                    <label class="form-label">接种医院</label>
                    <input type="text" class="form-input" id="hospital" value="${record?.hospital || ''}" placeholder="选填">
                </div>

                <div class="form-group">
                    <label class="form-label">备注</label>
                    <textarea class="form-textarea" id="notes" placeholder="选填">${record?.notes || ''}</textarea>
                </div>

                <button class="btn btn-primary btn-block" id="save-vaccine-btn">${isEdit ? '保存' : '添加'}</button>
            </div>
        `;

        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);

        modal.querySelector('#save-vaccine-btn').addEventListener('click', async () => {
            const data = {
                vaccine_name: modal.querySelector('#vaccine-name').value.trim(),
                vaccine_date: modal.querySelector('#vaccine-date').value,
                next_date: modal.querySelector('#next-date').value,
                hospital: modal.querySelector('#hospital').value.trim(),
                notes: modal.querySelector('#notes').value.trim()
            };

            if (!data.vaccine_name) {
                Toast.error('请输入疫苗名称');
                return;
            }
            if (!data.vaccine_date) {
                Toast.error('请选择接种日期');
                return;
            }

            try {
                let result;
                if (isEdit) {
                    result = await ChongwuApi.updateVaccine(record.id, data);
                } else {
                    result = await ChongwuApi.createVaccine(this.petId, data);
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
        if (!confirm('确定要删除这条记录吗？')) return;

        try {
            const result = await ChongwuApi.deleteVaccine(id);
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