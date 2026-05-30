const RankPage = {
    ranks: [],

    render() {
        const app = document.getElementById('app');
        app.innerHTML = this.renderLayout(this.renderContent());
        this.bindEvents();
        this.loadRanks();
    },

    renderLayout(content) {
        const user = AuthService.getCurrentUser();
        const currentRoute = Router.getCurrentRoute();
        
        return `
            <div class="game-layout">
                <header class="game-header">
                    <div class="game-header-left">
                        <div class="game-logo">
                            <span class="icon">🎪</span>
                            <span>杂耍大师</span>
                        </div>
                    </div>
                    <div class="game-header-right">
                        <div class="user-menu" id="userMenu">
                            <div class="user-avatar">${user?.nickname?.[0] || user?.username?.[0] || 'U'}</div>
                            <span>${user?.nickname || user?.username || '玩家'}</span>
                        </div>
                    </div>
                </header>
                
                <nav class="game-nav">
                    <button class="nav-btn ${currentRoute === 'home' ? 'active' : ''}" data-route="home">🏠 首页</button>
                    <button class="nav-btn ${currentRoute === 'character' ? 'active' : ''}" data-route="character">👤 角色</button>
                    <button class="nav-btn ${currentRoute === 'game' ? 'active' : ''}" data-route="game">🎮 游戏</button>
                    <button class="nav-btn ${currentRoute === 'rank' ? 'active' : ''}" data-route="rank">🏆 排行</button>
                    <button class="nav-btn ${currentRoute === 'settings' ? 'active' : ''}" data-route="settings">⚙️ 设置</button>
                </nav>
                
                <main class="game-main">
                    <div class="game-content">
                        ${content}
                    </div>
                </main>
            </div>
        `;
    },

    renderContent() {
        return `
            <div class="rank-container">
                <h2 class="section-title">
                    <span>🏆</span>
                    排行榜
                </h2>

                <div class="rank-table">
                    <div class="rank-header">
                        <div>排名</div>
                        <div>玩家</div>
                        <div class="rank-score">得分</div>
                        <div class="rank-combo">连击</div>
                        <div>关卡</div>
                    </div>
                    <div id="rankList">
                        <div class="empty-state">
                            <div class="icon">📊</div>
                            <p>加载中...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                Router.navigate(btn.dataset.route);
            });
        });

        document.getElementById('userMenu')?.addEventListener('click', async () => {
            if (confirm('确定要退出登录吗？')) {
                await AuthService.logout();
                Router.navigate('login');
            }
        });
    },

    async loadRanks() {
        try {
            const result = await ApiService.get('/zashua02/record/rank', { limit: 20 });
            
            if (result.code === 0 && result.data?.records) {
                this.ranks = result.data.records;
                this.renderRanks();
            } else {
                this.renderEmpty();
            }
        } catch (e) {
            console.error('Failed to load ranks:', e);
            this.renderEmpty();
        }
    },

    renderRanks() {
        const user = AuthService.getCurrentUser();
        const listEl = document.getElementById('rankList');

        if (this.ranks.length === 0) {
            this.renderEmpty();
            return;
        }

        let html = '';
        this.ranks.forEach((record, index) => {
            const isMe = record.user_id === user?.id;
            let rankClass = '';
            let rankDisplay = index + 1;
            
            if (index === 0) rankClass = 'gold';
            else if (index === 1) rankClass = 'silver';
            else if (index === 2) rankClass = 'bronze';

            html += `
                <div class="rank-row ${isMe ? 'me' : ''}">
                    <div>
                        <span class="rank-number ${rankClass}">${rankDisplay}</span>
                    </div>
                    <div class="rank-player">
                        <div class="rank-avatar">${(record.nickname || record.username || '?')[0]}</div>
                        <span class="rank-name">${record.nickname || record.username || '匿名玩家'}</span>
                    </div>
                    <div class="rank-score">${record.score}</div>
                    <div class="rank-combo">${record.max_combo}</div>
                    <div>${record.level}</div>
                </div>
            `;
        });

        listEl.innerHTML = html;
    },

    renderEmpty() {
        document.getElementById('rankList').innerHTML = `
            <div class="empty-state">
                <div class="icon">🏆</div>
                <p>暂无排行记录</p>
                <p class="mt-1">快去创造你的第一个记录吧！</p>
            </div>
        `;
    }
};

window.RankPage = RankPage;
