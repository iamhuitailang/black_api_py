const GamePage = {
    game: null,
    currentPlayer: 1,

    render() {
        document.getElementById('app').innerHTML = `
            <nav class="navbar">
                <div class="nav-brand" onclick="Router.navigate('home')">成语接龙</div>
                <div class="nav-menu">
                    <span class="nav-link" onclick="Router.navigate('home')">首页</span>
                    <span class="nav-link" onclick="Router.navigate('leaderboard')">排行榜</span>
                    <span class="nav-link active" onclick="Router.navigate('game')">开始游戏</span>
                    <span class="nav-link" onclick="Router.navigate('achievements')">成就</span>
                    <span class="nav-link" onclick="Router.navigate('profile')">个人中心</span>
                </div>
            </nav>
            <div class="page-container">
                <div class="mode-cards">
                    <div class="mode-card" onclick="GamePage.startGame('classic', 'single')">
                        <div class="mode-icon">🎯</div>
                        <h3>经典模式</h3>
                        <p>与AI对战，接龙成语</p>
                    </div>
                    <div class="mode-card" onclick="GamePage.startGame('classic', 'battle')">
                        <div class="mode-icon">⚔️</div>
                        <h3>多人对战</h3>
                        <p>本地双人轮流接龙</p>
                    </div>
                </div>
            </div>
        `;
    },

    async startGame(gameType, mode) {
        try {
            Loading.show();
            const res = await ApiService.post('/chengyu/game/start', { game_type: gameType, mode: mode, time_limit: 60 });
            Loading.hide();
            if (res.code === 0) {
                this.game = res.data;
                this.currentPlayer = 1;
                this.renderGame();
            } else {
                Toast.error(res.message || '开始游戏失败');
            }
        } catch (err) {
            Loading.hide();
            Toast.error('开始游戏失败');
        }
    },

    renderGame() {
        const g = this.game;
        const lastChar = g.current_idiom ? g.current_idiom.slice(-1) : '';
        const isPlaying = g.status === 'playing';
        const isBattle = g.mode === 'battle';

        const turnLabel = isBattle
            ? `<div class="msg-box msg-info">🎮 玩家${this.currentPlayer}的回合</div>`
            : '';

        const modeLabel = isBattle ? '多人对战' : '经典模式';

        document.getElementById('app').innerHTML = `
            <nav class="navbar">
                <div class="nav-brand" onclick="Router.navigate('home')">成语接龙</div>
                <div class="nav-menu">
                    <span class="nav-link" onclick="Router.navigate('home')">首页</span>
                    <span class="nav-link active" onclick="Router.navigate('game')">游戏</span>
                </div>
            </nav>
            <div class="page-container">
                <div class="card">
                    <div style="text-align:center;margin-bottom:12px;font-size:14px;color:#667eea;font-weight:500;">${modeLabel}</div>
                    <div class="game-stats">
                        <div class="stat-item"><span class="stat-label">得分</span><span class="stat-value">${g.score}</span></div>
                        <div class="stat-item"><span class="stat-label">连击</span><span class="stat-value combo">${g.combo}</span></div>
                        <div class="stat-item"><span class="stat-label">最高连击</span><span class="stat-value">${g.max_combo}</span></div>
                    </div>
                    ${turnLabel}
                    <div class="idiom-display">
                        <div class="current-idiom">当前成语：<span class="idiom-word">${g.current_idiom}</span></div>
                        <div class="hint">请输入以 "<span class="highlight">${lastChar}</span>" 开头的成语</div>
                    </div>
                    <div class="input-area">
                        <input type="text" id="idiomInput" placeholder="请输入成语..." ${!isPlaying ? 'disabled' : ''}>
                        <button class="btn btn-primary" onclick="GamePage.playTurn()" ${!isPlaying ? 'disabled' : ''}>提交</button>
                    </div>
                    ${g.status === 'finished' ? `
                        <div class="game-over">
                            <h2>游戏结束！</h2>
                            <p>最终得分：${g.score}</p>
                            <button class="btn btn-primary" onclick="GamePage.startGame('classic', '${g.mode}')">再来一局</button>
                            <span class="btn btn-outline" onclick="Router.navigate('home')">返回首页</span>
                        </div>
                    ` : ''}
                    ${isPlaying ? '<div class="game-actions"><button class="btn btn-outline" style="color:#666;border-color:#ccc;padding:8px 20px;font-size:13px;" onclick="GamePage.endGame()">结束游戏</button></div>' : ''}
                </div>
            </div>
        `;

        if (isPlaying) {
            document.getElementById('idiomInput').addEventListener('keyup', (e) => {
                if (e.key === 'Enter') GamePage.playTurn();
            });
            document.getElementById('idiomInput').focus();
        }
    },

    async playTurn() {
        const input = document.getElementById('idiomInput');
        const idiom = input.value.trim();
        if (!idiom) { Toast.error('请输入成语'); return; }

        try {
            const res = await ApiService.post('/chengyu/game/play', { game_id: this.game.id, idiom });
            if (res.code === 0) {
                const d = res.data;
                this.game.score = d.score;
                this.game.combo = d.combo;

                if (d.game_over) {
                    this.game.status = 'finished';
                    this.renderGame();
                    Toast.success(d.message);
                } else {
                    this.game.current_idiom = d.next_idiom || d.current_idiom;
                    if (this.game.mode === 'battle') {
                        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
                    }
                    this.renderGame();
                    if (d.success) Toast.success(d.message);
                    else Toast.error(d.message);
                }
            } else {
                this.game.combo = 0;
                this.renderGame();
                Toast.error(res.message || '提交失败');
            }
        } catch (err) {
            Toast.error('提交失败');
        }
    },

    async endGame() {
        if (!confirm('确定要结束游戏吗？')) return;
        try {
            await ApiService.post('/chengyu/game/end', { game_id: this.game.id, won: false });
            this.game.status = 'finished';
            this.renderGame();
        } catch (err) {
            Toast.error('结束游戏失败');
        }
    }
};
