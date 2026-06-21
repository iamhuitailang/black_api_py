const App = {
    calendar: null,
    currentStudentId: 1,
    managePage: 1,
    managePageSize: 10,

    init() {
        this.bindNav();
        this.initApplyForm();
        this.initCheckin();
        this.initStats();
        this.initManage();
        this.calendar = new Calendar();
        this.loadSelects();
        this.bindModal();
    },

    bindNav() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.onclick = () => {
                document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById('view-' + tab.dataset.view).classList.add('active');

                if (tab.dataset.view === 'stats') this.refreshStats();
                if (tab.dataset.view === 'manage') this.refreshManage();
                if (tab.dataset.view === 'checkin') this.loadCheckinActivities();
            };
        });
    },

    async loadSelects() {
        const [venueRes, orgRes] = await Promise.all([
            API.venue.list(),
            API.organizer.list()
        ]);
        if (venueRes.code === 0) {
            const sel = document.getElementById('venueSelect');
            venueRes.data.forEach(v => {
                const opt = document.createElement('option');
                opt.value = v.id;
                opt.textContent = `${v.name} (容量${v.capacity}人, ${v.location || ''})`;
                sel.appendChild(opt);
            });
        }
        if (orgRes.code === 0) {
            const sel = document.getElementById('organizerSelect');
            orgRes.data.forEach(o => {
                const opt = document.createElement('option');
                opt.value = o.id;
                opt.textContent = o.name + (o.is_banned ? ' (已限制申报)' : '');
                if (o.is_banned) opt.disabled = true;
                sel.appendChild(opt);
            });
        }
    },

    initApplyForm() {
        const form = document.getElementById('applyForm');
        const startInput = form.querySelector('[name="start_time"]');
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 7);
        startInput.min = minDate.toISOString().slice(0, 16);

        document.getElementById('checkConflictBtn').onclick = async () => {
            const data = this.getFormData(form);
            if (!data.venue_id || !data.start_time || !data.end_time) {
                this.showToast('请先选择场地和时间', 'error');
                return;
            }
            await this.checkConflict(data);
        };

        form.onsubmit = async (e) => {
            e.preventDefault();
            const data = this.getFormData(form);
            const conflict = await this.checkConflict(data);
            if (conflict && conflict.has_conflict) {
                this.showToast('场地存在冲突，请调整时间或选择推荐时段', 'error');
                return;
            }
            data.organizer_name = document.querySelector('#organizerSelect option:checked')?.textContent?.replace(' (已限制申报)', '') || '';
            const res = await API.activity.create(data);
            if (res.code === 0) {
                this.showToast('申报成功！', 'success');
                form.reset();
                this.calendar.loadActivities();
            } else if (res.code === 2) {
                this.showConflictAlert(res.data);
                this.showToast('场地时间冲突', 'error');
            } else {
                this.showToast(res.message, 'error');
            }
        };
    },

    getFormData(form) {
        const fd = new FormData(form);
        const data = {};
        fd.forEach((v, k) => {
            if (k !== 'plan_file') data[k] = v;
        });
        data.expected_count = parseInt(data.expected_count) || 50;
        data.venue_id = parseInt(data.venue_id) || 0;
        data.organizer_id = parseInt(data.organizer_id) || 0;
        return data;
    },

    async checkConflict(data) {
        const res = await API.conflict.check({
            venue_id: data.venue_id,
            start_time: new Date(data.start_time).toISOString(),
            end_time: new Date(data.end_time).toISOString()
        });
        if (res.code === 0) {
            const alert = document.getElementById('conflictAlert');
            if (res.data.has_conflict) {
                this.showConflictAlert(res.data);
            } else {
                alert.className = 'conflict-alert show success';
                alert.innerHTML = '✅ 该场地时段可用';
                setTimeout(() => alert.classList.remove('show'), 3000);
            }
            return res.data;
        }
        return null;
    },

    showConflictAlert(data) {
        const alert = document.getElementById('conflictAlert');
        alert.className = 'conflict-alert show error';
        let html = '❌ 场地冲突：<br>';
        data.conflicts.forEach(c => {
            html += `<div>• ${this.escape(c.name)} (${this.formatDT(c.start_time)} - ${this.formatDT(c.end_time)})</div>`;
        });
        if (data.alternatives && data.alternatives.length) {
            html += '<br>💡 推荐可用时段（点击选用）：<br>';
            data.alternatives.forEach(a => {
                html += `<span class="alt-slot" data-st="${a.start_time}" data-et="${a.end_time}">${a.date} ${a.time_range}</span>`;
            });
        }
        alert.innerHTML = html;

        alert.querySelectorAll('.alt-slot').forEach(slot => {
            slot.onclick = () => {
                document.querySelector('[name="start_time"]').value = slot.dataset.st.slice(0, 16);
                document.querySelector('[name="end_time"]').value = slot.dataset.et.slice(0, 16);
                this.showToast('已填入推荐时段', 'success');
            };
        });
    },

    initCheckin() {
        document.getElementById('checkinActivitySelect').onchange = (e) => {
            this.selectCheckinActivity(parseInt(e.target.value));
        };
        document.getElementById('manualCheckinBtn').onclick = async () => {
            const input = document.getElementById('studentNoInput');
            const actId = parseInt(document.getElementById('checkinActivitySelect').value);
            if (!actId) {
                this.showToast('请先选择活动', 'error');
                return;
            }
            if (!input.value.trim()) {
                this.showToast('请输入学号', 'error');
                return;
            }
            const res = await API.checkin.set({
                activity_id: actId,
                student_no: input.value.trim(),
                method: 'manual'
            });
            const box = document.getElementById('checkinResult');
            if (res.code === 0) {
                box.className = 'checkin-result show success';
                box.innerHTML = `✅ 签到成功：${this.escape(res.data.student_name)} (${this.escape(res.data.student_no)})`;
                input.value = '';
                this.refreshCheckinData(actId);
            } else {
                box.className = 'checkin-result show error';
                box.innerHTML = '❌ ' + res.message;
            }
            setTimeout(() => box.classList.remove('show'), 3000);
        };
        document.getElementById('markAbsentBtn').onclick = async () => {
            const actId = parseInt(document.getElementById('checkinActivitySelect').value);
            if (!actId) return;
            const res = await API.checkin.markAbsent(actId);
            this.showToast(res.message, res.code === 0 ? 'success' : 'error');
            this.refreshCheckinData(actId);
        };
    },

    async loadCheckinActivities() {
        const res = await API.activity.list({ page: 1, page_size: 50, status: 1 });
        if (res.code === 0) {
            const sel = document.getElementById('checkinActivitySelect');
            sel.innerHTML = '<option value="">请选择活动</option>';
            res.data.items.forEach(a => {
                const opt = document.createElement('option');
                opt.value = a.id;
                opt.textContent = `${a.name} (${this.formatDT(a.start_time)})`;
                sel.appendChild(opt);
            });
        }
    },

    async selectCheckinActivity(activityId) {
        if (!activityId) return;
        const [actRes, statsRes] = await Promise.all([
            API.activity.get(activityId),
            API.checkin.stats(activityId)
        ]);

        if (actRes.code === 0 && actRes.data) {
            document.getElementById('statExpected').textContent = actRes.data.expected_count;
        }
        if (statsRes.code === 0) {
            const s = statsRes.data;
            document.getElementById('statRegistered').textContent = s.registered_count;
            document.getElementById('statChecked').textContent = s.checked_count;
            document.getElementById('statRate').textContent = s.attendance_rate + '%';
        }

        const qr = document.getElementById('qrcodePlaceholder');
        qr.innerHTML = `
            <div class="qrcode-img">📱</div>
            <p style="margin-top:12px;color:#475569;font-size:13px">
                活动ID: ${activityId}<br>请扫描二维码签到
            </p>
        `;

        this.refreshCheckinData(activityId);
    },

    async refreshCheckinData(activityId) {
        const [listRes, statsRes] = await Promise.all([
            API.checkin.list(activityId),
            API.checkin.stats(activityId)
        ]);
        const list = document.getElementById('checkinList');
        if (listRes.code === 0 && listRes.data.length) {
            list.innerHTML = listRes.data.map(c => `
                <div class="checkin-item">
                    <div class="checkin-info">
                        <span class="badge ${c.status === 1 ? 'checked' : 'absent'}">
                            ${c.status === 1 ? '已签到' : '未出席'}
                        </span>
                        <span>${this.escape(c.student_name)}</span>
                        <span style="color:#64748b">${this.escape(c.student_no)}</span>
                    </div>
                    <span class="checkin-time">${this.formatDT(c.checkin_time)}</span>
                </div>
            `).join('');
        } else {
            list.innerHTML = '<p class="empty-tip">暂无签到记录</p>';
        }
        if (statsRes.code === 0) {
            const s = statsRes.data;
            document.getElementById('statChecked').textContent = s.checked_count;
            document.getElementById('statRate').textContent = s.attendance_rate + '%';
        }
    },

    initStats() {
        document.getElementById('statsSemester').onchange = () => this.refreshStats();
    },

    async refreshStats() {
        const semester = document.getElementById('statsSemester').value;
        const [ovRes, typeRes, deptRes, semRes] = await Promise.all([
            API.stats.overview(semester),
            API.stats.byType(semester),
            API.stats.byDept(semester),
            API.stats.bySemester()
        ]);

        const semSel = document.getElementById('statsSemester');
        if (semRes.code === 0 && semSel.options.length <= 1) {
            semRes.data.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.semester;
                opt.textContent = s.semester + ' 学期';
                semSel.appendChild(opt);
            });
        }

        if (ovRes.code === 0) {
            const d = ovRes.data;
            document.getElementById('statsOverview').innerHTML = `
                <div class="overview-card">
                    <div class="overview-icon blue">📅</div>
                    <div class="overview-info"><h4>${d.total_activities}</h4><span>活动总数</span></div>
                </div>
                <div class="overview-card">
                    <div class="overview-icon green">👥</div>
                    <div class="overview-info"><h4>${d.total_participants}</h4><span>参与人次</span></div>
                </div>
                <div class="overview-card">
                    <div class="overview-icon orange">✅</div>
                    <div class="overview-info"><h4>${d.attendance_rate}%</h4><span>平均到场率</span></div>
                </div>
                <div class="overview-card">
                    <div class="overview-icon purple">⭐</div>
                    <div class="overview-info"><h4>${d.avg_satisfaction}</h4><span>平均满意度</span></div>
                </div>
            `;
        }

        const typeColors = { academic: '#3b82f6', culture: '#ef4444', club: '#10b981', volunteer: '#f59e0b' };
        const typeNames = { academic: '学术讲座', culture: '文体比赛', club: '社团活动', volunteer: '志愿服务' };
        if (typeRes.code === 0) {
            const max = Math.max(1, ...typeRes.data.map(d => d.activity_count));
            document.getElementById('statsByType').innerHTML = typeRes.data.map(d => `
                <div class="stats-row">
                    <span class="stats-label">${typeNames[d.type] || d.type}</span>
                    <div class="stats-bar"><div class="stats-bar-fill" style="width:${d.activity_count / max * 100}%;background:${typeColors[d.type] || '#94a3b8'}"></div></div>
                    <span class="stats-value">${d.activity_count}场 / ${d.participant_count}人</span>
                </div>
            `).join('') || '<p class="empty-tip">暂无数据</p>';
        }

        if (deptRes.code === 0) {
            const max = Math.max(1, ...deptRes.data.map(d => d.activity_count));
            document.getElementById('statsByDept').innerHTML = deptRes.data.map(d => `
                <div class="stats-row">
                    <span class="stats-label">${this.escape(d.department)}</span>
                    <div class="stats-bar"><div class="stats-bar-fill" style="width:${d.activity_count / max * 100}%;background:#8b5cf6"></div></div>
                    <span class="stats-value">${d.activity_count}场 / ${d.participant_count}人</span>
                </div>
            `).join('') || '<p class="empty-tip">暂无数据</p>';
        }

        if (semRes.code === 0) {
            document.getElementById('statsBySemester').innerHTML = `
                <table class="stats-table">
                    <thead><tr><th>学期</th><th>活动数</th><th>参与人次</th><th>平均满意度</th></tr></thead>
                    <tbody>
                        ${semRes.data.map(s => `
                            <tr>
                                <td>${s.semester}</td>
                                <td>${s.activity_count}</td>
                                <td>${s.participant_count}</td>
                                <td>${s.avg_satisfaction}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    },

    initManage() {
        document.getElementById('manageStatus').onchange = () => { this.managePage = 1; this.refreshManage(); };
        document.getElementById('manageKeyword').oninput = this.debounce(() => {
            this.managePage = 1;
            this.refreshManage();
        }, 400);
    },

    debounce(fn, wait) {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
    },

    async refreshManage() {
        const params = {
            page: this.managePage,
            page_size: this.managePageSize,
            status: document.getElementById('manageStatus').value || undefined,
            keyword: document.getElementById('manageKeyword').value || undefined
        };
        Object.keys(params).forEach(k => { if (params[k] === undefined) delete params[k]; });
        const res = await API.activity.list(params);
        const statusMap = {
            0: ['pending', '待审批'], 1: ['approved', '已审批'], 2: ['rejected', '已驳回'],
            3: ['cancelled', '已取消'], 4: ['completed', '已完成'], 5: ['summary', '已总结']
        };
        const typeNames = { academic: '学术讲座', culture: '文体比赛', club: '社团活动', volunteer: '志愿服务' };

        if (res.code === 0) {
            const list = document.getElementById('manageList');
            if (res.data.items.length === 0) {
                list.innerHTML = '<p class="empty-tip" style="padding:40px">暂无活动</p>';
            } else {
                list.innerHTML = res.data.items.map(a => {
                    const st = statusMap[a.status] || ['pending', '未知'];
                    return `
                        <div class="manage-item" data-id="${a.id}">
                            <div>
                                <div class="manage-title">${this.escape(a.name)}</div>
                                <div class="manage-meta">${this.formatDT(a.start_time)} - ${this.formatDT(a.end_time)} | ${this.escape(a.venue_name || '')} | ${this.escape(a.organizer_name || '')}</div>
                            </div>
                            <span class="manage-type type-${a.type}">${typeNames[a.type] || a.type}</span>
                            <span class="status-badge ${st[0]}">${st[1]}</span>
                            <div class="manage-actions">
                                <button data-act="view">详情</button>
                                ${a.status === 0 ? `<button data-act="approve">通过</button><button data-act="reject">驳回</button>` : ''}
                                ${a.status === 1 ? `<button data-act="cancel">取消</button><button data-act="complete">完成</button>` : ''}
                                ${a.status === 4 ? `<button data-act="summary">总结</button>` : ''}
                            </div>
                        </div>
                    `;
                }).join('');

                list.querySelectorAll('.manage-item').forEach(item => {
                    const id = parseInt(item.dataset.id);
                    item.querySelector('[data-act="view"]').onclick = (e) => {
                        e.stopPropagation();
                        this.showActivityDetail(id);
                    };
                    item.onclick = () => this.showActivityDetail(id);
                    const act = (name, fn) => {
                        const btn = item.querySelector(`[data-act="${name}"]`);
                        if (btn) btn.onclick = async (e) => { e.stopPropagation(); await fn(id); };
                    };
                    act('approve', async (i) => {
                        const r = await API.activity.approve({ id: i, approved: true });
                        this.showToast(r.message, r.code === 0 ? 'success' : 'error');
                        this.refreshManage();
                    });
                    act('reject', async (i) => {
                        const reason = prompt('请输入驳回原因：') || '';
                        const r = await API.activity.approve({ id: i, approved: false, reason });
                        this.showToast(r.message, r.code === 0 ? 'success' : 'error');
                        this.refreshManage();
                    });
                    act('cancel', async (i) => {
                        if (!confirm('确认取消该活动？已报名学生将自动收到通知。')) return;
                        const reason = prompt('取消原因：') || '';
                        const r = await API.activity.cancel({ id: i, reason });
                        this.showToast(r.message, r.code === 0 ? 'success' : 'error');
                        this.refreshManage();
                        this.calendar.loadActivities();
                    });
                    act('complete', async (i) => {
                        const r = await API.activity.complete(i);
                        this.showToast(r.message, r.code === 0 ? 'success' : 'error');
                        this.refreshManage();
                    });
                    act('summary', (i) => this.showSummaryModal(i));
                });
            }

            this.renderPagination(res.data.total_pages);
        }
    },

    renderPagination(totalPages) {
        const el = document.getElementById('pagination');
        let html = '';
        html += `<button class="page-btn" ${this.managePage <= 1 ? 'disabled' : ''} data-p="${this.managePage - 1}">上一页</button>`;
        const start = Math.max(1, this.managePage - 2);
        const end = Math.min(totalPages, this.managePage + 2);
        for (let i = start; i <= end; i++) {
            html += `<button class="page-btn ${i === this.managePage ? 'active' : ''}" data-p="${i}">${i}</button>`;
        }
        html += `<button class="page-btn" ${this.managePage >= totalPages ? 'disabled' : ''} data-p="${this.managePage + 1}">下一页</button>`;
        el.innerHTML = html;
        el.querySelectorAll('.page-btn').forEach(btn => {
            if (!btn.disabled) {
                btn.onclick = () => {
                    this.managePage = parseInt(btn.dataset.p);
                    this.refreshManage();
                };
            }
        });
    },

    async showActivityDetail(id) {
        const [actRes, regRes, checkRes, sumRes] = await Promise.all([
            API.activity.get(id),
            API.registration.list({ activity_id: id }),
            API.checkin.list(id),
            API.summary.get(id)
        ]);

        if (actRes.code !== 0 || !actRes.data) {
            this.showToast('活动不存在', 'error');
            return;
        }
        const a = actRes.data;
        const typeNames = { academic: '学术讲座', culture: '文体比赛', club: '社团活动', volunteer: '志愿服务' };
        const statusMap = { 0: '待审批', 1: '已审批', 2: '已驳回', 3: '已取消', 4: '已完成', 5: '已总结' };

        let html = `
            <div class="detail-grid">
                <span class="detail-label">活动名称</span><span class="detail-value"><strong>${this.escape(a.name)}</strong></span>
                <span class="detail-label">活动类型</span><span class="detail-value"><span class="legend-item type-${a.type}" style="display:inline-flex">${typeNames[a.type] || a.type}</span></span>
                <span class="detail-label">活动状态</span><span class="detail-value">${statusMap[a.status] || '未知'}</span>
                <span class="detail-label">活动时间</span><span class="detail-value">${this.formatDT(a.start_time)} - ${this.formatDT(a.end_time)}</span>
                <span class="detail-label">活动地点</span><span class="detail-value">${this.escape(a.venue_name || '')}</span>
                <span class="detail-label">预计人数</span><span class="detail-value">${a.expected_count}人</span>
                <span class="detail-label">已报名</span><span class="detail-value">${a.registered_count || 0}人</span>
                <span class="detail-label">主办方</span><span class="detail-value">${this.escape(a.organizer_name || '')} (${this.escape(a.organizer_department || '')})</span>
                <span class="detail-label">负责人</span><span class="detail-value">${this.escape(a.contact_person || '')} / ${this.escape(a.contact_phone || '')}</span>
                <span class="detail-label">学期</span><span class="detail-value">${this.escape(a.semester || '')}</span>
                <span class="detail-label">审批要求</span><span class="detail-value">${this.escape(a.approval_remark || '')}</span>
            </div>
            ${a.description ? `<div class="detail-section"><h4>活动简介</h4><p>${this.escape(a.description)}</p></div>` : ''}
        `;

        if (regRes.code === 0 && regRes.data.length) {
            html += `<div class="detail-section"><h4>报名名单 (${regRes.data.length})</h4>`;
            regRes.data.slice(0, 10).forEach(r => {
                html += `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px">
                    <span>${this.escape(r.student_name)} (${this.escape(r.student_no)})</span>
                    <span style="color:#64748b">${this.escape(r.department || '')}</span>
                </div>`;
            });
            if (regRes.data.length > 10) html += `<p style="color:#64748b;font-size:12px">...共${regRes.data.length}人</p>`;
            html += '</div>';
        }

        if (sumRes.code === 0 && sumRes.data.summary) {
            const s = sumRes.data.summary;
            html += `<div class="detail-section"><h4>活动总结</h4>
                <div class="detail-grid">
                    <span class="detail-label">实际参与</span><span class="detail-value">${s.actual_count}人</span>
                    <span class="detail-label">满意度</span><span class="detail-value">${s.satisfaction_score}分</span>
                </div>
                ${s.summary ? `<p style="margin-top:8px;color:#475569">${this.escape(s.summary)}</p>` : ''}
            </div>`;
        }

        document.getElementById('modalTitle').textContent = '活动详情';
        document.getElementById('modalBody').innerHTML = html;

        let footer = '';
        if (a.status === 1) {
            footer = `<button class="btn-secondary" onclick="App.quickRegister(${a.id})">我要报名</button>`;
        }
        document.getElementById('modalFooter').innerHTML = footer;

        document.getElementById('modalMask').classList.add('show');
    },

    async quickRegister(activityId) {
        const res = await API.registration.set({ activity_id: activityId, student_id: this.currentStudentId });
        this.showToast(res.message, res.code === 0 ? 'success' : 'error');
        this.hideModal();
    },

    async showSummaryModal(activityId) {
        const act = await API.activity.get(activityId);
        if (act.code !== 0) return;
        document.getElementById('modalTitle').textContent = '提交活动总结 - ' + act.data.name;
        document.getElementById('modalBody').innerHTML = `
            <div class="form-group">
                <label>实际参与人数 *</label>
                <input type="number" id="sumCount" min="0" value="${act.data.registered_count || 0}">
            </div>
            <div class="form-group">
                <label>满意度评分 (0-5)</label>
                <input type="number" id="sumScore" min="0" max="5" step="0.1" value="4.5">
            </div>
            <div class="form-group">
                <label>活动总结</label>
                <textarea id="sumText" rows="5" placeholder="请描述活动开展情况..."></textarea>
            </div>
        `;
        document.getElementById('modalFooter').innerHTML = `
            <button class="btn-secondary" onclick="App.hideModal()">取消</button>
            <button class="btn-primary" onclick="App.submitSummary(${activityId})">提交总结</button>
        `;
        document.getElementById('modalMask').classList.add('show');
    },

    async submitSummary(activityId) {
        const actual_count = parseInt(document.getElementById('sumCount').value) || 0;
        const satisfaction_score = parseFloat(document.getElementById('sumScore').value) || 0;
        const summary = document.getElementById('sumText').value;
        const res = await API.summary.set({ activity_id: activityId, actual_count, satisfaction_score, summary });
        this.showToast(res.message, res.code === 0 ? 'success' : 'error');
        this.hideModal();
        this.refreshManage();
    },

    bindModal() {
        document.getElementById('modalClose').onclick = () => this.hideModal();
        document.getElementById('modalMask').onclick = (e) => {
            if (e.target.id === 'modalMask') this.hideModal();
        };
    },

    hideModal() {
        document.getElementById('modalMask').classList.remove('show');
    },

    showToast(msg, type = '') {
        const t = document.getElementById('toast');
        t.textContent = msg;
        t.className = 'toast show ' + type;
        setTimeout(() => t.classList.remove('show'), 2500);
    },

    formatDT(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    },

    escape(s) {
        if (!s) return '';
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
