const ProfilePage = {
    user: null,
    stats: null,
    history: null,
    activeTab: 'info',

    render() {
        if (!AuthService.requireAuth()) return;

        const user = AuthService.getUser() || {};
        this.user = user;

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page-container">
                <header class="page-header">
                    <button class="btn btn-outline btn-small" onclick="window.location.hash='#/home'">← 返回</button>
                    <h2>👤 个人中心</h2>
                    <div></div>
                </header>

                <div class="profile-header">
                    <div class="profile-avatar">
                        ${(user.nickname || user.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div class="profile-info">
                        <h3>${user.nickname || user.username || '玩家'}</h3>
                        <div class="profile-stats">
                            <span>💰 ${user.coins || 0} 金币</span>
                            <span>⭐ Lv.${user.level || 1}</span>
                            <span>🏅 ${user.wins || 0}胜</span>
                        </div>
                    </div>
                </div>

                <div class="tabs">
                    <div class="tab ${this.activeTab === 'info' ? 'tab-active' : ''}" data-tab="info">基本信息</div>
                    <div class="tab ${this.activeTab === 'stats' ? 'tab-active' : ''}" data-tab="stats">游戏统计</div>
                    <div class="tab ${this.activeTab === 'history' ? 'tab-active' : ''}" data-tab="history">对战记录</div>
                    <div class="tab ${this.activeTab === 'password' ? 'tab-active' : ''}" data-tab="password">修改密码</div>
                </div>

                <div class="tab-content" id="tabContent">
                    ${this.renderTabContent()}
                </div>
            </div>
        `;

        this.bindEvents();
        this.loadTabData();
    },

    bindEvents() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.activeTab = tab.dataset.tab;
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('tab-active'));
                tab.classList.add('tab-active');
                document.getElementById('tabContent').innerHTML = this.renderTabContent();
                this.loadTabData();
            });
        });
    },

    renderTabContent() {
        switch (this.activeTab) {
            case 'info':
                return this.renderInfoTab();
            case 'stats':
                return '<div class="loading">加载中...</div>';
            case 'history':
                return '<div class="loading">加载中...</div>';
            case 'password':
                return this.renderPasswordTab();
            default:
                return '';
        }
    },

    renderInfoTab() {
        const user = this.user || {};
        return `
            <form id="profileForm" class="form-card">
                <div class="form-group">
                    <label>用户名</label>
                    <input type="text" value="${user.username || ''}" disabled />
                </div>
                <div class="form-group">
                    <label>昵称</label>
                    <input type="text" id="nickname" value="${user.nickname || ''}" placeholder="请输入昵称" />
                </div>
                <div class="form-group">
                    <label>头像URL</label>
                    <input type="text" id="avatar" value="${user.avatar || ''}" placeholder="请输入头像URL" />
                </div>
                <button type="submit" class="btn btn-primary btn-block">保存修改</button>
            </form>
        `;
    },

    renderPasswordTab() {
        return `
            <form id="passwordForm" class="form-card">
                <div class="form-group">
                    <label>原密码</label>
                    <input type="password" id="oldPassword" placeholder="请输入原密码" required />
                </div>
                <div class="form-group">
                    <label>新密码</label>
                    <input type="password" id="newPassword" placeholder="请输入新密码" required />
                </div>
                <div class="form-group">
                    <label>确认新密码</label>
                    <input type="password" id="confirmPassword" placeholder="请确认新密码" required />
                </div>
                <button type="submit" class="btn btn-primary btn-block">修改密码</button>
            </form>
        `;
    },

    async loadTabData() {
        if (this.activeTab === 'info') {
            this.bindInfoForm();
        } else if (this.activeTab === 'stats') {
            await this.loadStats();
        } else if (this.activeTab === 'history') {
            await this.loadHistory();
        } else if (this.activeTab === 'password') {
            this.bindPasswordForm();
        }
    },

    bindInfoForm() {
        const form = document.getElementById('profileForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nickname = document.getElementById('nickname').value;
            const avatar = document.getElementById('avatar').value;

            const result = await AuthService.updateProfile({ nickname, avatar });
            if (result.code === 0) {
                Toast.success('修改成功');
                const user = AuthService.getUser();
                if (user) {
                    user.nickname = nickname || user.nickname;
                    user.avatar = avatar || user.avatar;
                    Storage.setUser(user);
                }
                this.user = AuthService.getUser();
            } else {
                Toast.error(result.msg || '修改失败');
            }
        });
    },

    bindPasswordForm() {
        const form = document.getElementById('passwordForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const oldPassword = document.getElementById('oldPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword !== confirmPassword) {
                Toast.error('两次输入的新密码不一致');
                return;
            }

            const result = await AuthService.changePassword(oldPassword, newPassword);
            if (result.code === 0) {
                Toast.success('密码修改成功，请重新登录');
                await AuthService.logout();
                setTimeout(() => {
                    window.location.hash = '#/login';
                }, 1500);
            } else {
                Toast.error(result.msg || '修改失败');
            }
        });
    },

    async loadStats() {
        const result = await Api.get('/game/stats/get');
        const content = document.getElementById('tabContent');

        if (result.code === 0 && result.data) {
            this.stats = result.data;
            const s = result.data;
            const winRate = s.total_games > 0 ? Math.round((s.wins / s.total_games) * 100) : 0;
            const landlordWinRate = s.landlord_games > 0 ? Math.round((s.landlord_wins / s.landlord_games) * 100) : 0;
            const farmerWinRate = s.farmer_games > 0 ? Math.round((s.farmer_wins / s.farmer_games) * 100) : 0;

            content.innerHTML = `
                <div class="stats-grid">
                    <div class="stats-card">
                        <div class="stats-value">${s.total_games || 0}</div>
                        <div class="stats-label">总对局</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-value">${s.wins || 0}</div>
                        <div class="stats-label">胜利</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-value">${s.losses || 0}</div>
                        <div class="stats-label">失败</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-value">${winRate}%</div>
                        <div class="stats-label">胜率</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-value">${s.landlord_games || 0}</div>
                        <div class="stats-label">地主局</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-value">${landlordWinRate}%</div>
                        <div class="stats-label">地主胜率</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-value">${s.farmer_games || 0}</div>
                        <div class="stats-label">农民局</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-value">${farmerWinRate}%</div>
                        <div class="stats-label">农民胜率</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-value">${s.max_win_streak || 0}</div>
                        <div class="stats-label">最高连胜</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-value">${s.bomb_count || 0}</div>
                        <div class="stats-label">炸弹数</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-value">${s.spring_count || 0}</div>
                        <div class="stats-label">春天数</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-value">${s.total_score || 0}</div>
                        <div class="stats-label">累计得分</div>
                    </div>
                </div>
            `;
        } else {
            content.innerHTML = '<div class="empty">暂无数据</div>';
        }
    },

    async loadHistory() {
        const result = await Api.get('/game/history/get', { page_size: 20 });
        const content = document.getElementById('tabContent');

        if (result.code === 0 && result.data && result.data.items) {
            this.history = result.data;
            const items = result.data.items;

            if (items.length === 0) {
                content.innerHTML = '<div class="empty">暂无对战记录</div>';
                return;
            }

            content.innerHTML = `
                <div class="history-list">
                    ${items.map(item => {
                        const isWin = item.result === 1;
                        const isLandlord = item.is_landlord === 1;
                        const difficultyMap = { 0: '简单', 1: '普通', 2: '困难' };

                        return `
                            <div class="history-item">
                                <div class="history-result ${isWin ? 'result-win' : 'result-lose'}">
                                    ${isWin ? '胜' : '负'}
                                </div>
                                <div class="history-info">
                                    <div class="history-main">
                                        <span>${isLandlord ? '👑 地主' : '👨‍🌾 农民'}</span>
                                        <span class="history-difficulty">${difficultyMap[item.ai_difficulty] || '普通'}</span>
                                    </div>
                                    <div class="history-sub">
                                        <span>得分: ${item.score || 0}</span>
                                        <span class="${item.coins_change >= 0 ? 'text-green' : 'text-red'}">
                                            金币: ${item.coins_change >= 0 ? '+' : ''}${item.coins_change || 0}
                                        </span>
                                    </div>
                                    <div class="history-time">
                                        ${new Date(item.created_at).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } else {
            content.innerHTML = '<div class="empty">暂无数据</div>';
        }
    }
};
