const ProfilePage = {
    template: `
    <div class="page has-header">
        <div class="header">
            <span class="header-title">我的</span>
            <span></span>
        </div>

        <div class="profile-header">
            <div class="profile-avatar">{{ (user.nickname || user.username || '?')[0] }}</div>
            <div class="profile-info">
                <div class="profile-name">{{ user.nickname || user.username }}</div>
                <div class="profile-role">{{ user.role === 1 ? '管理员' : '玩家' }}</div>
            </div>
        </div>

        <div class="profile-stats" v-if="stats">
            <div class="stat-item">
                <div class="stat-value">{{ stats.completed_games || 0 }}</div>
                <div class="stat-label">通关数</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">{{ stats.avg_time ? stats.avg_time + 's' : '-' }}</div>
                <div class="stat-label">平均用时</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">{{ stats.total_games || 0 }}</div>
                <div class="stat-label">总游戏</div>
            </div>
        </div>

        <div class="list">
            <div class="list-item" @click="goAchievements">
                <div class="list-item-content">
                    <div class="list-item-title">🎖️ 我的成就</div>
                </div>
                <div class="list-item-arrow">→</div>
            </div>
            <div class="list-item" @click="goLeaderboard">
                <div class="list-item-content">
                    <div class="list-item-title">🏆 排行榜</div>
                </div>
                <div class="list-item-arrow">→</div>
            </div>
            <div class="list-item" @click="showChangePassword = true">
                <div class="list-item-content">
                    <div class="list-item-title">🔑 修改密码</div>
                </div>
                <div class="list-item-arrow">→</div>
            </div>
            <div class="list-item" v-if="user.role === 1" @click="goAdmin">
                <div class="list-item-content">
                    <div class="list-item-title">⚙️ 管理后台</div>
                </div>
                <div class="list-item-arrow">→</div>
            </div>
            <div class="list-item" @click="handleLogout" style="color: #ef4444;">
                <div class="list-item-content">
                    <div class="list-item-title">🚪 退出登录</div>
                </div>
            </div>
        </div>

        <div v-if="showChangePassword" class="modal-overlay" @click.self="showChangePassword = false">
            <div class="modal-content">
                <h3>修改密码</h3>
                <div class="form-group">
                    <label class="form-label">原密码</label>
                    <input type="password" class="form-control" v-model="pwdForm.oldPassword">
                </div>
                <div class="form-group">
                    <label class="form-label">新密码</label>
                    <input type="password" class="form-control" v-model="pwdForm.newPassword">
                </div>
                <div class="form-group">
                    <label class="form-label">确认新密码</label>
                    <input type="password" class="form-control" v-model="pwdForm.confirmPassword">
                </div>
                <div class="modal-actions">
                    <button class="btn btn-outline" @click="showChangePassword = false">取消</button>
                    <button class="btn btn-primary" @click="changePassword" :disabled="pwdLoading">
                        {{ pwdLoading ? '修改中...' : '确认' }}
                    </button>
                </div>
            </div>
        </div>

        <div class="tabbar">
            <div class="tabbar-item" @click="goHome"><div class="tabbar-icon">🏠</div><div class="tabbar-text">首页</div></div>
            <div class="tabbar-item" @click="goLeaderboard"><div class="tabbar-icon">🏆</div><div class="tabbar-text">排行</div></div>
            <div class="tabbar-item" @click="goAchievements"><div class="tabbar-icon">🎖️</div><div class="tabbar-text">成就</div></div>
            <div class="tabbar-item active" @click="goProfile"><div class="tabbar-icon">👤</div><div class="tabbar-text">我的</div></div>
        </div>
    </div>
    `,
    data() {
        return {
            user: ZbtAuth.getCurrentUser() || {},
            stats: null,
            showChangePassword: false,
            pwdForm: { oldPassword: '', newPassword: '', confirmPassword: '' },
            pwdLoading: false
        };
    },
    mounted() {
        this.loadStats();
        this.refreshUser();
    },
    methods: {
        async refreshUser() {
            try {
                const result = await ZbtAuth.getCurrentUserInfo();
                if (result.code === 0) {
                    this.user = result.data;
                }
            } catch (e) { console.error(e); }
        },
        async loadStats() {
            try {
                const result = await ZbtApi.get('/zbt/game/records/get');
                if (result.code === 0) {
                    const records = result.data || [];
                    const completed = records.filter(r => r.status === 1);
                    const avgTime = completed.length > 0
                        ? Math.round(completed.reduce((s, r) => s + (r.time_used || 0), 0) / completed.length)
                        : 0;
                    this.stats = {
                        completed_games: completed.length,
                        avg_time: avgTime,
                        total_games: records.length
                    };
                }
            } catch (e) { console.error(e); }
        },
        async changePassword() {
            if (!this.pwdForm.oldPassword) { this.showToast('请输入原密码'); return; }
            if (!this.pwdForm.newPassword) { this.showToast('请输入新密码'); return; }
            if (this.pwdForm.newPassword.length < 6) { this.showToast('新密码至少6位'); return; }
            if (this.pwdForm.oldPassword === this.pwdForm.newPassword) { this.showToast('新密码不能与原密码相同'); return; }
            if (this.pwdForm.newPassword !== this.pwdForm.confirmPassword) { this.showToast('两次密码不一致'); return; }

            this.pwdLoading = true;
            try {
                const result = await ZbtAuth.changePassword(this.pwdForm.oldPassword, this.pwdForm.newPassword);
                if (result.code === 0) {
                    this.showToast('密码修改成功，请重新登录', 'success');
                    this.showChangePassword = false;
                    await ZbtAuth.logout();
                    ZbtRouter.navigate('/login');
                } else {
                    this.showToast(result.msg || '修改失败');
                }
            } catch (e) {
                this.showToast('修改失败');
            } finally {
                this.pwdLoading = false;
            }
        },
        async handleLogout() {
            await ZbtAuth.logout();
            ZbtRouter.navigate('/login');
        },
        goHome() { ZbtRouter.navigate('/home'); },
        goLeaderboard() { ZbtRouter.navigate('/leaderboard'); },
        goAchievements() { ZbtRouter.navigate('/achievements'); },
        goProfile() { ZbtRouter.navigate('/profile'); },
        goAdmin() { ZbtRouter.navigate('/admin/dashboard'); },
        showToast(msg, type = 'error') {
            const existing = document.querySelector('.zbt-toast');
            if (existing) existing.remove();
            const el = document.createElement('div');
            el.className = 'zbt-toast';
            el.textContent = msg;
            el.style.background = type === 'success' ? '#10b981' : '#ef4444';
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 2000);
        }
    }
};
