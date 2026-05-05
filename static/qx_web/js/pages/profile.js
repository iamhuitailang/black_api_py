const ProfilePage = {
    user: null,
    stats: null,
    render: async function() {
        if (!Auth.isLoggedIn()) {
            Router.go('login');
            return;
        }

        const pageContent = document.getElementById('page-content');
        pageContent.innerHTML = App.renderLoading();

        await this.loadData();
    },
    loadData: async function() {
        try {
            const userResult = await API.get('/user/current/get');
            if (userResult.code === 0 && userResult.data) {
                this.user = userResult.data;
                Auth.updateUserInfo(this.user);
            }

            const statsResult = await API.get('/ride/statistics/get');
            if (statsResult.code === 0 && statsResult.data) {
                this.stats = statsResult.data;
            }

            this.renderProfile();
        } catch (error) {
            console.error('Load profile error:', error);
            const pageContent = document.getElementById('page-content');
            pageContent.innerHTML = App.renderEmpty('❌', '加载失败', '请稍后重试');
        }
    },
    renderProfile: function() {
        const pageContent = document.getElementById('page-content');
        const user = this.user || {};
        const stats = this.stats || {};

        const avatarText = user.nickname ? user.nickname.charAt(0).toUpperCase() : 'U';

        pageContent.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar">${avatarText}</div>
                <div class="profile-info">
                    <h2>${user.nickname || '用户'}</h2>
                    <div class="profile-level">${user.level || '萌新'}</div>
                    ${user.bike_type ? `<div class="profile-bike">🚴 ${user.bike_type}</div>` : ''}
                    <div class="profile-stats">
                        <div class="profile-stat">
                            <div class="profile-stat-value">${(stats.total_distance || user.total_distance || 0).toFixed(1)}</div>
                            <div class="profile-stat-label">累计里程 (km)</div>
                        </div>
                        <div class="profile-stat">
                            <div class="profile-stat-value">${stats.total_duration || user.total_duration || 0}</div>
                            <div class="profile-stat-label">累计时长 (分钟)</div>
                        </div>
                        <div class="profile-stat">
                            <div class="profile-stat-value">${(stats.avg_speed || user.avg_speed || 0).toFixed(1)}</div>
                            <div class="profile-stat-label">平均速度 (km/h)</div>
                        </div>
                        <div class="profile-stat">
                            <div class="profile-stat-value">${stats.ride_count || 0}</div>
                            <div class="profile-stat-label">骑行次数</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="tabs">
                <div class="tab active" data-tab="info">个人信息</div>
                <div class="tab" data-tab="security">账号安全</div>
            </div>

            <div id="tab-content">
                ${this.renderInfoTab()}
            </div>
        `;

        this.setupEventListeners();
    },
    renderInfoTab: function() {
        const user = this.user || {};
        return `
            <div class="card">
                <div class="card-body">
                    <form id="profile-form">
                        <div class="form-group">
                            <label class="form-label">昵称</label>
                            <input type="text" class="form-input" id="nickname" name="nickname" value="${user.nickname || ''}" maxlength="20">
                        </div>
                        <div class="form-group">
                            <label class="form-label">手机号</label>
                            <input type="text" class="form-input" value="${user.phone || ''}" disabled>
                        </div>
                        <div class="form-group">
                            <label class="form-label">车辆类型</label>
                            <select class="form-select" id="bike_type" name="bike_type">
                                <option value="">请选择</option>
                                <option value="公路车" ${user.bike_type === '公路车' ? 'selected' : ''}>公路车</option>
                                <option value="山地车" ${user.bike_type === '山地车' ? 'selected' : ''}>山地车</option>
                                <option value="折叠车" ${user.bike_type === '折叠车' ? 'selected' : ''}>折叠车</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">个人简介</label>
                            <textarea class="form-textarea" id="bio" name="bio" placeholder="介绍一下自己..." maxlength="200">${user.bio || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn btn-green btn-lg w-full" id="save-btn">保存修改</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },
    renderSecurityTab: function() {
        return `
            <div class="card">
                <div class="card-body">
                    <form id="password-form">
                        <div class="form-group">
                            <label class="form-label">原密码</label>
                            <input type="password" class="form-input" id="old_password" name="old_password" placeholder="请输入原密码">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新密码</label>
                            <input type="password" class="form-input" id="new_password" name="new_password" placeholder="请输入新密码（至少6位）">
                        </div>
                        <div class="form-group">
                            <label class="form-label">确认新密码</label>
                            <input type="password" class="form-input" id="confirm_password" name="confirm_password" placeholder="请再次输入新密码">
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn btn-green btn-lg w-full" id="change-password-btn">修改密码</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },
    setupEventListeners: function() {
        const self = this;

        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                const tabName = this.dataset.tab;
                const tabContent = document.getElementById('tab-content');

                if (tabName === 'info') {
                    tabContent.innerHTML = self.renderInfoTab();
                    self.setupInfoForm();
                } else if (tabName === 'security') {
                    tabContent.innerHTML = self.renderSecurityTab();
                    self.setupSecurityForm();
                }
            });
        });

        this.setupInfoForm();
    },
    setupInfoForm: function() {
        const self = this;
        const form = document.getElementById('profile-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nickname = document.getElementById('nickname').value.trim();
            const bikeType = document.getElementById('bike_type').value;
            const bio = document.getElementById('bio').value.trim();
            const saveBtn = document.getElementById('save-btn');

            if (!nickname) {
                App.showToast('请输入昵称', 'error');
                return;
            }

            saveBtn.disabled = true;
            saveBtn.textContent = '保存中...';

            try {
                const data = {
                    nickname: nickname
                };

                if (bikeType) {
                    data.bike_type = bikeType;
                }

                if (bio) {
                    data.bio = bio;
                }

                const result = await API.post('/user/update', data);
                
                if (result.code === 0) {
                    App.showToast('保存成功', 'success');
                    App.updateUserInfo();
                } else {
                    App.showToast(result.msg || '保存失败', 'error');
                }
            } catch (error) {
                App.showToast('保存失败，请稍后重试', 'error');
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = '保存修改';
            }
        });
    },
    setupSecurityForm: function() {
        const form = document.getElementById('password-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const oldPassword = document.getElementById('old_password').value;
            const newPassword = document.getElementById('new_password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            const btn = document.getElementById('change-password-btn');

            if (!oldPassword) {
                App.showToast('请输入原密码', 'error');
                return;
            }

            if (!newPassword) {
                App.showToast('请输入新密码', 'error');
                return;
            }

            if (newPassword.length < 6) {
                App.showToast('新密码至少6位', 'error');
                return;
            }

            if (newPassword !== confirmPassword) {
                App.showToast('两次输入的密码不一致', 'error');
                return;
            }

            btn.disabled = true;
            btn.textContent = '修改中...';

            try {
                const result = await API.post('/user/password/update', {
                    old_password: oldPassword,
                    new_password: newPassword
                });
                
                if (result.code === 0) {
                    App.showToast('修改成功', 'success');
                    document.getElementById('old_password').value = '';
                    document.getElementById('new_password').value = '';
                    document.getElementById('confirm_password').value = '';
                } else {
                    App.showToast(result.msg || '修改失败', 'error');
                }
            } catch (error) {
                App.showToast('修改失败，请稍后重试', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = '修改密码';
            }
        });
    }
};

Router.register('profile', function(params) {
    ProfilePage.render();
});
