const WeightPage = {
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
            const [listResult, chartResult] = await Promise.all([
                ChongwuApi.getWeightList(this.petId, { page: 1, page_size: 50 }),
                ChongwuApi.getWeightChart(this.petId)
            ]);

            if (listResult.code === 0) {
                this.records = listResult.data.items || [];
            }
            if (chartResult.code === 0) {
                this.chartData = chartResult.data || [];
            }

            this.renderPage();
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
                    <div class="header-title"><span class="paw-icon">⚖️</span>体重记录</div>
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
        const hasChart = this.chartData && this.chartData.length > 0;

        app.innerHTML = `
            <div class="paw-bg"></div>
            <div class="page has-header no-tabbar">
                <div class="header">
                    <div class="header-back" id="back-btn">←</div>
                    <div class="header-title"><span class="paw-icon">⚖️</span>体重记录</div>
                    <div class="header-action" id="add-btn">+</div>
                </div>

                ${hasChart ? `
                    <div class="weight-chart-container">
                        <div class="card-title"><span class="title-icon">📈</span>体重趋势</div>
                        <canvas id="weight-chart"></canvas>
                    </div>
                ` : ''}

                ${this.records.length > 0 ? this.records.map(r => this.renderRecord(r)).join('') : `
                    <div class="empty-state">
                        <div class="empty-icon">⚖️</div>
                        <div class="empty-text">暂无体重记录</div>
                        <div class="empty-hint">记录宠物的体重变化</div>
                    </div>
                `}
            </div>
        `;

        document.getElementById('back-btn').addEventListener('click', () => Router.back());
        document.getElementById('add-btn').addEventListener('click', () => this.showForm());

        this.records.forEach(r => {
            const editBtn = document.getElementById(`edit-weight-${r.id}`);
            const deleteBtn = document.getElementById(`delete-weight-${r.id}`);
            if (editBtn) editBtn.addEventListener('click', (e) => { e.stopPropagation(); this.showForm(r); });
            if (deleteBtn) deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); this.deleteRecord(r.id); });
        });

        if (hasChart) {
            setTimeout(() => {
                const canvas = document.getElementById('weight-chart');
                if (canvas && this.chartData) {
                    ChartUtil.drawLineChart(canvas, this.chartData, {
                        lineColor: '#FF8FA3',
                        fillColor: 'rgba(255, 143, 163, 0.15)',
                        pointColor: '#FF8FA3',
                        unit: this.chartData[0]?.unit || 'kg'
                    });
                }
            }, 100);
        }
    },

    renderRecord(r) {
        return `
            <div class="card">
                <div class="card-title"><span class="title-icon">⚖️</span>${r.record_date}</div>
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 8px;">
                    <div style="font-size: 24px; font-weight: 700; color: var(--primary-pink-dark);">
                        ${r.weight}<span style="font-size: 14px; font-weight: 400;">${r.weight_unit}</span>
                    </div>
                </div>
                ${r.notes ? `<div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 6px;">📝 ${r.notes}</div>` : ''}
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                    <div class="swipe-btn edit" id="edit-weight-${r.id}">✏️</div>
                    <div class="swipe-btn delete" id="delete-weight-${r.id}">🗑️</div>
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
                    <div class="modal-title">${isEdit ? '编辑' : '添加'}体重记录</div>
                    <div class="modal-close" onclick="this.closest('.modal-mask').remove()">×</div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label required">体重</label>
                        <input type="number" step="0.01" class="form-input" id="weight-value" value="${record?.weight || ''}" placeholder="如：5.2">
                    </div>
                    <div class="form-group">
                        <label class="form-label">单位</label>
                        <select class="form-select" id="weight-unit">
                            <option value="kg" ${record?.weight_unit === 'kg' ? 'selected' : ''}>kg</option>
                            <option value="g" ${record?.weight_unit === 'g' ? 'selected' : ''}>g</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label required">记录日期</label>
                    <input type="date" class="form-input" id="record-date" value="${record?.record_date || today}">
                </div>

                <div class="form-group">
                    <label class="form-label">备注</label>
                    <textarea class="form-textarea" id="notes" placeholder="选填">${record?.notes || ''}</textarea>
                </div>

                <button class="btn btn-primary btn-block" id="save-weight-btn">${isEdit ? '保存' : '添加'}</button>
            </div>
        `;

        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);

        modal.querySelector('#save-weight-btn').addEventListener('click', async () => {
            const weight = parseFloat(modal.querySelector('#weight-value').value);
            const data = {
                weight: weight,
                weight_unit: modal.querySelector('#weight-unit').value,
                record_date: modal.querySelector('#record-date').value,
                notes: modal.querySelector('#notes').value.trim()
            };

            if (!weight || weight <= 0) {
                Toast.error('请输入有效的体重');
                return;
            }
            if (!data.record_date) {
                Toast.error('请选择记录日期');
                return;
            }

            try {
                let result;
                if (isEdit) {
                    result = await ChongwuApi.updateWeight(record.id, data);
                } else {
                    result = await ChongwuApi.createWeight(this.petId, data);
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
            const result = await ChongwuApi.deleteWeight(id);
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