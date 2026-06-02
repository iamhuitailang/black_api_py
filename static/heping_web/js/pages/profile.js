const ProfilePage = {
    userStats: null,
    recentRecords: [],
    showPasswordForm: false,

    async render() {
        const app = document.getElementById('app');
        const user = AuthService.getCurrentUser() || {};
        const initial = (user.nickname || 'U').charAt(0).toUpperCase();
        const level = user.level || 1;
        const exp = user.exp || 0;
        const expNeeded = level * 100;
        const expPercent = Math.min(100, Math.round((exp / expNeeded) * 100));

        app.innerHTML = `
            <div class="hp-profile-page">
                <header class="hp-page-header">
                    <button class="hp-header-back" id="hpProfileBack">‹</button>
                    <h1 class="hp-header-title">个人中心</h1>
                </header>

                <div class="hp-profile-header">
                    <div class="hp-profile-avatar">${initial}</div>
                    <div class="hp-profile-user-info">
                        <div class="hp-profile-nickname" id="hpProfileNickname">${user.nickname || '战士'}</div>
                        <div class="hp-profile-level">Lv.${level}</div>
                        <div class="hp-profile-exp-bar">
                            <div class="hp-profile-exp-fill" style="width:${expPercent}%"></div>
                        </div>
                        <div class="hp-profile-exp-text">EXP ${exp}/${expNeeded}</div>
                    </div>
                </div>

                <div class="hp-profile-section">
                    <div class="hp-section-title">战斗数据</div>
                    <div class="hp-stats-grid" id="hpStatsGrid">
                        <div class="hp-stat-item">
                            <div class="hp-stat-value" id="hpStatKills">-</div>
                            <div class="hp-stat-label">击杀</div>
                        </div>
                        <div class="hp-stat-item">
                            <div class="hp-stat-value" id="hpStatDeaths">-</div>
                            <div class="hp-stat-label">死亡</div>
                        </div>
                        <div class="hp-stat-item">
                            <div class="hp-stat-value" id="hpStatKD">-</div>
                            <div class="hp-stat-label">K/D</div>
                        </div>
                        <div class="hp-stat-item">
                            <div class="hp-stat-value" id="hpStatWins">-</div>
                            <div class="hp-stat-label">胜场</div>
                        </div>
                        <div class="hp-stat-item">
                            <div class="hp-stat-value" id="hpStatWinRate">-</div>
                            <div class="hp-stat-label">胜率</div>
                        </div>
                        <div class="hp-stat-item">
                            <div class="hp-stat-value" id="hpStatGames">-</div>
                            <div class="hp-stat-label">总场次</div>
                        </div>
                    </div>
                </div>

                <div class="hp-profile-section">
                    <div class="hp-section-title">最近战绩</div>
                    <div class="hp-recent-records" id="hpProfileRecords">
                        <div class="hp-loading-text">加载中...</div>
                    </div>
                </div>

                <div class="hp-profile-section">
                    <div class="hp-section-title">设置</div>
                    <div class="hp-settings-list">
                        <div class="hp-setting-item" id="hpChangeNickname">
                            <span class="hp-setting-label">修改昵称</span>
                            <span class="hp-setting-arrow">›</span>
                        </div>
                        <div class="hp-setting-item" id="hpChangePassword">
                            <span class="hp-setting-label">修改密码</span>
                            <span class="hp-setting-arrow">›</span>
                        </div>
                    </div>
                </div>

                <div class="hp-profile-section">
                    <button class="hp-btn hp-btn-danger hp-btn-block" id="hpLogoutBtn">退出登录</button>
                </div>

                <div class="hp-profile-modal" id="hpNicknameModal" style="display:none;">
                    <div class="hp-modal-content">
                        <div class="hp-modal-title">修改昵称</div>
                        <input type="text" class="hp-form-control" id="hpNewNickname" placeholder="输入新昵称" maxlength="20">
                        <div class="hp-modal-actions">
                            <button class="hp-btn hp-btn-secondary" id="hpNicknameCancel">取消</button>
                            <button class="hp-btn hp-btn-primary" id="hpNicknameConfirm">确认</button>
                        </div>
                    </div>
                </div>

                <div class="hp-profile-modal" id="hpPasswordModal" style="display:none;">
                    <div class="hp-modal-content">
                        <div class="hp-modal-title">修改密码</div>
                        <input type="password" class="hp-form-control" id="hpOldPassword" placeholder="原密码">
                        <input type="password" class="hp-form-control" id="hpNewPassword" placeholder="新密码（至少6位）" style="margin-top:10px;">
                        <input type="password" class="hp-form-control" id="hpConfirmNewPassword" placeholder="确认新密码" style="margin-top:10px;">
                        <div class="hp-modal-actions">
                            <button class="hp-btn hp-btn-secondary" id="hpPasswordCancel">取消</button>
                            <button class="hp-btn hp-btn-primary" id="hpPasswordConfirm">确认</button>
                        </div>
                    </div>
                </div>

                <nav class="hp-tabbar">
                    <div class="hp-tabbar-item" data-tab="home">
                        <span class="hp-tabbar-icon">🏠</span>
                        <span class="hp-tabbar-text">首页</span>
                    </div>
                    <div class="hp-tabbar-item" data-tab="leaderboard">
                        <span class="hp-tabbar-icon">🏆</span>
                        <span class="hp-tabbar-text">排行榜</span>
                    </div>
                    <div class="hp-tabbar-item" data-tab="achievements">
                        <span class="hp-tabbar-icon">🎖</span>
                        <span class="hp-tabbar-text">成就</span>
                    </div>
                    <div class="hp-tabbar-item active" data-tab="profile">
                        <span class="hp-tabbar-icon">👤</span>
                        <span class="hp-tabbar-text">我的</span>
                    </div>
                </nav>
            </div>
        `;

        this.bindEvents();
        await this.loadData();
    },

    bindEvents() {
        document.getElementById('hpProfileBack').addEventListener('click', () => {
            Router.navigate('home');
        });

        document.querySelectorAll('.hp-tabbar-item').forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                const routes = { home: 'home', leaderboard: 'leaderboard', achievements: 'achievements', profile: 'profile' };
                Router.navigate(routes[tab] || 'home');
            });
        });

        document.getElementById('hpLogoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        document.getElementById('hpChangeNickname').addEventListener('click', () => {
            document.getElementById('hpNicknameModal').style.display = 'flex';
        });

        document.getElementById('hpNicknameCancel').addEventListener('click', () => {
            document.getElementById('hpNicknameModal').style.display = 'none';
        });

        document.getElementById('hpNicknameConfirm').addEventListener('click', () => {
            this.handleChangeNickname();
        });

        document.getElementById('hpChangePassword').addEventListener('click', () => {
            document.getElementById('hpPasswordModal').style.display = 'flex';
        });

        document.getElementById('hpPasswordCancel').addEventListener('click', () => {
            document.getElementById('hpPasswordModal').style.display = 'none';
        });

        document.getElementById('hpPasswordConfirm').addEventListener('click', () => {
            this.handleChangePassword();
        });
    },

    async loadData() {
        await Promise.all([
            this.loadUserInfo(),
            this.loadUserStats(),
            this.loadRecentRecords()
        ]);
    },

    async loadUserInfo() {
        try {
            const result = await AuthService.getCurrentUserInfo();
            if (result.code === 0 && result.data) {
                const user = result.data;
                const avatarEl = document.querySelector('.hp-profile-avatar');
                const nicknameEl = document.getElementById('hpProfileNickname');
                const levelEl = document.querySelector('.hp-profile-level');
                const expFill = document.querySelector('.hp-profile-exp-fill');
                const expText = document.querySelector('.hp-profile-exp-text');

                if (avatarEl) avatarEl.textContent = (user.nickname || 'U').charAt(0).toUpperCase();
                if (nicknameEl) nicknameEl.textContent = user.nickname || '战士';
                if (levelEl) levelEl.textContent = 'Lv.' + (user.level || 1);
                const level = user.level || 1;
                const exp = user.exp || 0;
                const needed = level * 100;
                const pct = Math.min(100, Math.round((exp / needed) * 100));
                if (expFill) expFill.style.width = pct + '%';
                if (expText) expText.textContent = 'EXP ' + exp + '/' + needed;
            }
        } catch (e) {
            console.error(e);
        }
    },

    async loadUserStats() {
        try {
            const result = await ApiService.get('/heping/game/user/stats/get');
            if (result.code === 0 && result.data) {
                this.userStats = result.data;
                this.renderStats();
            }
        } catch (e) {
            console.error(e);
        }
    },

    renderStats() {
        if (!this.userStats) return;
        const s = this.userStats;
        const stats = s.game_stats || s;
        const user = stats.user || s.user || {};
        const kills = stats.total_kills || user.kills || 0;
        const deaths = stats.total_deaths || user.deaths || 0;
        const wins = stats.total_wins || user.wins || 0;
        const games = stats.total_games || user.games_played || 0;
        const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();
        const winRate = games > 0 ? (wins / games * 100).toFixed(1) + '%' : '0%';

        const el = (id, val) => {
            const e = document.getElementById(id);
            if (e) e.textContent = val;
        };
        el('hpStatKills', kills);
        el('hpStatDeaths', deaths);
        el('hpStatKD', kd);
        el('hpStatWins', wins);
        el('hpStatWinRate', winRate);
        el('hpStatGames', games);
    },

    async loadRecentRecords() {
        try {
            const result = await ApiService.get('/heping/game/record/list/get', { page: 1, page_size: 5 });
            if (result.code === 0) {
                this.recentRecords = result.data.items || [];
                this.renderRecords();
            }
        } catch (e) {
            console.error(e);
        }
    },

    renderRecords() {
        const container = document.getElementById('hpProfileRecords');
        if (!this.recentRecords.length) {
            container.innerHTML = '<div class="hp-empty-text">暂无战绩</div>';
            return;
        }

        container.innerHTML = this.recentRecords.map(r => {
            const surviveMin = Math.floor((r.survive_time || 0) / 60);
            const surviveSec = (r.survive_time || 0) % 60;
            return `
                <div class="hp-record-item">
                    <div class="hp-record-rank ${r.is_win ? 'hp-rank-win' : ''}">#${r.rank}</div>
                    <div class="hp-record-info">
                        <div class="hp-record-kills">击杀 ${r.kills} · 伤害 ${Math.round(r.damage_dealt || 0)}</div>
                        <div class="hp-record-time">存活 ${surviveMin}:${surviveSec.toString().padStart(2, '0')} · ${Utils.formatTime(r.created_at)}</div>
                    </div>
                    <div class="hp-record-result ${r.is_win ? 'hp-result-win' : ''}">${r.is_win ? '吃鸡' : '淘汰'}</div>
                </div>
            `;
        }).join('');
    },

    async handleChangeNickname() {
        const newNickname = document.getElementById('hpNewNickname').value.trim();
        if (!newNickname) {
            Utils.showToast('请输入新昵称');
            return;
        }

        try {
            const result = await AuthService.updateProfile({ nickname: newNickname });
            if (result.code === 0) {
                Utils.showToast('昵称修改成功');
                document.getElementById('hpNicknameModal').style.display = 'none';
                this.loadUserInfo();
            } else {
                Utils.showToast(result.msg || '修改失败');
            }
        } catch (e) {
            Utils.showToast('修改失败');
        }
    },

    async handleChangePassword() {
        const oldPwd = document.getElementById('hpOldPassword').value;
        const newPwd = document.getElementById('hpNewPassword').value;
        const confirmPwd = document.getElementById('hpConfirmNewPassword').value;

        if (!oldPwd) {
            Utils.showToast('请输入原密码');
            return;
        }
        if (!newPwd) {
            Utils.showToast('请输入新密码');
            return;
        }
        if (newPwd.length < 6) {
            Utils.showToast('新密码至少6位');
            return;
        }
        if (oldPwd === newPwd) {
            Utils.showToast('新密码不能与原密码相同');
            return;
        }
        if (newPwd !== confirmPwd) {
            Utils.showToast('两次密码输入不一致');
            return;
        }

        try {
            const result = await AuthService.changePassword(oldPwd, newPwd);
            if (result.code === 0) {
                Utils.showToast('密码修改成功，请重新登录');
                document.getElementById('hpPasswordModal').style.display = 'none';
                await AuthService.logout();
                Router.navigate('login');
            } else {
                Utils.showToast(result.msg || '修改失败');
            }
        } catch (e) {
            Utils.showToast('修改失败');
        }
    },

    async handleLogout() {
        try {
            await AuthService.logout();
            Utils.showToast('已退出登录');
            Router.navigate('login');
        } catch (e) {
            Utils.showToast('退出失败');
        }
    }
};
