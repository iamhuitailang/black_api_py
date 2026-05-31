const LeaderboardPage = {
    leaderboard: [],
    loading: true,

    render() {
        const app = document.getElementById('app')
        app.innerHTML = `
            <div class="page has-header">
                <div class="header">
                    <div class="header-back" onclick="Router.back()">←</div>
                    <div class="header-title">🏆 排行榜</div>
                </div>
                <div class="leaderboard-tabs">
                    <div class="leaderboard-tab active" onclick="LeaderboardPage.switchTab('score')">积分榜</div>
                    <div class="leaderboard-tab" onclick="LeaderboardPage.switchTab('record')">纪录榜</div>
                </div>
                <div class="leaderboard-list" id="leaderboardList">
                    <div class="loading-state"><div class="loading-spinner"></div></div>
                </div>
                <div class="tabbar">
                    <div class="tabbar-item" onclick="Router.navigate('home')">
                        <div class="tabbar-icon">🏠</div>
                        <div class="tabbar-text">首页</div>
                    </div>
                    <div class="tabbar-item active" onclick="Router.navigate('leaderboard')">
                        <div class="tabbar-icon">🏆</div>
                        <div class="tabbar-text">排行</div>
                    </div>
                    <div class="tabbar-item" onclick="Router.navigate('shop')">
                        <div class="tabbar-icon">🛒</div>
                        <div class="tabbar-text">商店</div>
                    </div>
                    <div class="tabbar-item" onclick="Router.navigate('profile')">
                        <div class="tabbar-icon">👤</div>
                        <div class="tabbar-text">我的</div>
                    </div>
                </div>
            </div>
        `
        this.loadLeaderboard('score')
    },

    currentTab: 'score',

    switchTab(tab) {
        this.currentTab = tab
        document.querySelectorAll('.leaderboard-tab').forEach((el, idx) => {
            el.classList.toggle('active', (tab === 'score' && idx === 0) || (tab === 'record' && idx === 1))
        })
        this.loadLeaderboard(tab)
    },

    async loadLeaderboard(type) {
        this.loading = true
        document.getElementById('leaderboardList').innerHTML =
            '<div class="loading-state"><div class="loading-spinner"></div></div>'
        try {
            const result = type === 'score'
                ? await GameService.getScoreLeaderboard()
                : await GameService.getLeaderboard()
            if (result.code === 0 && result.data) {
                this.leaderboard = type === 'score' ? result.data.items : result.data
                this.renderLeaderboard()
            } else {
                document.getElementById('leaderboardList').innerHTML =
                    '<div class="empty-state"><div class="empty-state-icon">🏆</div><div class="empty-state-text">暂无数据</div></div>'
            }
        } catch (error) {
            document.getElementById('leaderboardList').innerHTML =
                '<div class="empty-state"><div class="empty-state-icon">😢</div><div class="empty-state-text">加载失败</div></div>'
        }
    },

    renderLeaderboard() {
        const list = document.getElementById('leaderboardList')
        if (!this.leaderboard || this.leaderboard.length === 0) {
            list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏆</div><div class="empty-state-text">暂无数据</div></div>'
            return
        }
        list.innerHTML = this.leaderboard.map((item, idx) => {
            const rank = idx + 1
            const rankClass = rank <= 3 ? `rank-${rank}` : ''
            const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank
            const nickname = item.nickname || item.username || '匿名玩家'
            const score = this.currentTab === 'score' ? item.total_score : item.score
            return `
                <div class="rank-item ${rankClass}">
                    <div class="rank-number">${rankIcon}</div>
                    <div class="rank-avatar">${nickname[0]}</div>
                    <div class="rank-info">
                        <div class="rank-name">${nickname}</div>
                        <div class="rank-meta">游戏 ${item.games_played || 0} 局</div>
                    </div>
                    <div class="rank-score">${score || 0}</div>
                </div>
            `
        }).join('')
    }
}
