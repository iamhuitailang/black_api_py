const ProfilePage = {
    user: null,
    battleStats: null,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <h1 class="header-title">个人中心</h1>
                </header>

                <div class="profile-header">
                    <div class="profile-avatar">⚔️</div>
                    <div class="profile-name" id="profileName">加载中...</div>
                    <div class="profile-level" id="profileLevel">等级 1</div>
                </div>

                <div class="profile-stats">
                    <div class="profile-stat">
                        <div class="profile-stat-value" id="statGold">0</div>
                        <div class="profile-stat-label">💰 金币</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value" id="statLevel">1</div>
                        <div class="profile-stat-label">📊 等级</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value" id="statExp">0</div>
                        <div class="profile-stat-label">⭐ 经验</div>
                    </div>
                </div>

                <div class="section-title">战绩统计</div>

                <div class="card" id="battleStatsCard">
                    <div class="empty-state" style="padding: 30px;">
                        <div class="empty-state-text">加载中...</div>
                    </div>
                </div>

                <div class="section-title">功能入口</div>

                <div class="list">
                    <div class="list-item" onclick="Router.navigate('inventory')">
                        <div class="list-item-icon" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:24px;">📦</div>
                        <div class="list-item-content">
                            <div class="list-item-title">背包</div>
                            <div class="list-item-desc">查看和装备物品</div>
                        </div>
                        <div class="list-item-arrow">›</div>
                    </div>
                    <div class="list-item" onclick="Router.navigate('rank')">
                        <div class="list-item-icon" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:24px;">🏆</div>
                        <div class="list-item-content">
                            <div class="list-item-title">排行榜</div>
                            <div class="list-item-desc">查看全服排名</div>
                        </div>
                        <div class="list-item-arrow">›</div>
                    </div>
                    <div class="list-item" onclick="ProfilePage.handleLogout()">
                        <div class="list-item-icon" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:24px;">🚪</div>
                        <div class="list-item-content">
                            <div class="list-item-title" style="color: var(--danger-color);">退出登录</div>
                            <div class="list-item-desc">退出当前账号</div>
                        </div>
                        <div class="list-item-arrow">›</div>
                    </div>
                </div>

                <div class="divider"></div>

                <div style="text-align: center; padding: 20px; color: var(--text-light); font-size: 12px;">
                    遗迹守卫 v1.0.0<br>
                    选择英雄，击败敌人，收集装备
                </div>

                ${Tabbar.render('profile')}
            </div>
        `;

        await this.loadUserData();
    },

    async loadUserData() {
        try {
            const userInfo = await DotaApi.getUserInfo();
            if (userInfo.code === 0) {
                this.user = userInfo.data.user;
                this.updateUserDisplay();
            }

            const statsResult = await DotaApi.getBattleStats();
            if (statsResult.code === 0) {
                this.battleStats = statsResult.data;
                this.renderBattleStats();
            }
        } catch (e) {
            console.error('Load user data error:', e);
        }
    },

    updateUserDisplay() {
        if (!this.user) return;

        const nameEl = document.getElementById('profileName');
        const levelEl = document.getElementById('profileLevel');
        const statGold = document.getElementById('statGold');
        const statLevel = document.getElementById('statLevel');
        const statExp = document.getElementById('statExp');

        if (nameEl) nameEl.textContent = this.user.nickname || this.user.username;
        if (levelEl) levelEl.textContent = `等级 ${this.user.level}`;
        if (statGold) statGold.textContent = Utils.formatNumber(this.user.gold);
        if (statLevel) statLevel.textContent = this.user.level;
        if (statExp) statExp.textContent = Utils.formatNumber(this.user.exp);
    },

    renderBattleStats() {
        const card = document.getElementById('battleStatsCard');
        if (!card) return;

        const stats = this.battleStats || {};
        const total = stats.total_battles || 0;
        const wins = stats.total_wins || 0;
        const losses = stats.total_losses || 0;
        const winRate = total > 0 ? (stats.win_rate || 0) * 100 : 0;

        card.innerHTML = `
            <div class="card-body">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; text-align: center;">
                    <div>
                        <div style="font-size: 20px; font-weight: 600; color: var(--primary-color);">${total}</div>
                        <div style="font-size: 11px; color: var(--text-secondary);">总场次</div>
                    </div>
                    <div>
                        <div style="font-size: 20px; font-weight: 600; color: var(--success-color);">${wins}</div>
                        <div style="font-size: 11px; color: var(--text-secondary);">胜利</div>
                    </div>
                    <div>
                        <div style="font-size: 20px; font-weight: 600; color: var(--danger-color);">${losses}</div>
                        <div style="font-size: 11px; color: var(--text-secondary);">失败</div>
                    </div>
                    <div>
                        <div style="font-size: 20px; font-weight: 600; color: var(--warning-color);">${winRate.toFixed(1)}%</div>
                        <div style="font-size: 11px; color: var(--text-secondary);">胜率</div>
                    </div>
                </div>
            </div>
        `;
    },

    async handleLogout() {
        const confirmed = confirm('确定要退出登录吗？');
        if (!confirmed) return;

        Utils.showLoading();

        try {
            await AuthService.logout();
            Toast.success('已退出登录');
            Router.navigate('login');
        } catch (e) {
            console.error('Logout error:', e);
        } finally {
            Utils.hideLoading();
        }
    }
};
