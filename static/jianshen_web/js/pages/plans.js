const PlansPage = {
    state: { tab: 'official' },

    async render() {
        if (!AuthService.requireAuth()) return;
        AppLayout.render(`<div class="content"><div class="loading"><div class="spinner"></div></div></div>`, '计划');
        await this.load();
    },

    async load() {
        try {
            const [official, my, active, today] = await Promise.all([
                ApiService.get('/jianshen/plan/official/get'),
                ApiService.get('/jianshen/plan/my/get'),
                ApiService.get('/jianshen/plan/active/get'),
                ApiService.get('/jianshen/plan/today/get')
            ]);
            this.renderContent(official.data, my.data, active.data, today.data);
        } catch (e) {
            console.error(e);
        }
    },

    renderContent(official, my, active, today) {
        const s = this.state;
        const difficultyLabels = { beginner: '入门', intermediate: '进阶', advanced: '高级' };
        const renderPlan = (plan) => `
            <div class="plan-card ${active && active.id === plan.id ? 'active' : ''}">
                <div class="title">${plan.name} ${active && active.id === plan.id ? '✓ 当前' : ''}</div>
                <div class="desc">${plan.description || ''}</div>
                <div class="meta">
                    <span>📅 7天计划</span>
                    <span class="difficulty">${difficultyLabels[plan.difficulty] || plan.difficulty}</span>
                </div>
                <div style="margin-top: 12px; display: flex; gap: 8px;">
                    ${active && active.id === plan.id
                        ? `<button class="btn btn-danger btn-sm" style="flex:1" onclick="PlansPage.deactivate()">停用</button>`
                        : `<button class="btn btn-primary btn-sm" style="flex:1" onclick="PlansPage.activate(${plan.id})">使用此计划</button>`
                    }
                </div>
            </div>
        `;
        const officialHtml = (official || []).map(renderPlan).join('') || '<div class="empty"><div class="icon">📋</div>暂无官方计划</div>';
        const myHtml = (my || []).map(renderPlan).join('') || '<div class="empty"><div class="icon">✏️</div>还没有自定义计划</div>';
        const todayItems = today && today.items ? today.items.join('、') : '休息日';
        AppLayout.render(`
            <div class="content">
                ${today ? `
                <div class="status-card" style="padding: 20px;">
                    <div class="label">📌 今日训练</div>
                    <div class="big-num" style="font-size: 28px;">${todayItems}</div>
                    <div class="sub">来自：${today.plan_name || '无激活计划'}</div>
                </div>
                ` : ''}

                <div class="stat-tabs">
                    <div class="stat-tab ${s.tab === 'official' ? 'active' : ''}" onclick="PlansPage.setTab('official')">官方推荐</div>
                    <div class="stat-tab ${s.tab === 'my' ? 'active' : ''}" onclick="PlansPage.setTab('my')">我的计划</div>
                    <div class="stat-tab" onclick="PlansPage.showCreate()">+ 新建</div>
                </div>

                <div id="plans-content">
                    ${s.tab === 'official' ? officialHtml : myHtml}
                </div>

                <div id="modal-container"></div>
            </div>
        `, '计划');
    },

    setTab(t) { this.state.tab = t; this.load(); },

    async activate(id) {
        const res = await ApiService.post(`/jianshen/plan/activate?plan_id=${id}`);
        if (res.code === 0) { Toast.success('已激活计划'); this.load(); }
        else Toast.error(res.msg);
    },

    async deactivate() {
        const res = await ApiService.post('/jianshen/plan/deactivate');
        if (res.code === 0) { Toast.success('已停用计划'); this.load(); }
        else Toast.error(res.msg);
    },

    showCreate() {
        const container = document.getElementById('modal-container');
        container.innerHTML = `
            <div class="modal-overlay" id="plan-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>新建计划</h3>
                        <button class="modal-close" onclick="PlansPage.closeModal()">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>计划名称</label>
                            <input type="text" id="p-name" placeholder="如：我的增肌计划">
                        </div>
                        <div class="form-group">
                            <label>计划描述</label>
                            <input type="text" id="p-desc" placeholder="简单描述一下">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="PlansPage.closeModal()">取消</button>
                        <button class="btn btn-primary" onclick="PlansPage.create()">创建</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('plan-modal').addEventListener('click', (e) => {
            if (e.target.id === 'plan-modal') PlansPage.closeModal();
        });
    },

    closeModal() {
        const c = document.getElementById('modal-container');
        if (c) c.innerHTML = '';
    },

    async create() {
        const name = document.getElementById('p-name').value.trim();
        const desc = document.getElementById('p-desc').value.trim();
        if (!name) { Toast.error('请输入计划名称'); return; }
        const schedule = [
            { day: 1, items: ['胸部'] },
            { day: 2, items: ['背部'] },
            { day: 3, items: ['腿部'] },
            { day: 4, items: ['肩部'] },
            { day: 5, items: ['手臂'] },
            { day: 6, items: ['有氧'] },
            { day: 7, items: ['休息'] },
        ];
        const res = await ApiService.post('/jianshen/plan/create', {
            name, description: desc, schedule, difficulty: 'beginner'
        });
        if (res.code === 0) {
            Toast.success('创建成功');
            this.closeModal();
            this.state.tab = 'my';
            this.load();
        } else {
            Toast.error(res.msg);
        }
    }
};
