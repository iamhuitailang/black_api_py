const SettingsPage = {
    async render() {
        const user = AuthService.getCurrentUser();
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <span class="header-back" onclick="Router.back()">←</span>
                    <h1 class="header-title">账号设置</h1>
                </header>

                <div class="menu-list">
                    <div class="menu-item" id="editNickname">
                        <span class="menu-icon">👤</span>
                        <span class="menu-text">昵称</span>
                        <span class="menu-arrow" id="nicknameValue">${user?.nickname || '-'}</span>
                    </div>
                    <div class="menu-item" id="editCity">
                        <span class="menu-icon">🏙️</span>
                        <span class="menu-text">城市</span>
                        <span class="menu-arrow" id="cityValue">${user?.city || '-'}</span>
                    </div>
                    <div class="menu-item" id="editBio">
                        <span class="menu-icon">📝</span>
                        <span class="menu-text">简介</span>
                        <span class="menu-arrow" id="bioValue">${user?.bio || '-'}</span>
                    </div>
                </div>

                <div class="menu-list">
                    <div class="menu-item" id="changePassword">
                        <span class="menu-icon">🔒</span>
                        <span class="menu-text">修改密码</span>
                        <span class="menu-arrow">›</span>
                    </div>
                </div>

                <div id="passwordForm" class="card hidden">
                    <div class="card-body">
                        <div class="form-group">
                            <label class="form-label">原密码</label>
                            <input type="password" id="oldPassword" class="form-control" placeholder="请输入原密码">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新密码</label>
                            <input type="password" id="newPassword" class="form-control" placeholder="请输入新密码(至少6位)">
                        </div>
                        <button class="btn btn-primary btn-block" id="savePasswordBtn">确认修改</button>
                    </div>
                </div>

                ${Tabbar.render('profile')}
            </div>
        `;
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('editNickname').addEventListener('click', () => {
            const current = AuthService.getCurrentUser()?.nickname || '';
            const val = prompt('请输入昵称', current);
            if (val !== null && val.trim()) {
                this.updateProfile({ nickname: val.trim() });
            }
        });

        document.getElementById('editCity').addEventListener('click', () => {
            const current = AuthService.getCurrentUser()?.city || '';
            const val = prompt('请输入城市', current);
            if (val !== null) {
                this.updateProfile({ city: val.trim() });
            }
        });

        document.getElementById('editBio').addEventListener('click', () => {
            const current = AuthService.getCurrentUser()?.bio || '';
            const val = prompt('请输入简介', current);
            if (val !== null) {
                this.updateProfile({ bio: val.trim() });
            }
        });

        document.getElementById('changePassword').addEventListener('click', () => {
            document.getElementById('passwordForm').classList.toggle('hidden');
        });

        document.getElementById('savePasswordBtn').addEventListener('click', async () => {
            const oldPwd = document.getElementById('oldPassword').value;
            const newPwd = document.getElementById('newPassword').value;
            if (!oldPwd || !newPwd) {
                Toast.error('请填写完整');
                return;
            }
            if (newPwd.length < 6) {
                Toast.error('新密码至少6位');
                return;
            }
            if (oldPwd === newPwd) {
                Toast.error('新密码不能与原密码相同');
                return;
            }
            try {
                const result = await AuthService.changePassword(oldPwd, newPwd);
                if (result.code === 0) {
                    Toast.success('密码修改成功，请重新登录');
                    await AuthService.logout();
                    Router.navigate('login');
                } else {
                    Toast.error(result.msg || '修改失败');
                }
            } catch (e) {
                Toast.error('修改失败');
            }
        });
    },

    async updateProfile(data) {
        try {
            const result = await AuthService.updateProfile(data);
            if (result.code === 0) {
                Toast.success('更新成功');
                if (data.nickname) document.getElementById('nicknameValue').textContent = data.nickname;
                if (data.city) document.getElementById('cityValue').textContent = data.city;
                if (data.bio) document.getElementById('bioValue').textContent = data.bio;
            } else {
                Toast.error(result.msg || '更新失败');
            }
        } catch (e) {
            Toast.error('更新失败');
        }
    }
};
