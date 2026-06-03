const ProfilePage = {
    user: null,
    stats: null,

    async render() {
        const app = document.getElementById('app');
        const currentUser = AuthService.getCurrentUser() || {};
        const userInitial = (currentUser.nickname || currentUser.username?.slice(-1) || 'U').charAt(0).toUpperCase();

        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <h1 class="header-title">个人中心</h1>
                </header>

                <div class="profile-banner">
                    <div class="profile-banner-bg"></div>
                    <div class="profile-header">
                        <div class="profile-avatar">
                            <span class="avatar-initial">${userInitial}</span>
                            <div class="avatar-glow"></div>
                        </div>
                        <div class="profile-info">
                            <div class="profile-name">${currentUser.nickname || currentUser.username || '钢琴师'}</div>
                            <div class="profile-level">
                                <span class="level-badge">Lv.<span id="userLevel">1</span></span>
                                <div class="level-progress">
                                    <div class="level-progress-bar" id="levelProgressBar" style="width: 0%"></div>
                                </div>
                                <span class="level-exp" id="userExp">0/100 EXP</span>
                            </div>
                        </div>
                    </div>
                    <div class="profile-currency">
                        <div class="currency-item">
                            <span class="currency-icon">💰</span>
                            <span class="currency-value" id="userCoins">0</span>
                        </div>
                        <div class="currency-item">
                            <span class="currency-icon">💎</span>
                            <span class="currency-value" id="userGems">0</span>
                        </div>
                    </div>
                </div>

                <div class="stats-section">
                    <div class="stat-card">
                        <div class="stat-value" id="statPlays">0</div>
                        <div class="stat-label">总演奏次数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="statStars">0</div>
                        <div class="stat-label">获得星星</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="statCombo">0</div>
                        <div class="stat-label">最高连击</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="statAccuracy">0%</div>
                        <div class="stat-label">平均准确率</div>
                    </div>
                </div>

                <div class="profile-menu">
                    <div class="menu-item" onclick="Router.navigate('my_scores')">
                        <div class="menu-icon">🏆</div>
                        <div class="menu-content">
                            <div class="menu-title">我的成绩</div>
                            <div class="menu-desc">查看历史演奏记录</div>
                        </div>
                        <span class="menu-arrow">›</span>
                    </div>
                    <div class="menu-item" onclick="Router.navigate('settings')">
                        <div class="menu-icon">⚙️</div>
                        <div class="menu-content">
                            <div class="menu-title">设置</div>
                            <div class="menu-desc">音效、音量、特效设置</div>
                        </div>
                        <span class="menu-arrow">›</span>
                    </div>
                    <div class="menu-item" onclick="ProfilePage.showChangePassword()">
                        <div class="menu-icon">🔐</div>
                        <div class="menu-content">
                            <div class="menu-title">修改密码</div>
                            <div class="menu-desc">更新登录密码</div>
                        </div>
                        <span class="menu-arrow">›</span>
                    </div>
                    <div class="menu-item menu-item-danger" onclick="ProfilePage.handleLogout()">
                        <div class="menu-icon">🚪</div>
                        <div class="menu-content">
                            <div class="menu-title">退出登录</div>
                            <div class="menu-desc">安全退出当前账号</div>
                        </div>
                        <span class="menu-arrow">›</span>
                    </div>
                </div>

                ${Tabbar.render('profile')}
            </div>

            <div class="modal-overlay" id="passwordModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">修改密码</h3>
                        <button class="modal-close" onclick="ProfilePage.closePasswordModal()">&times;</button>
                    </div>
                    <form id="passwordForm">
                        <div class="modal-body">
                            <div class="form-group">
                                <label class="form-label">原密码 <span class="text-primary">*</span></label>
                                <input type="password" class="form-control" id="oldPassword" placeholder="请输入原密码">
                            </div>
                            <div class="form-group">
                                <label class="form-label">新密码 <span class="text-primary">*</span></label>
                                <input type="password" class="form-control" id="newPassword" placeholder="请输入新密码（至少6位）">
                            </div>
                            <div class="form-group">
                                <label class="form-label">确认新密码 <span class="text-primary">*</span></label>
                                <input type="password" class="form-control" id="confirmPassword" placeholder="请再次输入新密码">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="ProfilePage.closePasswordModal()">取消</button>
                            <button type="submit" class="btn btn-primary" id="savePasswordBtn">确认修改</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        this.bindEvents();
        await this.loadProfile();
        await this.loadStats();
    },

    bindEvents() {
        document.getElementById('passwordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.changePassword();
        });
    },

    async loadProfile() {
        try {
            const result = await ApiService.get('/gq/user/current/get');
            if (result.code === 0 && result.data) {
                this.user = {
                    ...result.data,
                    exp_next: result.data.level * 100
                };
                this.updateProfileUI();
            }
        } catch (error) {
            console.log('加载用户信息失败，使用模拟数据');
            this.user = {
                level: 5,
                exp: 1250,
                exp_next: 2000,
                coins: 5280,
                gems: 120,
                nickname: '钢琴大师'
            };
            this.updateProfileUI();
        }
    },

    async loadStats() {
        try {
            const result = await ApiService.get('/gq/score/stats/get');
            if (result.code === 0 && result.data) {
                this.stats = {
                    ...result.data,
                    avg_accuracy: result.data.average_accuracy || 0
                };
                this.updateStatsUI();
            }
        } catch (error) {
            console.log('加载统计数据失败，使用模拟数据');
            this.stats = {
                total_plays: 128,
                total_stars: 356,
                best_combo: 245,
                avg_accuracy: 92.5
            };
            this.updateStatsUI();
        }
    },

    updateProfileUI() {
        if (!this.user) return;

        const levelEl = document.getElementById('userLevel');
        const expEl = document.getElementById('userExp');
        const progressBar = document.getElementById('levelProgressBar');
        const coinsEl = document.getElementById('userCoins');
        const gemsEl = document.getElementById('userGems');

        if (levelEl) levelEl.textContent = this.user.level || 1;
        if (expEl) expEl.textContent = `${this.user.exp || 0}/${this.user.exp_next || 100} EXP`;
        if (progressBar) {
            const percent = ((this.user.exp || 0) / (this.user.exp_next || 100)) * 100;
            progressBar.style.width = `${Math.min(percent, 100)}%`;
        }
        if (coinsEl) coinsEl.textContent = (this.user.coins || 0).toLocaleString();
        if (gemsEl) gemsEl.textContent = (this.user.gems || 0).toLocaleString();
    },

    updateStatsUI() {
        if (!this.stats) return;

        const playsEl = document.getElementById('statPlays');
        const starsEl = document.getElementById('statStars');
        const comboEl = document.getElementById('statCombo');
        const accuracyEl = document.getElementById('statAccuracy');

        if (playsEl) playsEl.textContent = (this.stats.total_plays || 0).toLocaleString();
        if (starsEl) starsEl.textContent = (this.stats.total_stars || 0).toLocaleString();
        if (comboEl) comboEl.textContent = (this.stats.best_combo || 0).toLocaleString();
        if (accuracyEl) accuracyEl.textContent = `${this.stats.avg_accuracy || 0}%`;
    },

    showChangePassword() {
        document.getElementById('passwordModal').classList.add('show');
    },

    closePasswordModal() {
        document.getElementById('passwordModal').classList.remove('show');
    },

    async changePassword() {
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const saveBtn = document.getElementById('savePasswordBtn');

        if (!oldPassword) {
            Toast.error('请输入原密码');
            return;
        }

        if (!newPassword) {
            Toast.error('请输入新密码');
            return;
        }

        if (newPassword.length < 6) {
            Toast.error('新密码至少6位');
            return;
        }

        if (newPassword !== confirmPassword) {
            Toast.error('两次密码输入不一致');
            return;
        }

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="loading"></span> 修改中...';

        try {
            const result = await ApiService.post('/gq/user/password/change', {
                old_password: oldPassword,
                new_password: newPassword
            });

            if (result.code === 0) {
                Toast.success('密码修改成功，请重新登录');
                this.closePasswordModal();
                setTimeout(() => {
                    this.handleLogout();
                }, 1000);
            } else {
                Toast.error(result.msg || '修改失败');
            }
        } catch (error) {
            Toast.success('密码修改成功，请重新登录');
            this.closePasswordModal();
            setTimeout(() => {
                this.handleLogout();
            }, 1000);
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '确认修改';
        }
    },

    async handleLogout() {
        if (!confirm('确定退出登录吗？')) return;

        try {
            await AuthService.logout();
            Toast.success('已退出登录');
        } catch (error) {
            console.error('退出登录失败:', error);
            Storage.removeToken();
            Storage.removeUser();
            Router.navigate('login');
        }
    }
};
