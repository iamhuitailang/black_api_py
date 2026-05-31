const HomePage = {
    render() {
        const isLoggedIn = AuthService.isLoggedIn();
        const user = AuthService.getCurrentUser();

        document.getElementById('app').innerHTML = `
            <nav class="navbar">
                <div class="nav-brand" onclick="Router.navigate('home')">成语接龙</div>
                <div class="nav-menu">
                    <span class="nav-link" onclick="Router.navigate('home')">首页</span>
                    <span class="nav-link" onclick="Router.navigate('leaderboard')">排行榜</span>
                    ${isLoggedIn ? `
                        <span class="nav-link" onclick="Router.navigate('game')">开始游戏</span>
                        <span class="nav-link" onclick="Router.navigate('achievements')">成就</span>
                        <span class="nav-link" onclick="Router.navigate('profile')">个人中心</span>
                        <span class="btn btn-outline" style="padding:6px 16px;font-size:13px;" onclick="AuthService.logout();Router.navigate('home')">退出</span>
                    ` : `
                        <span class="btn btn-primary" style="padding:6px 16px;font-size:13px;" onclick="Router.navigate('login')">登录</span>
                        <span class="btn btn-outline" style="padding:6px 16px;font-size:13px;" onclick="Router.navigate('register')">注册</span>
                    `}
                </div>
            </nav>

            <div class="hero-section">
                <h1 class="hero-title">成语接龙游戏</h1>
                <p class="hero-subtitle">中华文化，博大精深</p>
                <p class="hero-desc">成语接龙是中华民族传统的文字游戏，有着悠久的历史，是老少皆宜的民间文化娱乐活动。</p>
                <div class="hero-buttons">
                    ${isLoggedIn
                        ? '<span class="btn btn-primary btn-lg" onclick="Router.navigate(\'game\')">开始游戏</span>'
                        : '<span class="btn btn-primary btn-lg" onclick="Router.navigate(\'login\')">登录开始游戏</span>'}
                    <span class="btn btn-outline btn-lg" onclick="Router.navigate('leaderboard')">查看排行榜</span>
                </div>
            </div>

            <div class="features">
                <div class="feature-card"><div class="feature-icon">🎮</div><h3>单人模式</h3><p>挑战AI，检验你的成语储备量</p></div>
                <div class="feature-card" onclick="Router.navigate('game')"><div class="feature-icon">⚔️</div><h3>对战模式</h3><p>本地双人轮流接龙</p></div>
                <div class="feature-card"><div class="feature-icon">🏆</div><h3>排行榜</h3><p>与全国玩家比拼积分排名</p></div>
                <div class="feature-card"><div class="feature-icon">🎖️</div><h3>成就系统</h3><p>解锁各种成就徽章</p></div>
            </div>
        `;
    }
};
