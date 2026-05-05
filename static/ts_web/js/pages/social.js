const SocialPage = {
    currentTab: 'ranking',
    rankingPeriod: 'week',
    rankingData: null,
    achievementsData: null,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <div class="header">
                    <div class="header-title">社交</div>
                    <button class="header-action" id="add-friend-btn">添加好友</button>
                </div>

                <div class="social-tabs">
                    <div class="social-tab ${this.currentTab === 'ranking' ? 'active' : ''}" data-tab="ranking">好友排行</div>
                    <div class="social-tab ${this.currentTab === 'achievements' ? 'active' : ''}" data-tab="achievements">成就徽章</div>
                </div>

                <div id="social-content">
                    ${this.currentTab === 'ranking' ? this.renderRankingContent() : this.renderAchievementsContent()}
                </div>

                <div class="tabbar">
                    <div class="tabbar-item" data-tab="home">
                        <div class="tabbar-icon">🏠</div>
                        <div class="tabbar-text">首页</div>
                    </div>
                    <div class="tabbar-item" data-tab="record">
                        <div class="tabbar-icon">➕</div>
                        <div class="tabbar-text">记录</div>
                    </div>
                    <div class="tabbar-item" data-tab="stats">
                        <div class="tabbar-icon">📊</div>
                        <div class="tabbar-text">统计</div>
                    </div>
                    <div class="tabbar-item active" data-tab="social">
                        <div class="tabbar-icon">👥</div>
                        <div class="tabbar-text">社交</div>
                    </div>
                    <div class="tabbar-item" data-tab="profile">
                        <div class="tabbar-icon">👤</div>
                        <div class="tabbar-text">我的</div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        await this.loadData();
    },

    renderRankingContent() {
        return `
            <div class="ranking-period">
                <button class="ranking-period-btn ${this.rankingPeriod === 'week' ? 'active' : ''}" data-period="week">周榜</button>
                <button class="ranking-period-btn ${this.rankingPeriod === 'month' ? 'active' : ''}" data-period="month">月榜</button>
            </div>

            <div class="ranking-list" id="ranking-list">
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <div class="empty-state-text">暂无好友数据</div>
                </div>
            </div>
        `;
    },

    renderAchievementsContent() {
        return `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">成就进度</div>
                </div>
                <div class="card-body">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 24px; font-weight: 700; color: var(--primary-color);" id="achievement-unlocked">0</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">已解锁</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 24px; font-weight: 700; color: var(--text-secondary);" id="achievement-total">0</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">总数</div>
                        </div>
                    </div>
                    <div class="today-progress-bar" style="height: 8px; margin-top: 16px;">
                        <div class="today-progress-fill" id="achievement-progress-bar" style="width: 0%"></div>
                    </div>
                </div>
            </div>

            <div class="section-title">所有成就</div>
            <div class="achievements-grid" id="achievements-grid">
                <div class="empty-state" style="grid-column: span 3;">
                    <div class="empty-state-icon">🏅</div>
                    <div class="empty-state-text">暂无成就数据</div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        document.querySelectorAll('.social-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentTab = tab.dataset.tab;
                document.querySelectorAll('.social-tab').forEach(t => {
                    t.classList.toggle('active', t.dataset.tab === this.currentTab);
                });
                const content = document.getElementById('social-content');
                if (content) {
                    content.innerHTML = this.currentTab === 'ranking' ? this.renderRankingContent() : this.renderAchievementsContent();
                    if (this.currentTab === 'ranking') {
                        this.bindRankingEvents();
                        this.renderRanking();
                    } else {
                        this.renderAchievements();
                    }
                }
            });
        });

        document.querySelectorAll('.tabbar-item').forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                Router.navigate(tab);
            });
        });

        const addFriendBtn = document.getElementById('add-friend-btn');
        if (addFriendBtn) {
            addFriendBtn.addEventListener('click', () => {
                Router.navigate('friends');
            });
        }

        this.bindRankingEvents();
    },

    bindRankingEvents() {
        document.querySelectorAll('.ranking-period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.rankingPeriod = btn.dataset.period;
                document.querySelectorAll('.ranking-period-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.period === this.rankingPeriod);
                });
                this.renderRanking();
            });
        });
    },

    async loadData() {
        await this.loadRanking();
        await this.loadAchievements();
    },

    async loadRanking() {
        try {
            const result = await ApiService.get('/ts/friend/ranking/get', {
                period: this.rankingPeriod
            });
            if (result.code === 0) {
                this.rankingData = result.data;
            }
        } catch (e) {
            console.error('Load ranking error:', e);
        }
        this.renderRanking();
    },

    async loadAchievements() {
        try {
            const result = await ApiService.get('/ts/achievement/progress/get');
            if (result.code === 0) {
                this.achievementsData = result.data;
            }
        } catch (e) {
            console.error('Load achievements error:', e);
        }
        this.renderAchievements();
    },

    renderRanking() {
        const container = document.getElementById('ranking-list');
        if (!container) return;

        if (!this.rankingData || this.rankingData.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <div class="empty-state-text">暂无好友数据</div>
                    <div style="font-size: 12px; margin-top: 8px; color: var(--text-secondary);">
                        点击右上角"添加好友"开始
                    </div>
                </div>
            `;
            return;
        }

        let html = '';
        this.rankingData.forEach((item, index) => {
            const rank = item.rank || (index + 1);
            const rankClass = rank === 1 ? 'top1' : rank === 2 ? 'top2' : rank === 3 ? 'top3' : 'normal';
            const isMe = item.is_me;

            html += `
                <div class="ranking-item ${isMe ? 'me' : ''}">
                    <div class="ranking-rank ${rankClass}">${rank}</div>
                    <div class="ranking-avatar">${item.avatar || '🏃'}</div>
                    <div class="ranking-info">
                        <div class="ranking-name">${item.nickname || '用户' + item.user_id}</div>
                        <div class="ranking-desc">${Utils.formatNumber(item.total_count || 0)} 个</div>
                    </div>
                    <div class="ranking-score">
                        <div class="ranking-score-value">${Utils.formatNumber(item.total_count || 0)}</div>
                        <div class="ranking-score-label">${Utils.formatCalories(item.total_calories || 0)}</div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    renderAchievements() {
        const container = document.getElementById('achievements-grid');
        const unlockedEl = document.getElementById('achievement-unlocked');
        const totalEl = document.getElementById('achievement-total');
        const progressBar = document.getElementById('achievement-progress-bar');

        if (!this.achievementsData || this.achievementsData.length === 0) {
            if (container) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: span 3;">
                        <div class="empty-state-icon">🏅</div>
                        <div class="empty-state-text">暂无成就数据</div>
                    </div>
                `;
            }
            return;
        }

        const unlocked = this.achievementsData.filter(a => a.is_unlocked).length;
        const total = this.achievementsData.length;
        const progress = total > 0 ? (unlocked / total) * 100 : 0;

        if (unlockedEl) unlockedEl.textContent = unlocked;
        if (totalEl) totalEl.textContent = total;
        if (progressBar) progressBar.style.width = `${progress}%`;

        if (container) {
            let html = '';
            this.achievementsData.forEach(item => {
                const isLocked = !item.is_unlocked;
                html += `
                    <div class="achievement-item ${isLocked ? 'locked' : ''}">
                        <div class="achievement-icon ${isLocked ? 'locked' : ''}">${item.badge_icon || '🏆'}</div>
                        <div class="achievement-name">${item.name}</div>
                        <div class="achievement-progress">${item.is_unlocked ? '已解锁' : `${item.current_value}/${item.condition_value}`}</div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }
    }
};
