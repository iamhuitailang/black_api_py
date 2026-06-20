const MatchPage = {
    viewType: 'match',

    async render() {
        if (!AuthService.requireAuth()) return;

        const user = AuthService.getUser();
        const role = user && user.profile ? user.profile.role : 'parent';

        const title = role === 'parent' ? '匹配教师' : '匹配需求';
        const subtitle = role === 'parent' ? '浏览系统推荐的教师' : '浏览系统推荐的家教需求';

        CommonLayout.render(`
            <div class="page-header">
                <div class="page-title">${title}</div>
                <div class="page-subtitle">${subtitle}</div>
            </div>
            <div id="match-content">
                <div class="text-center" style="padding: 60px;"><span class="loading"></span> 加载中...</div>
            </div>
        `, 'match', title);

        await this.loadData();
    },

    async loadData() {
        const user = AuthService.getUser();
        const role = user && user.profile ? user.profile.role : 'parent';

        try {
            if (role === 'parent') {
                await this.loadTeachers();
            } else {
                await this.loadDemands();
            }
        } catch (e) {}
    },

    async loadTeachers() {
        try {
            const result = await TutorService.listTeachers();
            if (result.code !== 0) {
                Toast.error(result.message);
                return;
            }

            const teachers = result.data || [];
            const html = teachers.length ? `
                <div class="card-list">
                    ${teachers.map(t => this.renderTeacherCard(t)).join('')}
                </div>
            ` : this.getEmptyState('teacher');

            document.getElementById('match-content').innerHTML = html;
        } catch (e) {}
    },

    async loadDemands() {
        try {
            const result = await TutorService.matchDemands();
            if (result.code !== 0) {
                Toast.error(result.message);
                return;
            }

            const matches = result.data || [];
            const html = matches.length ? `
                <p style="color: var(--text-secondary); margin-bottom: 16px;">共为您匹配到 ${matches.length} 条需求</p>
                <div class="card-list">
                    ${matches.map(m => this.renderDemandCard(m.demand, m.match_score)).join('')}
                </div>
            ` : this.getEmptyState('demand');

            document.getElementById('match-content').innerHTML = html;
        } catch (e) {}
    },

    getEmptyState(type) {
        if (type === 'teacher') {
            return `
                <div class="card">
                    <div class="card-body">
                        <div class="empty-state">
                            <div class="icon">👨‍🏫</div>
                            <p>暂无教师信息</p>
                            <p class="hint">稍后再来看看吧</p>
                        </div>
                    </div>
                </div>
            `;
        }
        return `
            <div class="card">
                <div class="card-body">
                    <div class="empty-state">
                        <div class="icon">📋</div>
                        <p>暂无匹配的需求</p>
                        <p class="hint">完善您的个人资料以获得更好的匹配</p>
                        <div class="mt-2">
                            <button class="btn btn-primary" onclick="Router.navigate('profile')">完善资料</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderTeacherCard(t) {
        const user = AuthService.getUser();
        const parentId = user.id;
        const budget = t.budget_max > 0 ? `¥${t.budget_min} - ¥${t.budget_max}/时` : (t.budget_min > 0 ? `¥${t.budget_min}/时起` : '面议');

        return `
            <div class="teacher-card">
                <div class="card-top">
                    <div>
                        <div class="card-name">${t.real_name || t.username}</div>
                        <div class="card-subtitle">${t.grade || '年级未填'} · ${t.location || '位置未填'}</div>
                    </div>
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
                    <button class="btn btn-sm btn-primary" onclick="MatchPage.showScheduleModal({teacherId: ${t.user_id}, parentId: ${parentId}})">发起约课</button>
                    <button class="btn btn-sm btn-secondary" onclick="DemandPage.showTeacherDetail(${t.user_id})">查看详情</button>
                </div>
            </div>
        `;
    },

    renderDemandCard(d, matchScore) {
        const user = AuthService.getUser();
        const teacherId = user.id;
        const scoreClass = matchScore ? (matchScore >= 60 ? 'high' : (matchScore >= 30 ? 'medium' : '')) : '';
        const prefTimes = d.preferred_times_list || [];
        const budget = d.budget_max > 0 ? `¥${d.budget_min} - ¥${d.budget_max}/时` : (d.budget_min > 0 ? `¥${d.budget_min}/时起` : '面议');

        return `
            <div class="demand-card">
                <div class="card-top">
                    <div>
                        <div class="card-name">${d.subject} · ${d.grade}</div>
                        <div class="card-subtitle">${d.parent_name || d.parent_username} · ${d.parent_location || '位置未填'}</div>
                    </div>
                    ${matchScore ? `<span class="match-score ${scoreClass}">匹配度 ${matchScore}%</span>` : ''}
                </div>
                <div class="card-info-row">
                    <span><span class="label">频率：</span>${d.frequency || '待议'}</span>
                    <span><span class="label">预算：</span>${budget}</span>
                </div>
                ${prefTimes.length ? `
                    <div class="time-tags">
                        ${prefTimes.map(t => `<span class="time-tag">${t}</span>`).join('')}
                    </div>
                ` : ''}
                ${d.description ? `<p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 12px;">${d.description}</p>` : ''}
                <div class="card-actions">
                    <button class="btn btn-sm btn-primary" onclick="MatchPage.showScheduleModal({parentId: ${d.parent_id}, teacherId: ${teacherId}, demandId: ${d.id}, subject: '${d.subject}', grade: '${d.grade}'})">接受约课</button>
                </div>
            </div>
        `;
    },

    showScheduleModal(options = {}) {
        const user = AuthService.getUser();
        const myRole = user && user.profile ? user.profile.role : 'parent';
        const teacherId = options.teacherId || (myRole === 'teacher' ? user.id : '');
        const parentId = options.parentId || (myRole === 'parent' ? user.id : '');
        const subject = options.subject || '';
        const grade = options.grade || '';
        const demandId = options.demandId || '';
        const onSuccess = options.onSuccess;

        const today = new Date().toISOString().split('T')[0];

        const contentHtml = `
            <form id="schedule-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">科目<span class="required">*</span></label>
                        <select class="form-control" name="subject" required>
                            <option value="">请选择</option>
                            ${SUBJECTS.map(s => `<option value="${s}" ${subject === s ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">年级</label>
                        <select class="form-control" name="grade">
                            <option value="">请选择</option>
                            ${GRADES.map(g => `<option value="${g}" ${grade === g ? 'selected' : ''}>${g}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">上课日期<span class="required">*</span></label>
                    <input type="date" class="form-control" name="course_date" min="${today}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">开始时间<span class="required">*</span></label>
                        <input type="time" class="form-control" name="start_time" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">结束时间<span class="required">*</span></label>
                        <input type="time" class="form-control" name="end_time" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">课时费(元/时)</label>
                        <input type="number" class="form-control" name="price" min="0" placeholder="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">上课地点</label>
                        <input type="text" class="form-control" name="location" placeholder="如：学生家中">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">备注</label>
                    <textarea class="form-control" name="notes" placeholder="其他需要说明的事项"></textarea>
                </div>
            </form>
        `;

        const footerHtml = `
            <button class="btn btn-secondary" onclick="Modal.close()">取消</button>
            <button class="btn btn-primary" id="btn-submit-schedule">发送约课</button>
        `;

        Modal.show(contentHtml, {
            title: '发起约课',
            footerHtml,
            onClose: () => {
                FormCache.clear('tutor_schedule');
            }
        });

        const form = document.getElementById('schedule-form');
        const cache = FormCache.setup('tutor_schedule', form);
        if (cache.hasCached) {
            Toast.info('已自动恢复您上次填写的内容');
        }

        document.getElementById('btn-submit-schedule').addEventListener('click', async () => {
            const form = document.getElementById('schedule-form');
            const formData = new FormData(form);

            const startTime = formData.get('start_time');
            const endTime = formData.get('end_time');

            if (startTime >= endTime) {
                Toast.warning('结束时间必须晚于开始时间');
                return;
            }

            const data = {
                parent_id: parseInt(parentId),
                teacher_id: parseInt(teacherId),
                subject: formData.get('subject'),
                grade: formData.get('grade') || '',
                demand_id: demandId ? parseInt(demandId) : null,
                course_date: formData.get('course_date'),
                start_time: startTime,
                end_time: endTime,
                price: parseInt(formData.get('price')) || 0,
                location: formData.get('location') || '',
                notes: formData.get('notes') || ''
            };

            if (!data.subject || !data.course_date || !data.start_time || !data.end_time) {
                Toast.warning('请填写必要信息');
                return;
            }

            const btn = document.getElementById('btn-submit-schedule');
            btn.disabled = true;
            btn.innerHTML = '<span class="loading"></span> 提交中...';

            try {
                const result = await TutorService.createCourse(data);
                if (result.code === 0) {
                    cache.clear();
                    Toast.success('约课已发送，等待对方确认');
                    Modal.close();
                    if (onSuccess) onSuccess();
                } else {
                    Toast.error(result.message);
                }
            } catch (e) {}

            btn.disabled = false;
            btn.textContent = '发送约课';
        });
    }
};

window.MatchPage = MatchPage;
