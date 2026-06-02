const AchievementsPage = {
    allAchievements: [],
    userAchievements: [],
    unlockedIds: [],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="hp-achievements-page">
                <header class="hp-page-header">
                    <button class="hp-header-back" id="hpAchievementsBack">‹</button>
                    <h1 class="hp-header-title">成就</h1>
                </header>

                <div class="hp-ach-progress" id="hpAchProgress">
                    <div class="hp-ach-progress-bar">
                        <div class="hp-ach-progress-fill" id="hpAchProgressFill" style="width:0%"></div>
                    </div>
                    <div class="hp-ach-progress-text" id="hpAchProgressText">0 / 0 已解锁</div>
                </div>

                <div class="hp-ach-grid" id="hpAchGrid">
                    <div class="hp-loading-text">加载中...</div>
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
                    <div class="hp-tabbar-item active" data-tab="achievements">
                        <span class="hp-tabbar-icon">🎖</span>
                        <span class="hp-tabbar-text">成就</span>
                    </div>
                    <div class="hp-tabbar-item" data-tab="profile">
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
        document.getElementById('hpAchievementsBack').addEventListener('click', () => {
            Router.navigate('home');
        });

        document.querySelectorAll('.hp-tabbar-item').forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                const routes = { home: 'home', leaderboard: 'leaderboard', achievements: 'achievements', profile: 'profile' };
                Router.navigate(routes[tab] || 'home');
            });
        });
    },

    async loadData() {
        try {
            const [allResult, userResult] = await Promise.all([
                ApiService.get('/heping/achievement/list/get'),
                ApiService.get('/heping/achievement/user/list/get')
            ]);

            if (allResult.code === 0) {
                const allData = allResult.data;
                if (Array.isArray(allData)) {
                    this.allAchievements = allData;
                } else {
                    this.allAchievements = allData.items || allData.list || [];
                }
            }
            if (userResult.code === 0) {
                const userData = userResult.data;
                let userAchList;
                if (Array.isArray(userData)) {
                    userAchList = userData;
                } else {
                    userAchList = userData.items || userData.achievements || userData.list || [];
                }
                this.userAchievements = userAchList;
                this.unlockedIds = this.userAchievements.map(a => a.achievement_id || a.id).filter(Boolean);
            }
        } catch (e) {
            console.error(e);
        }

        this.renderAchievements();
    },

    renderAchievements() {
        const grid = document.getElementById('hpAchGrid');
        const total = this.allAchievements.length;
        const unlocked = this.allAchievements.filter(a => this.unlockedIds.includes(a.id)).length;

        const progressFill = document.getElementById('hpAchProgressFill');
        const progressText = document.getElementById('hpAchProgressText');

        if (total > 0) {
            const percent = Math.round((unlocked / total) * 100);
            if (progressFill) progressFill.style.width = percent + '%';
            if (progressText) progressText.textContent = unlocked + ' / ' + total + ' 已解锁';
        }

        if (!this.allAchievements.length) {
            grid.innerHTML = '<div class="hp-empty-text">暂无成就</div>';
            return;
        }

        grid.innerHTML = this.allAchievements.map(ach => {
            const isUnlocked = this.unlockedIds.includes(ach.id);
            const rarityColor = Utils.rarityColor(ach.rarity);
            const rarityText = Utils.rarityText(ach.rarity);
            const icon = ach.icon || this.getDefaultIcon(ach.condition_type);

            return `
                <div class="hp-ach-card ${isUnlocked ? 'hp-ach-unlocked' : 'hp-ach-locked'}">
                    <div class="hp-ach-icon" style="background:${isUnlocked ? rarityColor : '#333'}">
                        ${icon}
                    </div>
                    <div class="hp-ach-info">
                        <div class="hp-ach-name">${ach.name}</div>
                        <div class="hp-ach-desc">${ach.description}</div>
                        <div class="hp-ach-meta">
                            <span class="hp-ach-rarity" style="color:${rarityColor}">${rarityText}</span>
                            ${ach.reward_exp ? '<span class="hp-ach-reward">+' + ach.reward_exp + 'EXP</span>' : ''}
                        </div>
                    </div>
                    <div class="hp-ach-status">
                        ${isUnlocked ? '<span class="hp-ach-check">✓</span>' : '<span class="hp-ach-lock">🔒</span>'}
                    </div>
                </div>
            `;
        }).join('');
    },

    getDefaultIcon(conditionType) {
        const icons = {
            kills: '⚔',
            wins: '🏆',
            games: '🎮',
            survive_time: '⏱'
        };
        return icons[conditionType] || '🎖';
    }
};
