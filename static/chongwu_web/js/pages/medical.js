const MedicalPage = {
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
            const result = await ChongwuApi.getMedicalList(this.petId, { page: 1, page_size: 50 });
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
                    <div class="header-title"><span class="paw-icon">🏥</span>就医记录</div>
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
                    <div class="header-title"><span class="paw-icon">🏥</span>就医记录</div>
                    <div class="header-action" id="add-btn">+</div>
                </div>

                ${this.records.length > 0 ? this.records.map(r => this.renderRecord(r)).join('') : `
                    <div class="empty-state">
                        <div class="empty-icon">🏥</div>
                        <div class="empty-text">暂无就医记录</div>
                        <div class="empty-hint">记录每次带宠物就医的详情</div>
                    </div>
                `}
            </div>
        `;

        document.getElementById('back-btn').addEventListener('click', () => Router.back());
        document.getElementById('add-btn').addEventListener('click', () => this.showForm());

        this.records.forEach(r => {
            const editBtn = document.getElementById(`edit-medical-${r.id}`);
            const deleteBtn = document.getElementById(`delete-medical-${r.id}`);
            if (editBtn) editBtn.addEventListener('click', (e) => { e.stopPropagation(); this.showForm(r); });
            if (deleteBtn) deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); this.deleteRecord(r.id); });
        });
    },

    renderRecord(r) {
        return `
            <div class="card">
                <div class="card-title"><span class="title-icon">🏥</span>${r.visit_date}</div>
                ${r.hospital ? `<div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 6px;">🏥 ${r.hospital}</div>` : ''}
                ${r.diagnosis ? `<div style="font-size: 14px; margin-bottom: 6px;"><strong>诊断：</strong>${r.diagnosis}</div>` : ''}
                ${r.treatment ? `<div style="font-size: 14px; margin-bottom: 6px;"><strong>治疗：</strong>${r.treatment}</div>` : ''}
                ${r.prescription ? `<div style="font-size: 14px; margin-bottom: 6px;"><strong>处方：</strong>${r.prescription}</div>` : ''}
                ${r.notes ? `<div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 6px;">📝 ${r.notes}</div>` : ''}
                ${r.cost ? `<div style="font-size: 13px; color: var(--accent-orange); margin-bottom: 6px;">💰 ¥${r.cost}</div>` : ''}
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                    <div class="swipe-btn edit" id="edit-medical-${r.id}">✏️</div>
                    <div class="swipe-btn delete" id="delete-medical-${r.id}">🗑️</div>
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
                    <div class="modal-title">${isEdit ? '编辑' : '添加'}就医记录</div>
                    <div class="modal-close" onclick="this.closest('.modal-mask').remove()">×</div>
                </div>

                <div class="form-group">
                    <label class="form-label required">就医日期</label>
                    <input type="date" class="form-input" id="visit-date" value="${record?.visit_date || today}">
                </div>

                <div class="form-group">
                    <label class="form-label">医院</label>
                    <input type="text" class="form-input" id="hospital" value="${record?.hospital || ''}" placeholder="选填">
                </div>

                <div class="form-group">
                    <label class="form-label">诊断</label>
                    <input type="text" class="form-input" id="diagnosis" value="${record?.diagnosis || ''}" placeholder="选填">
                </div>

                <div class="form-group">
                    <label class="form-label">治疗方案</label>
                    <textarea class="form-textarea" id="treatment" placeholder="选填">${record?.treatment || ''}</textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">处方</label>
                    <input type="text" class="form-input" id="prescription" value="${record?.prescription || ''}" placeholder="选填">
                </div>

                <div class="form-group">
                    <label class="form-label">备注</label>
                    <textarea class="form-textarea" id="notes" placeholder="选填">${record?.notes || ''}</textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">费用 (元)</label>
                    <input type="number" step="0.01" class="form-input" id="cost" value="${record?.cost || 0}" placeholder="选填">
                </div>

                <button class="btn btn-primary btn-block" id="save-medical-btn">${isEdit ? '保存' : '添加'}</button>
            </div>
        `;

        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);

        modal.querySelector('#save-medical-btn').addEventListener('click', async () => {
            const data = {
                visit_date: modal.querySelector('#visit-date').value,
                hospital: modal.querySelector('#hospital').value.trim(),
                diagnosis: modal.querySelector('#diagnosis').value.trim(),
                treatment: modal.querySelector('#treatment').value.trim(),
                prescription: modal.querySelector('#prescription').value.trim(),
                notes: modal.querySelector('#notes').value.trim(),
                cost: parseFloat(modal.querySelector('#cost').value) || 0
            };

            if (!data.visit_date) {
                Toast.error('请选择就医日期');
                return;
            }

            try {
                let result;
                if (isEdit) {
                    result = await ChongwuApi.updateMedical(record.id, data);
                } else {
                    result = await ChongwuApi.createMedical(this.petId, data);
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
            const result = await ChongwuApi.deleteMedical(id);
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