const HomePage = {
    user: {
        level: 5,
        exp: 1250,
        expNext: 2000,
        coins: 5280,
        gems: 120
    },

    actions: [
        { icon: '🎹', name: '开始演奏', route: 'tracks' },
        { icon: '📖', name: '曲目列表', route: 'tracks' },
        { icon: '✨', name: '魔法特效', route: 'magic' },
        { icon: '🎸', name: '乐器收藏', route: 'instruments' },
        { icon: '🏆', name: '音乐比赛', route: 'competition' },
        { icon: '👤', name: '个人中心', route: 'profile' }
    ],

    recentScores: [
        { id: 1, title: '小星星', score: 9850, stars: 3, icon: '⭐' },
        { id: 2, title: '致爱丽丝', score: 8720, stars: 2, icon: '🎵' },
        { id: 3, title: '月光奏鸣曲', score: 12450, stars: 3, icon: '🌙' }
    ],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <h1 class="header-title">魔法钢琴师</h1>
                </header>

                <div class="home-banner">
                    <div class="home-banner-content">
                        <div class="home-banner-icon">🎹</div>
                        <div class="home-banner-text">
                            <div class="home-banner-title">欢迎回来！</div>
                            <div class="home-banner-subtitle">
                                Lv.${this.user.level} · ${this.user.exp}/${this.user.expNext} EXP
                            </div>
                        </div>
                    </div>
                    <div class="home-stats">
                        <div class="home-stat-item">
                            <div class="home-stat-value">${this.user.coins}</div>
                            <div class="home-stat-label">💰 金币</div>
                        </div>
                        <div class="home-stat-item">
                            <div class="home-stat-value">${this.user.gems}</div>
                            <div class="home-stat-label">💎 宝石</div>
                        </div>
                        <div class="home-stat-item">
                            <div class="home-stat-value">${Math.floor(this.user.exp / this.user.expNext * 100)}%</div>
                            <div class="home-stat-label">📈 进度</div>
                        </div>
                    </div>
                </div>

                <div class="home-actions">
                    ${this.renderActions()}
                </div>

                <div class="recent-scores">
                    <div class="section-title">最近演奏</div>
                    <div class="recent-scores-list">
                        ${this.renderRecentScores()}
                    </div>
                </div>

                ${Tabbar.render('home')}
            </div>
        `;

        this.bindEvents();
        await this.loadUserData();
    },

    renderActions() {
        return this.actions.map(action => `
            <div class="home-action" data-route="${action.route}">
                <div class="home-action-icon">${action.icon}</div>
                <div class="home-action-text">${action.name}</div>
            </div>
        `).join('');
    },

    renderRecentScores() {
        if (this.recentScores.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">🎵</div>
                    <div class="empty-state-text">还没有演奏记录</div>
                </div>
            `;
        }

        return this.recentScores.map(score => `
            <div class="score-item" data-id="${score.id}">
                <div class="score-icon">${score.icon}</div>
                <div class="score-info">
                    <div class="score-title">${score.title}</div>
                    <div class="score-stars">
                        ${'⭐'.repeat(score.stars)}${'☆'.repeat(3 - score.stars)}
                    </div>
                </div>
                <div class="score-value">${score.score.toLocaleString()}</div>
            </div>
        `).join('');
    },

    bindEvents() {
        document.querySelectorAll('.home-action').forEach(action => {
            action.addEventListener('click', () => {
                const route = action.dataset.route;
                if (route === 'tracks') {
                    Router.navigate('tracks');
                } else if (route === 'piano') {
                    Router.navigate('piano', { track_id: 1 });
                } else if (route === 'magic') {
                    Router.navigate('magic');
                } else if (route === 'instruments') {
                    Router.navigate('instruments');
                } else {
                    Toast.info('功能开发中...');
                }
            });
        });

        document.querySelectorAll('.score-item').forEach(item => {
            item.addEventListener('click', () => {
                const trackId = item.dataset.id;
                Router.navigate('piano', { track_id: trackId });
            });
        });
    },

    async loadUserData() {
        try {
            const result = await ApiService.get('/gq/user/current/get');
            if (result.code === 0 && result.data) {
                const user = result.data;
                const expNext = user.level * 100;
                this.user = {
                    level: user.level,
                    exp: user.exp,
                    expNext: expNext,
                    coins: user.coins,
                    gems: user.gems
                };
                this.updateUI();
            }
        } catch (error) {
            console.log('加载用户数据失败，使用模拟数据');
        }

        try {
            const scoresResult = await ApiService.get('/gq/score/user/list/get', { page: 1, page_size: 5 });
            if (scoresResult.code === 0 && scoresResult.data && scoresResult.data.items) {
                this.recentScores = scoresResult.data.items.map(item => ({
                    id: item.track_id,
                    title: '曲目' + item.track_id,
                    score: item.score,
                    stars: item.stars,
                    icon: '🎵'
                }));
                this.updateScoresUI();
            }
        } catch (error) {
            console.log('加载最近成绩失败，使用模拟数据');
        }
    },

    updateUI() {
        const statValues = document.querySelectorAll('.home-stat-value');
        if (statValues.length >= 2) {
            statValues[0].textContent = this.user.coins;
            statValues[1].textContent = this.user.gems;
        }
    },

    updateScoresUI() {
        const list = document.querySelector('.recent-scores-list');
        if (list) {
            list.innerHTML = this.renderRecentScores();
        }
    }
};
