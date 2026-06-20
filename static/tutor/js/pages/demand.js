const DemandPage = {
    demands: [],

    async render() {
        if (!AuthService.requireAuth()) return;

        const user = AuthService.getUser();
        const role = user && user.profile ? user.profile.role : 'parent';

        if (role !== 'parent') {
            Router.navigate('dashboard');
            return;
        }

        CommonLayout.render(`
            <div class="page-header">
                <div class="flex-between">
                    <div>
                        <div class="page-title">我的需求</div>
                        <div class="page-subtitle">管理您发布的家教需求</div>
                    </div>
                    <button class="btn btn-primary" id="btn-create-demand">+ 发布新需求</button>
                </div>
            </div>
            <div id="demand-list">
                <div class="text-center" style="padding: 60px;"><span class="loading"></span> 加载中...</div>
            </div>
        `, 'demand', '我的需求');

        document.getElementById('btn-create-demand').addEventListener('click', () => this.showCreateModal());

        await this.loadDemands();
    },

    async loadDemands() {
        try {
            const result = await TutorService.getMyDemands();
            if (result.code !== 0) {
                Toast.error(result.message);
                return;
            }

            this.demands = result.data || [];
            this.renderList();
        } catch (e) {}
    },

    renderList() {
        const listHtml = this.demands.length ? `
            <div class="card-list">
                ${this.demands.map(d => this.renderDemandCard(d)).join('')}
            </div>
        ` : `
            <div class="card">
                <div class="card-body">
                    <div class="empty-state">
                        <div class="icon">📋</div>
                        <p>您还没有发布任何需求</p>
                        <p class="hint">点击"发布新需求"开始找家教</p>
                        <div class="mt-2">
                            <button class="btn btn-primary" onclick="DemandPage.showCreateModal()">发布新需求</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const html = `
            <div class="page-header">
                <div class="flex-between">
                    <div>
                        <div class="page-title">我的需求</div>
                        <div class="page-subtitle">管理您发布的家教需求</div>
                    </div>
                    <button class="btn btn-primary" id="btn-create-demand-2">+ 发布新需求</button>
                </div>
            </div>
            ${listHtml}
        `;

        const main = document.getElementById('main-content');
        if (main) {
            main.innerHTML = html;
            const btn2 = document.getElementById('btn-create-demand-2');
            if (btn2) {
                btn2.addEventListener('click', () => this.showCreateModal());
            }
        }
    },

    renderDemandCard(d) {
        const statusMap = {
            active: { class: 'badge-success', text: '招募中' },
            matched: { class: 'badge-info', text: '已匹配' },
            closed: { class: 'badge-secondary', text: '已关闭' }
        };
        const s = statusMap[d.status] || { class: 'badge-secondary', text: d.status };
        const prefTimes = d.preferred_times_list || [];
        const budget = d.budget_max > 0 ? `¥${d.budget_min} - ¥${d.budget_max}/时` : (d.budget_min > 0 ? `¥${d.budget_min}/时起` : '面议');

        return `
            <div class="demand-card">
                <div class="card-top">
                    <div>
                        <div class="card-name">${d.subject} · ${d.grade}</div>
                        <div class="card-subtitle">${d.frequency || '上课频率待议'}</div>
                    </div>
                    <span class="badge ${s.class}">${s.text}</span>
                </div>
                <div class="card-info-row">
                    <span><span class="label">预算：</span>${budget}</span>
                </div>
                ${prefTimes.length ? `
                    <div class="time-tags">
                        ${prefTimes.map(t => `<span class="time-tag">${t}</span>`).join('')}
                    </div>
                ` : ''}
                ${d.description ? `<p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 12px;">${d.description}</p>` : ''}
                <div class="card-actions">
                    ${d.status === 'active' ? `
                        <button class="btn btn-sm btn-primary" onclick="DemandPage.showMatchModal(${d.id})">匹配教师</button>
                        <button class="btn btn-sm btn-secondary" onclick="DemandPage.showEditModal(${d.id})">编辑</button>
                        <button class="btn btn-sm btn-danger" onclick="DemandPage.deleteDemand(${d.id})">删除</button>
                    ` : ''}
                </div>
            </div>
        `;
    },

    showCreateModal() {
        const contentHtml = `
            <form id="demand-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">科目<span class="required">*</span></label>
                        <select class="form-control" name="subject" required>
                            <option value="">请选择科目</option>
                            ${SUBJECTS.map(s => `<option value="${s}">${s}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">年级<span class="required">*</span></label>
                        <select class="form-control" name="grade" required>
                            <option value="">请选择年级</option>
                            ${GRADES.map(g => `<option value="${g}">${g}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">上课频率</label>
                    <select class="form-control" name="frequency">
                        <option value="">请选择</option>
                        <option value="每周1次">每周1次</option>
                        <option value="每周2次">每周2次</option>
                        <option value="每周3次">每周3次</option>
                        <option value="每周4次及以上">每周4次及以上</option>
                        <option value="寒暑假集中">寒暑假集中</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">预算最低(元/时)</label>
                        <input type="number" class="form-control" name="budget_min" min="0" placeholder="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">预算最高(元/时)</label>
                        <input type="number" class="form-control" name="budget_max" min="0" placeholder="0">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">期望上课时间</label>
                    <div class="checkbox-group" id="pref-times-group">
                        ${TIME_SLOTS.map(t => `<label class="checkbox-item"><input type="checkbox" name="preferred_times" value="${t}">${t}</label>`).join('')}
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">备注说明</label>
                    <textarea class="form-control" name="description" placeholder="如：孩子学习情况、对老师的要求等"></textarea>
                </div>
            </form>
        `;

        const footerHtml = `
            <button class="btn btn-secondary" onclick="Modal.close()">取消</button>
            <button class="btn btn-primary" id="btn-submit-demand">发布需求</button>
        `;

        Modal.show(contentHtml, {
            title: '发布家教需求',
            footerHtml,
            onClose: () => {
                FormCache.clear('tutor_demand_create');
            }
        });

        document.querySelectorAll('#pref-times-group .checkbox-item').forEach(item => {
            const input = item.querySelector('input');
            item.addEventListener('click', (e) => {
                if (e.target !== input) {
                    input.checked = !input.checked;
                }
                item.classList.toggle('active', input.checked);
            });
        });

        const form = document.getElementById('demand-form');
        const cache = FormCache.setup('tutor_demand_create', form);
        if (cache.hasCached) {
            Toast.info('已自动恢复您上次填写的内容');
            document.querySelectorAll('#pref-times-group .checkbox-item').forEach(item => {
                const input = item.querySelector('input');
                item.classList.toggle('active', input.checked);
            });
        }

        document.getElementById('btn-submit-demand').addEventListener('click', async () => {
            const form = document.getElementById('demand-form');
            const formData = new FormData(form);
            const prefTimes = formData.getAll('preferred_times');

            const data = {
                subject: formData.get('subject'),
                grade: formData.get('grade'),
                frequency: formData.get('frequency') || '',
                budget_min: parseInt(formData.get('budget_min')) || 0,
                budget_max: parseInt(formData.get('budget_max')) || 0,
                preferred_times: prefTimes.join(','),
                description: formData.get('description') || ''
            };

            if (!data.subject || !data.grade) {
                Toast.warning('请填写科目和年级');
                return;
            }

            const btn = document.getElementById('btn-submit-demand');
            btn.disabled = true;
            btn.innerHTML = '<span class="loading"></span> 发布中...';

            try {
                const result = await TutorService.createDemand(data);
                if (result.code === 0) {
                    cache.clear();
                    Toast.success('需求发布成功');
                    Modal.close();
                    await this.loadDemands();
                } else {
                    Toast.error(result.message);
                }
            } catch (e) {}

            btn.disabled = false;
            btn.textContent = '发布需求';
        });
    },

    showEditModal(demandId) {
        const d = this.demands.find(x => x.id === demandId);
        if (!d) return;

        const prefTimes = d.preferred_times_list || [];

        const contentHtml = `
            <form id="demand-edit-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">科目<span class="required">*</span></label>
                        <select class="form-control" name="subject" required>
                            <option value="">请选择科目</option>
                            ${SUBJECTS.map(s => `<option value="${s}" ${d.subject === s ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">年级<span class="required">*</span></label>
                        <select class="form-control" name="grade" required>
                            <option value="">请选择年级</option>
                            ${GRADES.map(g => `<option value="${g}" ${d.grade === g ? 'selected' : ''}>${g}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">上课频率</label>
                    <select class="form-control" name="frequency">
                        <option value="">请选择</option>
                        ${['每周1次', '每周2次', '每周3次', '每周4次及以上', '寒暑假集中'].map(f => `<option value="${f}" ${d.frequency === f ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">预算最低(元/时)</label>
                        <input type="number" class="form-control" name="budget_min" min="0" value="${d.budget_min || 0}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">预算最高(元/时)</label>
                        <input type="number" class="form-control" name="budget_max" min="0" value="${d.budget_max || 0}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">期望上课时间</label>
                    <div class="checkbox-group" id="edit-times-group">
                        ${TIME_SLOTS.map(t => `<label class="checkbox-item ${prefTimes.includes(t) ? 'active' : ''}"><input type="checkbox" name="preferred_times" value="${t}" ${prefTimes.includes(t) ? 'checked' : ''}>${t}</label>`).join('')}
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">备注说明</label>
                    <textarea class="form-control" name="description">${d.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">状态</label>
                    <select class="form-control" name="status">
                        <option value="active" ${d.status === 'active' ? 'selected' : ''}>招募中</option>
                        <option value="matched" ${d.status === 'matched' ? 'selected' : ''}>已匹配</option>
                        <option value="closed" ${d.status === 'closed' ? 'selected' : ''}>已关闭</option>
                    </select>
                </div>
            </form>
        `;

        const footerHtml = `
            <button class="btn btn-secondary" onclick="Modal.close()">取消</button>
            <button class="btn btn-primary" id="btn-save-demand">保存修改</button>
        `;

        Modal.show(contentHtml, {
            title: '编辑需求',
            footerHtml,
            onClose: () => {
                FormCache.clear(`tutor_demand_edit_${demandId}`);
            }
        });

        document.querySelectorAll('#edit-times-group .checkbox-item').forEach(item => {
            const input = item.querySelector('input');
            item.addEventListener('click', (e) => {
                if (e.target !== input) {
                    input.checked = !input.checked;
                }
                item.classList.toggle('active', input.checked);
            });
        });

        const form = document.getElementById('demand-edit-form');
        const cache = FormCache.setup(`tutor_demand_edit_${demandId}`, form);
        if (cache.hasCached) {
            Toast.info('已自动恢复您上次填写的内容');
            document.querySelectorAll('#edit-times-group .checkbox-item').forEach(item => {
                const input = item.querySelector('input');
                item.classList.toggle('active', input.checked);
            });
        }

        document.getElementById('btn-save-demand').addEventListener('click', async () => {
            const form = document.getElementById('demand-edit-form');
            const formData = new FormData(form);
            const prefTimes = formData.getAll('preferred_times');

            const data = {
                subject: formData.get('subject'),
                grade: formData.get('grade'),
                frequency: formData.get('frequency') || '',
                budget_min: parseInt(formData.get('budget_min')) || 0,
                budget_max: parseInt(formData.get('budget_max')) || 0,
                preferred_times: prefTimes.join(','),
                description: formData.get('description') || '',
                status: formData.get('status')
            };

            if (!data.subject || !data.grade) {
                Toast.warning('请填写科目和年级');
                return;
            }

            const btn = document.getElementById('btn-save-demand');
            btn.disabled = true;
            btn.innerHTML = '<span class="loading"></span> 保存中...';

            try {
                const result = await TutorService.updateDemand(demandId, data);
                if (result.code === 0) {
                    cache.clear();
                    Toast.success('修改成功');
                    Modal.close();
                    await this.loadDemands();
                } else {
                    Toast.error(result.message);
                }
            } catch (e) {}

            btn.disabled = false;
            btn.textContent = '保存修改';
        });
    },

    async deleteDemand(id) {
        if (!confirm('确定要删除这个需求吗？')) return;
        try {
            const result = await TutorService.deleteDemand(id);
            if (result.code === 0) {
                Toast.success('删除成功');
                await this.loadDemands();
            } else {
                Toast.error(result.message);
            }
        } catch (e) {}
    },

    async showMatchModal(demandId) {
        const demand = this.demands.find(x => x.id === demandId);
        if (!demand) return;

        Modal.show(`
            <div id="match-result">
                <div class="text-center" style="padding: 40px;"><span class="loading"></span> 正在为您匹配教师...</div>
            </div>
        `, { title: `匹配教师 - ${demand.subject}·${demand.grade}`, width: 'large' });

        try {
            const result = await TutorService.matchTeachers(demandId);
            if (result.code !== 0) {
                Toast.error(result.message);
                Modal.close();
                return;
            }

            const matches = result.data || [];
            const html = matches.length ? `
                <p style="color: var(--text-secondary); margin-bottom: 16px;">共找到 ${matches.length} 位匹配的教师</p>
                <div style="display: grid; gap: 12px;">
                    ${matches.map(m => {
                        const t = m.teacher;
                        const scoreClass = m.match_score >= 60 ? 'high' : (m.match_score >= 30 ? 'medium' : '');
                        const budget = t.budget_max > 0 ? `¥${t.budget_min} - ¥${t.budget_max}/时` : (t.budget_min > 0 ? `¥${t.budget_min}/时起` : '面议');
                        return `
                            <div class="teacher-card">
                                <div class="card-top">
                                    <div>
                                        <div class="card-name">${t.real_name || t.username}</div>
                                        <div class="card-subtitle">${t.grade || ''} · ${t.location || '位置未填'}</div>
                                    </div>
                                    <span class="match-score ${scoreClass}">匹配度 ${m.match_score}%</span>
                                </div>
                                ${t.subjects_list && t.subjects_list.length ? `
                                    <div class="subject-tags">
                                        ${t.subjects_list.map(s => `<span class="subject-tag">${s}</span>`).join('')}
                                    </div>
                                ` : ''}
                                ${t.available_times_list && t.available_times_list.length ? `
                                    <div class="time-tags">
                                        ${t.available_times_list.slice(0, 6).map(tm => `<span class="time-tag">${tm}</span>`).join('')}
                                        ${t.available_times_list.length > 6 ? `<span class="time-tag">+${t.available_times_list.length - 6}更多</span>` : ''}
                                    </div>
                                ` : ''}
                                <div class="card-info-row">
                                    <span><span class="label">期望薪资：</span>${budget}</span>
                                </div>
                                ${t.introduction ? `<p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 12px;">${t.introduction}</p>` : ''}
                                <div class="card-actions">
                                    <button class="btn btn-sm btn-primary" onclick="DemandPage.scheduleCourse(${demandId}, ${t.user_id}, '${demand.subject}', '${demand.grade}')">约课</button>
                                    <button class="btn btn-sm btn-secondary" onclick="DemandPage.showTeacherDetail(${t.user_id})">查看详情</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : `
                <div class="empty-state">
                    <div class="icon">🔍</div>
                    <p>暂无匹配的教师</p>
                    <p class="hint">您可以稍后再试，或调整需求条件</p>
                </div>
            `;

            document.getElementById('match-result').innerHTML = html;
        } catch (e) {
            document.getElementById('match-result').innerHTML = `
                <div class="empty-state">
                    <div class="icon">⚠️</div>
                    <p>匹配失败，请稍后重试</p>
                </div>
            `;
        }
    },

    scheduleCourse(demandId, teacherId, subject, grade) {
        MatchPage.showScheduleModal({
            teacherId,
            demandId,
            subject,
            grade,
            onSuccess: () => this.loadDemands()
        });
    },

    async showTeacherDetail(userId) {
        try {
            const result = await TutorService.getTeacherDetail(userId);
            if (result.code !== 0) {
                Toast.error(result.message);
                return;
            }

            const t = result.data;
            const budget = t.budget_max > 0 ? `¥${t.budget_min} - ¥${t.budget_max}/时` : (t.budget_min > 0 ? `¥${t.budget_min}/时起` : '面议');

            const html = `
                <div class="course-detail">
                    <p><span class="detail-label">姓名</span><span class="detail-value">${t.real_name || t.username}</span></p>
                    <p><span class="detail-label">年级</span><span class="detail-value">${t.grade || '未填'}</span></p>
                    <p><span class="detail-label">位置</span><span class="detail-value">${t.location || '未填'}</span></p>
                    <p><span class="detail-label">期望薪资</span><span class="detail-value">${budget}</span></p>
                    <p><span class="detail-label">擅长科目</span><span class="detail-value">${t.subjects_list && t.subjects_list.length ? t.subjects_list.join('、') : '未填'}</span></p>
                    <p><span class="detail-label">空闲时间</span><span class="detail-value">${t.available_times_list && t.available_times_list.length ? t.available_times_list.join('、') : '未填'}</span></p>
                    <p><span class="detail-label">个人简介</span><span class="detail-value">${t.introduction || '暂无'}</span></p>
                </div>
            `;

            Modal.show(html, { title: '教师详情' });
        } catch (e) {}
    }
};

window.DemandPage = DemandPage;
