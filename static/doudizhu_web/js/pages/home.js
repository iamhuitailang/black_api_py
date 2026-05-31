const HomePage = {
    render() {
        if (!AuthService.requireAuth()) return;

        const user = AuthService.getUser() || {};
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="home-container">
                <header class="home-header">
                    <div class="user-info">
                        <div class="user-avatar">${user.nickname ? user.nickname.charAt(0).toUpperCase() : 'U'}</div>
                        <div class="user-details">
                            <div class="user-name">${user.nickname || user.username || '玩家'}</div>
                            <div class="user-stats">
                                <span>💰 ${user.coins || 0}</span>
                                <span>⭐ Lv.${user.level || 1}</span>
                            </div>
                        </div>
                    </div>
                    <button id="logoutBtn" class="btn btn-outline">退出</button>
                </header>

                <div class="game-logo">
                    <div class="logo-icon">🎴</div>
                    <h1 class="logo-text">斗地主</h1>
                    <p class="logo-subtitle">经典棋牌 · 欢乐对决</p>
                </div>

                <div class="menu-grid">
                    <div class="menu-card" data-page="game">
                        <div class="menu-icon">🎮</div>
                        <div class="menu-title">开始游戏</div>
                        <div class="menu-desc">人机对战</div>
                    </div>
                    <div class="menu-card" data-page="ranking">
                        <div class="menu-icon">🏆</div>
                        <div class="menu-title">排行榜</div>
                        <div class="menu-desc">查看排名</div>
                    </div>
                    <div class="menu-card" data-page="achievements">
                        <div class="menu-icon">🎖️</div>
                        <div class="menu-title">成就</div>
                        <div class="menu-desc">解锁荣誉</div>
                    </div>
                    <div class="menu-card" data-page="profile">
                        <div class="menu-icon">👤</div>
                        <div class="menu-title">个人中心</div>
                        <div class="menu-desc">账号设置</div>
                    </div>
                </div>

                <div class="difficulty-selector">
                    <h3>选择难度</h3>
                    <div class="difficulty-options">
                        <label class="difficulty-option">
                            <input type="radio" name="difficulty" value="0" />
                            <span>简单</span>
                        </label>
                        <label class="difficulty-option">
                            <input type="radio" name="difficulty" value="1" checked />
                            <span>普通</span>
                        </label>
                        <label class="difficulty-option">
                            <input type="radio" name="difficulty" value="2" />
                            <span>困难</span>
                        </label>
                    </div>
                </div>

                <button id="quickStartBtn" class="btn btn-primary btn-large btn-block">快速开始</button>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            await AuthService.logout();
            Toast.success('已退出登录');
            window.location.hash = '#/login';
        });

        document.querySelectorAll('.menu-card').forEach(card => {
            card.addEventListener('click', () => {
                const page = card.dataset.page;
                if (page === 'game') {
                    this.startGame();
                } else {
                    window.location.hash = `#/${page}`;
                }
            });
        });

        document.getElementById('quickStartBtn').addEventListener('click', () => {
            this.startGame();
        });
    },

    async startGame() {
        const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked');
        const ai_difficulty = selectedDifficulty ? parseInt(selectedDifficulty.value) : 1;

        Toast.info('正在创建游戏...');
        const result = await Api.post(`/game/create?ai_difficulty=${ai_difficulty}`);

        if (result.code === 0 && result.data) {
            sessionStorage.setItem('current_game', JSON.stringify(result.data));
            window.location.hash = '#/game';
        } else {
            Toast.error(result.msg || '创建游戏失败');
        }
    }
};
