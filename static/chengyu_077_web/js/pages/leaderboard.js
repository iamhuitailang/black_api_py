const LeaderboardPage = {
    render() {
        document.getElementById('app').innerHTML = `
            <nav class="navbar">
                <div class="nav-brand" onclick="Router.navigate('home')">成语接龙</div>
                <div class="nav-menu">
                    <span class="nav-link" onclick="Router.navigate('home')">首页</span>
                    <span class="nav-link active" onclick="Router.navigate('leaderboard')">排行榜</span>
                </div>
            </nav>
            <div class="page-container">
                <h1>🏆 排行榜</h1>
                <div class="tabs">
                    <button class="tab-btn active" onclick="LeaderboardPage.load('classic', this)">经典模式</button>
                    <button class="tab-btn" onclick="LeaderboardPage.load('battle', this)">对战模式</button>
                </div>
                <div id="leaderboardContent">
                    <div class="loading">加载中...</div>
                </div>
            </div>
        `;
        this.load('classic');
    },

    async load(gameType, btnEl) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        if (btnEl) btnEl.classList.add('active');

        try {
            const res = await ApiService.get('/chengyu/game/leaderboard/get', { game_type: gameType, limit: 50 });
            const content = document.getElementById('leaderboardContent');
            if (res.code === 0 && res.data && res.data.length > 0) {
                const me = AuthService.getCurrentUser();
                content.innerHTML = `
                    <div class="leaderboard-table">
                        <div class="table-header">
                            <div class="col-rank">排名</div>
                            <div>玩家</div>
                            <div class="col-score">积分</div>
                            <div class="col-wins">胜场</div>
                            <div class="col-games">场次</div>
                        </div>
                        ${res.data.map((item, i) => `
                            <div class="table-row ${me && me.id === item.user_id ? 'is-me' : ''}">
                                <div class="col-rank">${i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}</div>
                                <div class="col-user">
                                    <div class="user-avatar">${(item.nickname || item.username || '?')[0]}</div>
                                    <span>${item.nickname || item.username}</span>
                                </div>
                                <div class="col-score">${item.total_score}</div>
                                <div class="col-wins">${item.total_wins}</div>
                                <div class="col-games">${item.total_games}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                content.innerHTML = '<div class="empty">暂无排行数据</div>';
            }
        } catch (err) {
            document.getElementById('leaderboardContent').innerHTML = '<div class="empty">加载失败，请重试</div>';
        }
    }
};
