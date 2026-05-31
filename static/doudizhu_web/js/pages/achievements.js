const AchievementsPage = {
    data: null,
    userAchievements: null,

    render() {
        if (!AuthService.requireAuth()) return;

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page-container">
                <header class="page-header">
                    <button class="btn btn-outline btn-small" onclick="window.location.hash='#/home'">← 返回</button>
                    <h2>🎖️ 成就系统</h2>
                    <div></div>
                </header>

                <div class="achievements-stats" id="achievementsStats">
                </div>

                <div class="achievements-list" id="achievementsList">
                    <div class="loading">加载中...</div>
                </div>
            </div>
        `;

        this.loadData();
    },

    async loadData() {
        const [listResult, userResult] = await Promise.all([
            Api.get('/achievement/list/get', { page_size: 100 }),
            Api.get('/achievement/user/get')
        ]);

        if (listResult.code === 0) {
            this.data = listResult.data;
        }
        if (userResult.code === 0) {
            this.userAchievements = userResult.data;
        }

        this.renderStats();
        this.renderList();
    },

    renderStats() {
        const total = this.data && this.data.items ? this.data.items.length : 0;
        const unlocked = this.userAchievements ? this.userAchievements.length : 0;
        const percent = total > 0 ? Math.round((unlocked / total) * 100) : 0;

        const statsDiv = document.getElementById('achievementsStats');
        statsDiv.innerHTML = `
            <div class="stats-card">
                <div class="stats-item">
                    <div class="stats-value">${unlocked}</div>
                    <div class="stats-label">已解锁</div>
                </div>
                <div class="stats-item">
                    <div class="stats-value">${total}</div>
                    <div class="stats-label">全部成就</div>
                </div>
                <div class="stats-item">
                    <div class="stats-value">${percent}%</div>
                    <div class="stats-label">完成度</div>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percent}%"></div>
            </div>
        `;
    },

    renderList() {
        const list = document.getElementById('achievementsList');
        const items = this.data && this.data.items ? this.data.items : [];

        if (items.length === 0) {
            list.innerHTML = '<div class="empty">暂无成就</div>';
            return;
        }

        const unlockedIds = this.userAchievements ? this.userAchievements.map(a => a.achievement_id) : [];

        const typeMap = { 0: '胜场', 1: '等级', 2: '金币', 3: '特殊' };

        list.innerHTML = items.map(item => {
            const isUnlocked = unlockedIds.includes(item.id);
            const userAchievement = this.userAchievements ? this.userAchievements.find(a => a.achievement_id === item.id) : null;

            return `
                <div class="achievement-item ${isUnlocked ? 'achievement-unlocked' : 'achievement-locked'}">
                    <div class="achievement-icon">
                        ${isUnlocked ? '🏆' : '🔒'}
                    </div>
                    <div class="achievement-info">
                        <div class="achievement-name">
                            ${item.name}
                            <span class="achievement-type">${typeMap[item.type] || '未知'}</span>
                        </div>
                        <div class="achievement-desc">${item.description}</div>
                        <div class="achievement-reward">
                            <span>💰 ${item.reward_coins}金币</span>
                            <span>⭐ ${item.reward_exp}经验</span>
                        </div>
                        ${userAchievement ? `
                            <div class="achievement-unlock-time">
                                解锁时间: ${new Date(userAchievement.unlocked_at).toLocaleString()}
                            </div>
                        ` : ''}
                    </div>
                    ${!isUnlocked ? `
                        <div class="achievement-condition">
                            条件: ${item.condition_value}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }
};
