const AchievementsPage = {
    render() {
        document.getElementById('app').innerHTML = `
            <nav class="navbar">
                <div class="nav-brand" onclick="Router.navigate('home')">成语接龙</div>
                <div class="nav-menu">
                    <span class="nav-link" onclick="Router.navigate('home')">首页</span>
                    <span class="nav-link" onclick="Router.navigate('game')">开始游戏</span>
                    <span class="nav-link active" onclick="Router.navigate('achievements')">成就</span>
                    <span class="nav-link" onclick="Router.navigate('profile')">个人中心</span>
                </div>
            </nav>
            <div class="page-container">
                <h1>🎖️ 成就系统</h1>
                <div class="stats-bar" id="achieveStats"></div>
                <div id="achieveList"><div class="loading">加载中...</div></div>
            </div>
        `;
        this.load();
    },

    async load() {
        try {
            const [allRes, myRes] = await Promise.all([
                ApiService.get('/chengyu/achievement/list/get'),
                ApiService.get('/chengyu/achievement/my/get')
            ]);

            const allAchievements = allRes.code === 0 ? allRes.data : [];
            const myAchievements = myRes.code === 0 ? myRes.data : [];
            const myIds = new Set(myAchievements.map(a => a.id));
            const unlocked = allAchievements.filter(a => myIds.has(a.id));
            const totalPoints = allAchievements.reduce((s, a) => s + (a.points || 0), 0);
            const earnedPoints = unlocked.reduce((s, a) => s + (a.points || 0), 0);

            document.getElementById('achieveStats').innerHTML = `
                <div class="stat"><span class="stat-value">${unlocked.length}</span><span class="stat-label">已解锁</span></div>
                <div class="stat"><span class="stat-value">${allAchievements.length}</span><span class="stat-label">总成就</span></div>
                <div class="stat"><span class="stat-value">${earnedPoints}</span><span class="stat-label">成就积分</span></div>
            `;

            document.getElementById('achieveList').innerHTML = `
                <div class="achievements-grid">
                    ${allAchievements.map(a => `
                        <div class="achievement-card ${myIds.has(a.id) ? 'unlocked' : ''}">
                            <div class="achievement-icon">${a.icon || '🎖️'}</div>
                            <div class="achievement-info">
                                <h3>${a.name}</h3>
                                <p>${a.description}</p>
                                <div class="achievement-points">
                                    <span class="points">+${a.points || 0} 分</span>
                                    ${myIds.has(a.id) ? '<span class="unlocked-badge">已解锁</span>' : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (err) {
            document.getElementById('achieveList').innerHTML = '<div class="empty">加载失败</div>';
        }
    }
};
