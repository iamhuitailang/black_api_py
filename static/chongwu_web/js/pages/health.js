const HealthPage = {
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
            const result = await ChongwuApi.getHealthList(this.petId, { page: 1, page_size: 20 });
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
                    <div class="header-title"><span class="paw-icon">💊</span>健康档案</div>
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
        const hasRecords = this.records.length > 0;

        app.innerHTML = `
            <div class="paw-bg"></div>
            <div class="page has-header no-tabbar">
                <div class="header">
                    <div class="header-back" id="back-btn">←</div>
                    <div class="header-title"><span class="paw-icon">💊</span>健康档案</div>
                    <div class="header-action" id="add-btn">+</div>
                </div>

                ${hasRecords ? this.records.map(r => this.renderRecord(r)).join('') : `
                    <div class="empty-state">
                        <div class="empty-icon">💊</div>
                        <div class="empty-text">暂无健康档案</div>
                        <div class="empty-hint">点击右上角添加健康记录</div>
                    </div>
                `}
            </div>
        `;

        document.getElementById('back-btn').addEventListener('click', () => Router.back());
        document.getElementById('add-btn').addEventListener('click', () => this.showForm());

        this.records.forEach(r => {
            const editBtn = document.getElementById(`edit-health-${r.id}`);
            const deleteBtn = document.getElementById(`delete-health-${r.id}`);
            if (editBtn) editBtn.addEventListener('click', (e) => { e.stopPropagation(); this.showForm(r); });
            if (deleteBtn) deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); this.deleteRecord(r.id); });
        });
    },

    renderRecord(r) {
        return `
            <div class="card">
                <div class="card-title"><span class="title-icon">💊</span>健康档案</div>
                ${r.vaccines && r.vaccines.length > 0 ? `
                    <div style="margin-bottom: 8px;">
                        <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 4px;">💉 疫苗接种</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                            ${r.vaccines.map(v => `<span class="pet-tag">${v}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                ${r.deworming && r.deworming.length > 0 ? `
                    <div style="margin-bottom: 8px;">
                        <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 4px;">🪱 驱虫记录</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                            ${r.deworming.map(d => `<span class="pet-tag blue">${d}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                ${r.other_issues ? `
                    <div style="padding: 10px; background: var(--primary-beige); border-radius: var(--radius-sm); font-size: 13px; margin-bottom: 8px;">
                        <strong>其他问题：</strong>${r.other_issues}
                    </div>
                ` : ''}
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                    <div class="swipe-btn edit" id="edit-health-${r.id}">✏️</div>
                    <div class="swipe-btn delete" id="delete-health-${r.id}">🗑️</div>
                </div>
                <div style="font-size: 11px; color: var(--text-light); margin-top: 4px;">${r.updated_at || r.created_at}</div>
            </div>
        `;
    },

    showForm(record = null) {
        const isEdit = !!record;
        const modal = document.createElement('div');
        modal.className = 'modal-mask';

        const vaccines = record?.vaccines || [];
        const deworming = record?.deworming || [];

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">${isEdit ? '编辑' : '添加'}健康档案</div>
                    <div class="modal-close" onclick="this.closest('.modal-mask').remove()">×</div>
                </div>

                <div class="form-group">
                    <label class="form-label">💉 疫苗接种</label>
                    <input type="text" class="form-input" id="vaccines-input"
                        value="${vaccines.join(', ')}" placeholder="多个疫苗用逗号分隔，如：疫苗1, 疫苗2">
                </div>

                <div class="form-group">
                    <label class="form-label">🪱 驱虫记录</label>
                    <input type="text" class="form-input" id="deworming-input"
                        value="${deworming.join(', ')}" placeholder="多个驱虫用逗号分隔">
                </div>

                <div class="form-group">
                    <label class="form-label">其他健康问题</label>
                    <textarea class="form-textarea" id="other-issues-input" placeholder="选填">${record?.other_issues || ''}</textarea>
                </div>

                <button class="btn btn-primary btn-block" id="save-health-btn">${isEdit ? '保存' : '添加'}</button>
            </div>
        `;

        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);

        modal.querySelector('#save-health-btn').addEventListener('click', async () => {
            const vaccinesStr = modal.querySelector('#vaccines-input').value.trim();
            const dewormingStr = modal.querySelector('#deworming-input').value.trim();
            const otherIssues = modal.querySelector('#other-issues-input').value.trim();

            const data = {
                vaccines: vaccinesStr ? vaccinesStr.split(/[,，]/).map(s => s.trim()).filter(Boolean) : [],
                deworming: dewormingStr ? dewormingStr.split(/[,，]/).map(s => s.trim()).filter(Boolean) : [],
                other_issues: otherIssues
            };

            try {
                let result;
                if (isEdit) {
                    result = await ChongwuApi.updateHealth(record.id, data);
                } else {
                    result = await ChongwuApi.createHealth(this.petId, data);
                }

                if (result.code === 0) {
                    Toast.success(isEdit ? '修改成功' : '添加成功');
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
            const result = await ChongwuApi.deleteHealth(id);
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