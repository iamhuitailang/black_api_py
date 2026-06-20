const ProfilePage = {
    async render() {
        if (!AuthService.requireAuth()) return;

        CommonLayout.render(`
            <div class="page-header">
                <div class="page-title">个人资料</div>
                <div class="page-subtitle">管理您的个人信息</div>
            </div>
            <div id="profile-content">
                <div class="text-center" style="padding: 60px;"><span class="loading"></span> 加载中...</div>
            </div>
        `, 'profile', '个人资料');

        await this.loadData();
    },

    async loadData() {
        try {
            const result = await AuthService.getCurrentUser();
            if (result.code !== 0) {
                Toast.error(result.message);
                return;
            }

            const user = result.data;
            const profile = user.profile || {};
            const role = profile.role;
            const subjects = profile.subjects_list || [];
            const times = profile.available_times_list || [];

            CommonLayout.updateContent(`
                <div class="page-header">
                    <div class="page-title">个人资料</div>
                    <div class="page-subtitle">管理您的个人信息</div>
                </div>
                <div class="card">
                    <div class="card-body">
                        <form id="profile-form">
                            <div class="profile-section">
                                <div class="profile-section-title">基本信息</div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label">用户名</label>
                                        <input type="text" class="form-control" value="${user.username}" disabled>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">身份</label>
                                        <input type="text" class="form-control" value="${role === 'parent' ? '家长' : '教师'}" disabled>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label">真实姓名<span class="required">*</span></label>
                                        <input type="text" class="form-control" name="real_name" value="${profile.real_name || ''}" required>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">手机号</label>
                                        <input type="tel" class="form-control" name="phone" value="${profile.phone || ''}">
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label">${role === 'parent' ? '孩子年级' : '教授年级'}</label>
                                        <select class="form-control" name="grade">
                                            <option value="">请选择</option>
                                            ${GRADES.map(g => `<option value="${g}" ${profile.grade === g ? 'selected' : ''}>${g}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">所在地区</label>
                                        <input type="text" class="form-control" name="location" value="${profile.location || ''}" placeholder="如：北京市海淀区">
                                    </div>
                                </div>
                            </div>

                            <div class="profile-section">
                                <div class="profile-section-title">${role === 'parent' ? '辅导需求' : '教学能力'}</div>
                                <div class="form-group">
                                    <label class="form-label">${role === 'parent' ? '需要辅导的科目' : '擅长科目'}</label>
                                    <div class="checkbox-group" id="subjects-group">
                                        ${SUBJECTS.map(s => `<label class="checkbox-item ${subjects.includes(s) ? 'active' : ''}"><input type="checkbox" name="subjects" value="${s}" ${subjects.includes(s) ? 'checked' : ''}>${s}</label>`).join('')}
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">${role === 'parent' ? '期望上课时间' : '空闲时间'}</label>
                                    <div class="checkbox-group" id="times-group">
                                        ${TIME_SLOTS.map(t => `<label class="checkbox-item ${times.includes(t) ? 'active' : ''}"><input type="checkbox" name="available_times" value="${t}" ${times.includes(t) ? 'checked' : ''}>${t}</label>`).join('')}
                                    </div>
                                </div>
                                ${role === 'teacher' ? `
                                <div class="form-group">
                                    <label class="form-label">个人简介</label>
                                    <textarea class="form-control" name="introduction" placeholder="介绍一下你的教学经历、风格等">${profile.introduction || ''}</textarea>
                                </div>
                                ` : ''}
                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label">${role === 'parent' ? '预算最低(元/时)' : '期望时薪最低'}</label>
                                        <input type="number" class="form-control" name="budget_min" value="${profile.budget_min || 0}" min="0">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">${role === 'parent' ? '预算最高(元/时)' : '期望时薪最高'}</label>
                                        <input type="number" class="form-control" name="budget_max" value="${profile.budget_max || 0}" min="0">
                                    </div>
                                </div>
                            </div>

                            <div class="flex-between">
                                <button type="button" class="btn btn-secondary" onclick="Router.navigate('dashboard')">返回</button>
                                <button type="submit" class="btn btn-primary">保存修改</button>
                            </div>
                        </form>
                    </div>
                </div>
            `);

            this.bindEvents();
        } catch (e) {}
    },

    bindEvents() {
        document.querySelectorAll('.checkbox-item').forEach(item => {
            const input = item.querySelector('input');
            item.addEventListener('click', (e) => {
                if (e.target !== input) {
                    input.checked = !input.checked;
                }
                item.classList.toggle('active', input.checked);
            });
        });

        const form = document.getElementById('profile-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);

            const subjects = formData.getAll('subjects');
            const availableTimes = formData.getAll('available_times');

            if (!subjects.length) {
                Toast.warning('请至少选择一个科目');
                return;
            }

            const data = {
                real_name: formData.get('real_name').trim(),
                phone: formData.get('phone') || '',
                grade: formData.get('grade') || '',
                subjects: subjects.join(','),
                available_times: availableTimes.join(','),
                location: formData.get('location') || '',
                budget_min: parseInt(formData.get('budget_min')) || 0,
                budget_max: parseInt(formData.get('budget_max')) || 0
            };

            const introEl = form.querySelector('[name="introduction"]');
            if (introEl) {
                data.introduction = introEl.value || '';
            }

            if (!data.real_name) {
                Toast.warning('请填写真实姓名');
                return;
            }

            const btn = form.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<span class="loading"></span> 保存中...';

            try {
                const result = await AuthService.updateProfile(data);
                if (result.code === 0) {
                    Toast.success('保存成功');
                    await AuthService.getCurrentUser();
                } else {
                    Toast.error(result.message);
                }
            } catch (e) {}

            btn.disabled = false;
            btn.textContent = '保存修改';
        });
    }
};
