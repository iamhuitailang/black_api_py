const HomePage = {
    themes: [],
    loading: true,

    render() {
        const user = AuthService.getCurrentUser()
        const app = document.getElementById('app')
        app.innerHTML = `
            <div class="page has-header">
                <div class="header">
                    <div class="header-title">🎮 趣味连连看</div>
                    <div class="header-action" onclick="Router.navigate('profile')">👤</div>
                </div>

                <div class="home-banner">
                    <div class="home-banner-title">欢迎回来，${user.nickname || user.username}</div>
                    <div class="home-banner-subtitle">
                        总分: ${user.total_score || 0} | 最高: ${user.highest_score || 0} | 游戏: ${user.games_played || 0}局
                    </div>
                </div>

                <div class="section-title">🎨 选择主题</div>
                <div class="theme-list" id="themeList">
                    <div class="loading-state"><div class="loading-spinner"></div></div>
                </div>

                <div class="section-title">🏆 快速入口</div>
                <div class="home-categories">
                    <div class="home-category" onclick="Router.navigate('leaderboard')">
                        <div class="home-category-icon">🏆</div>
                        <div class="home-category-text">排行榜</div>
                    </div>
                    <div class="home-category" onclick="Router.navigate('myProps')">
                        <div class="home-category-icon">🎒</div>
                        <div class="home-category-text">我的道具</div>
                    </div>
                    <div class="home-category" onclick="Router.navigate('myRecords')">
                        <div class="home-category-icon">📊</div>
                        <div class="home-category-text">游戏记录</div>
                    </div>
                    <div class="home-category" onclick="Router.navigate('shop')">
                        <div class="home-category-icon">🛒</div>
                        <div class="home-category-text">道具商店</div>
                    </div>
                </div>

                <div class="tabbar">
                    <div class="tabbar-item active" onclick="Router.navigate('home')">
                        <div class="tabbar-icon">🏠</div>
                        <div class="tabbar-text">首页</div>
                    </div>
                    <div class="tabbar-item" onclick="Router.navigate('leaderboard')">
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
        this.loadThemes()
    },

    async loadThemes() {
        try {
            const result = await GameService.getThemes()
            if (result.code === 0 && result.data) {
                this.themes = result.data
                this.renderThemes()
            } else {
                document.getElementById('themeList').innerHTML =
                    '<div class="empty-state"><div class="empty-state-icon">😢</div><div class="empty-state-text">暂无主题</div></div>'
            }
        } catch (error) {
            document.getElementById('themeList').innerHTML =
                '<div class="empty-state"><div class="empty-state-icon">😢</div><div class="empty-state-text">加载失败</div></div>'
        }
    },

    renderThemes() {
        const list = document.getElementById('themeList')
        if (this.themes.length === 0) {
            list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">😢</div><div class="empty-state-text">暂无主题</div></div>'
            return
        }
        list.innerHTML = this.themes.map(theme => `
            <div class="theme-card" onclick="HomePage.startGame(${theme.id})">
                <div class="theme-icon">${theme.icon}</div>
                <div class="theme-info">
                    <div class="theme-name">${theme.name}</div>
                    <div class="theme-desc">${theme.description || `${theme.rows}×${theme.cols} 方块`}</div>
                    <div class="theme-meta">
                        <span class="badge badge-success">难度 ${theme.difficulty || 1}</span>
                        <span class="badge badge-info">${theme.rows}×${theme.cols}</span>
                    </div>
                </div>
                <div class="theme-action">▶ 开始</div>
            </div>
        `).join('')
    },

    startGame(themeId) {
        Router.navigate('game', { themeId })
    }
}
