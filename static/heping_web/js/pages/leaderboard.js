const LeaderboardPage = {
    currentTab: 'kills',
    page: 1,
    pageSize: 20,
    leaderboardData: [],

    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="hp-leaderboard-page">
                <header class="hp-page-header">
                    <button class="hp-header-back" id="hpLeaderboardBack">‹</button>
                    <h1 class="hp-header-title">排行榜</h1>
                </header>

                <div class="hp-leaderboard-tabs">
                    <div class="hp-lb-tab ${this.currentTab === 'kills' ? 'active' : ''}" data-tab="kills">击杀排行</div>
                    <div class="hp-lb-tab ${this.currentTab === 'wins' ? 'active' : ''}" data-tab="wins">胜场排行</div>
                    <div class="hp-lb-tab ${this.currentTab === 'level' ? 'active' : ''}" data-tab="level">等级排行</div>
                </div>

                <div class="hp-leaderboard-list" id="hpLeaderboardList">
                    <div class="hp-loading-text">加载中...</div>
                </div>

                <nav class="hp-tabbar">
                    <div class="hp-tabbar-item" data-tab="home">
                        <span class="hp-tabbar-icon">🏠</span>
                        <span class="hp-tabbar-text">首页</span>
                    </div>
                    <div class="hp-tabbar-item active" data-tab="leaderboard">
                        <span class="hp-tabbar-icon">🏆</span>
                        <span class="hp-tabbar-text">排行榜</span>
                    </div>
                    <div class="hp-tabbar-item" data-tab="achievements">
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
        this.loadData();
    },

    bindEvents() {
        document.getElementById('hpLeaderboardBack').addEventListener('click', () => {
            Router.navigate('home');
        });

        document.querySelectorAll('.hp-lb-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentTab = tab.dataset.tab;
                this.page = 1;
                this.updateTabs();
                this.loadData();
            });
        });

        document.querySelectorAll('.hp-tabbar-item').forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                const routes = { home: 'home', leaderboard: 'leaderboard', achievements: 'achievements', profile: 'profile' };
                Router.navigate(routes[tab] || 'home');
            });
        });
    },

    updateTabs() {
        document.querySelectorAll('.hp-lb-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === this.currentTab);
        });
    },

    async loadData() {
        const container = document.getElementById('hpLeaderboardList');
        try {
            const result = await ApiService.get('/heping/game/leaderboard/get', {
                page: this.page,
                page_size: this.pageSize
            });

            if (result.code === 0) {
                this.leaderboardData = result.data.items || [];
                this.renderList();
            } else {
                container.innerHTML = '<div class="hp-empty-text">加载失败</div>';
            }
        } catch (e) {
            container.innerHTML = '<div class="hp-empty-text">加载失败，请重试</div>';
        }
    },

    renderList() {
        const container = document.getElementById('hpLeaderboardList');

        if (!this.leaderboardData.length) {
            container.innerHTML = '<div class="hp-empty-text">暂无排行数据</div>';
            return;
        }

        let sortedData = [...this.leaderboardData];
        if (this.currentTab === 'kills') {
            sortedData.sort((a, b) => (b.kills || 0) - (a.kills || 0));
        } else if (this.currentTab === 'wins') {
            sortedData.sort((a, b) => (b.wins || 0) - (a.wins || 0));
        } else if (this.currentTab === 'level') {
            sortedData.sort((a, b) => (b.level || 0) - (a.level || 0));
        }

        container.innerHTML = sortedData.map((item, index) => {
            const rank = index + 1;
            const rankClass = rank === 1 ? 'hp-rank-gold' : rank === 2 ? 'hp-rank-silver' : rank === 3 ? 'hp-rank-bronze' : '';
            const nickname = item.nickname || '玩家' + (item.username || '').slice(-4);
            const initial = nickname.charAt(0).toUpperCase();
            const statValue = this.currentTab === 'kills' ? (item.kills || 0) :
                              this.currentTab === 'wins' ? (item.wins || 0) :
                              'Lv.' + (item.level || 1);
            const statLabel = this.currentTab === 'kills' ? '击杀' :
                              this.currentTab === 'wins' ? '胜场' : '等级';

            return `
                <div class="hp-lb-item ${rankClass}">
                    <div class="hp-lb-rank">${rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}</div>
                    <div class="hp-lb-avatar">${initial}</div>
                    <div class="hp-lb-info">
                        <div class="hp-lb-name">${nickname}</div>
                        <div class="hp-lb-sub">Lv.${item.level || 1} · 场次${item.games_played || 0}</div>
                    </div>
                    <div class="hp-lb-stat">
                        <div class="hp-lb-stat-value">${statValue}</div>
                        <div class="hp-lb-stat-label">${statLabel}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
};
