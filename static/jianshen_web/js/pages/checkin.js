const CheckinPage = {
    state: {
        date: new Date().toISOString().split('T')[0],
        projects: [],
        details: [],
        duration: 30,
        calories: 200,
        mood: '',
        remark: ''
    },
    projectOptions: ['胸部', '背部', '腿部', '肩部', '手臂', '核心', '有氧', '瑜伽'],
    moods: ['😄', '💪', '😌', '😤', '😴'],

    async render() {
        if (!AuthService.requireAuth()) return;
        this.renderForm();
    },

    renderForm() {
        const s = this.state;
        const todayCheckin = ApiService.get(`/jianshen/checkin/date/get?checkin_date=${s.date}`);
        const projectChips = this.projectOptions.map(p => `
            <div class="project-chip ${s.projects.includes(p) ? 'active' : ''}" onclick="CheckinPage.toggleProject('${p}')">${p}</div>
        `).join('');
        const moodChips = this.moods.map(m => `
            <div class="mood-chip ${s.mood === m ? 'active' : ''}" onclick="CheckinPage.setMood('${m}')">${m}</div>
        `).join('');
        AppLayout.render(`
            <div class="content">
                <div class="card">
                    <div class="card-header"><h2>📅 选择日期</h2></div>
                    <input type="date" value="${s.date}" onchange="CheckinPage.setDate(this.value)" style="margin-bottom:8px;">
                </div>

                <div class="card">
                    <div class="card-header"><h2>🎯 训练项目</h2></div>
                    <div class="project-grid">${projectChips}</div>
                </div>

                <div class="card">
                    <div class="card-header"><h2>⏱ 训练详情</h2></div>
                    <div class="checkin-summary">
                        <div class="item">
                            <div class="value">${s.duration}</div>
                            <div class="label">分钟</div>
                        </div>
                        <div class="item">
                            <div class="value">${s.calories}</div>
                            <div class="label">消耗 kcal</div>
                        </div>
                        <div class="item">
                            <div class="value">${s.projects.length}</div>
                            <div class="label">项目数</div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>训练时长（分钟）</label>
                        <div class="input-group">
                            <button onclick="CheckinPage.changeDuration(-5)">−</button>
                            <input type="number" value="${s.duration}" onchange="CheckinPage.setDuration(this.value)">
                            <button onclick="CheckinPage.changeDuration(5)">+</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>消耗卡路里（kcal）</label>
                        <div class="input-group">
                            <button onclick="CheckinPage.changeCalories(-10)">−</button>
                            <input type="number" value="${s.calories}" onchange="CheckinPage.setCalories(this.value)">
                            <button onclick="CheckinPage.changeCalories(10)">+</button>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><h2>💬 训练感受</h2></div>
                    <div class="mood-grid" style="margin-bottom: 14px;">${moodChips}</div>
                    <div class="form-group">
                        <label>备注</label>
                        <textarea id="remark" rows="3" placeholder="记录今天的训练感受..." onchange="CheckinPage.state.remark = this.value" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:var(--radius-sm);resize:vertical;font-family:inherit;font-size:14px;">${s.remark}</textarea>
                    </div>
                </div>

                <button class="btn btn-primary btn-block" style="padding:14px;font-size:15px;font-weight:600;" onclick="CheckinPage.submit()">
                    💪 提交打卡
                </button>

                <div style="margin-top:16px;">
                    <div class="card">
                        <div class="card-header"><h2>📜 打卡历史</h2></div>
                        <div id="history-list"><div class="loading"><div class="spinner"></div></div></div>
                    </div>
                </div>
            </div>
        `, '打卡');
        this.loadHistory();
    },

    async loadHistory() {
        try {
            const res = await ApiService.get('/jianshen/checkin/list/get', { page: 1, page_size: 10 });
            if (res.code === 0) {
                const list = res.data.items || [];
                const html = list.map(c => {
                    let projects = '';
                    try { projects = JSON.parse(c.projects || '[]').join('、'); } catch (e) { projects = c.projects || ''; }
                    return `
                        <div class="activity-item">
                            <div class="date">
                                <div class="day">${new Date(c.checkin_date).getDate()}</div>
                                <div class="month">${new Date(c.checkin_date).toLocaleString('zh-CN', { month: 'short' })}</div>
                            </div>
                            <div class="details">
                                <div class="title">${projects || '健身打卡'}</div>
                                <div class="meta">${c.duration || 0}分钟 · ${c.calories || 0}kcal ${c.mood ? '· ' + c.mood : ''}</div>
                            </div>
                        </div>
                    `;
                }).join('');
                const el = document.getElementById('history-list');
                if (el) el.innerHTML = html || '<div class="empty"><div class="icon">📭</div>暂无打卡记录</div>';
            }
        } catch (e) { console.error(e); }
    },

    toggleProject(p) {
        const i = this.state.projects.indexOf(p);
        if (i >= 0) this.state.projects.splice(i, 1);
        else this.state.projects.push(p);
        this.renderForm();
    },
    setMood(m) { this.state.mood = m; this.renderForm(); },
    setDate(d) { this.state.date = d; this.renderForm(); },
    setDuration(v) { this.state.duration = parseInt(v) || 0; this.renderForm(); },
    setCalories(v) { this.state.calories = parseInt(v) || 0; this.renderForm(); },
    changeDuration(d) { this.state.duration = Math.max(0, this.state.duration + d); this.renderForm(); },
    changeCalories(d) { this.state.calories = Math.max(0, this.state.calories + d); this.renderForm(); },

    async submit() {
        const s = this.state;
        if (!s.projects.length) {
            Toast.warning('请选择至少一个训练项目');
            return;
        }
        try {
            const res = await ApiService.post('/jianshen/checkin/create', {
                checkin_date: s.date,
                projects: s.projects,
                details: [],
                duration: s.duration,
                calories: s.calories,
                remark: s.remark,
                mood: s.mood
            });
            if (res.code === 0) {
                if (res.data.new_achievements && res.data.new_achievements.length) {
                    const names = res.data.new_achievements.map(a => `${a.icon} ${a.name}`).join(' ');
                    Toast.success(`🎉 解锁成就：${names}`);
                } else {
                    Toast.success(res.msg);
                }
                this.state.date = new Date().toISOString().split('T')[0];
                this.state.projects = [];
                this.state.details = [];
                this.state.duration = 30;
                this.state.calories = 200;
                this.state.mood = '';
                this.state.remark = '';
                window.scrollTo(0, 0);
                this.loadHistory();
                this.renderForm();
            } else {
                Toast.error(res.msg);
            }
        } catch (e) {
            Toast.error('提交失败');
        }
    }
};
