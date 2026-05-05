const HomePage = {
    userStats: null,
    dailyStats: null,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <div class="header">
                    <div class="header-title">🏃 跃动人生</div>
                </div>

                <div class="home-stats">
                    <div class="home-stats-title">累计数据</div>
                    <div class="home-stats-grid">
                        <div class="home-stat-item">
                            <div class="home-stat-value" id="stat-total-count">--</div>
                            <div class="home-stat-label">跳绳总数</div>
                        </div>
                        <div class="home-stat-item">
                            <div class="home-stat-value" id="stat-total-duration">--</div>
                            <div class="home-stat-label">累计时长</div>
                        </div>
                        <div class="home-stat-item">
                            <div class="home-stat-value" id="stat-total-calories">--</div>
                            <div class="home-stat-label">消耗卡路里</div>
                        </div>
                        <div class="home-stat-item">
                            <div class="home-stat-value" id="stat-streak-days">--</div>
                            <div class="home-stat-label">连续打卡</div>
                        </div>
                    </div>
                </div>

                <div class="today-progress" id="today-progress">
                    <div class="today-progress-header">
                        <div class="today-progress-title">今日目标</div>
                        <div class="today-progress-goal" id="today-goal-text">目标: -- 个</div>
                    </div>
                    <div class="today-progress-bar">
                        <div class="today-progress-fill" id="today-progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="today-progress-text">
                        <span id="today-completed">已完成: 0 个</span>
                        <span id="today-remaining">还需: -- 个</span>
                    </div>
                </div>

                <div class="home-actions">
                    <div class="home-action-item" data-action="quick">
                        <div class="home-action-icon">➕</div>
                        <div class="home-action-text">快速记录</div>
                    </div>
                    <div class="home-action-item" data-action="timer">
                        <div class="home-action-icon blue">⏱️</div>
                        <div class="home-action-text">计时模式</div>
                    </div>
                    <div class="home-action-item" data-action="count">
                        <div class="home-action-icon green">🔢</div>
                        <div class="home-action-text">计数模式</div>
                    </div>
                    <div class="home-action-item" data-action="stats">
                        <div class="home-action-icon orange">📊</div>
                        <div class="home-action-text">数据统计</div>
                    </div>
                </div>

                <div class="section-title">快捷入口</div>
                <div class="list">
                    <div class="list-item" data-action="goal">
                        <div class="list-item-content">
                            <div class="list-item-title">🎯 目标设置</div>
                            <div class="list-item-desc">设置每日跳绳目标</div>
                        </div>
                        <div class="list-item-arrow">›</div>
                    </div>
                    <div class="list-item" data-action="social">
                        <div class="list-item-content">
                            <div class="list-item-title">👥 好友排行</div>
                            <div class="list-item-desc">查看好友跳绳排行榜</div>
                        </div>
                        <div class="list-item-arrow">›</div>
                    </div>
                    <div class="list-item" data-action="achievements">
                        <div class="list-item-content">
                            <div class="list-item-title">🏅 成就徽章</div>
                            <div class="list-item-desc">查看已解锁的成就</div>
                        </div>
                        <div class="list-item-arrow">›</div>
                    </div>
                </div>

                <div class="tabbar">
                    <div class="tabbar-item active" data-tab="home">
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
                    <div class="tabbar-item" data-tab="social">
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

    bindEvents() {
        document.querySelectorAll('.home-action-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                if (action === 'quick') {
                    Router.navigate('record', { mode: 'quick' });
                } else if (action === 'timer') {
                    Router.navigate('record', { mode: 'timer' });
                } else if (action === 'count') {
                    Router.navigate('record', { mode: 'count' });
                } else if (action === 'stats') {
                    Router.navigate('stats');
                }
            });
        });

        document.querySelectorAll('.list-item[data-action]').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                Router.navigate(action);
            });
        });

        document.querySelectorAll('.tabbar-item').forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                Router.navigate(tab);
            });
        });
    },

    async loadData() {
        try {
            const userResult = await AuthService.getUserStats();
            if (userResult.code === 0) {
                this.userStats = userResult.data;
                this.updateUserStats();
            }

            const dailyResult = await ApiService.get('/ts/record/daily/get');
            if (dailyResult.code === 0) {
                this.dailyStats = dailyResult.data;
                this.updateDailyStats();
            }
        } catch (e) {
            console.error('Load data error:', e);
        }
    },

    updateUserStats() {
        const user = this.userStats?.user || {};
        document.getElementById('stat-total-count').textContent = Utils.formatNumber(user.total_count || 0);
        document.getElementById('stat-total-duration').textContent = Utils.formatDuration(user.total_duration || 0);
        document.getElementById('stat-total-calories').textContent = Utils.formatCalories(user.total_calories || 0);
        document.getElementById('stat-streak-days').textContent = (user.streak_days || 0) + '天';
    },

    updateDailyStats() {
        const user = AuthService.getCurrentUser() || {};
        const dailyGoal = user.daily_goal || Storage.getDailyGoal();
        const stats = this.dailyStats?.stats || {};
        const completed = stats.total_count || 0;
        const remaining = Math.max(0, dailyGoal - completed);
        const progress = dailyGoal > 0 ? Math.min(100, (completed / dailyGoal) * 100) : 0;

        document.getElementById('today-goal-text').textContent = `目标: ${Utils.formatNumber(dailyGoal)} 个`;
        document.getElementById('today-completed').textContent = `已完成: ${Utils.formatNumber(completed)} 个`;
        document.getElementById('today-remaining').textContent = `还需: ${Utils.formatNumber(remaining)} 个`;
        document.getElementById('today-progress-fill').style.width = `${progress}%`;
    }
};
