const HomePage = {
    maps: [],
    recentRecords: [],
    userInfo: null,

    async render() {
        const app = document.getElementById('app');
        const user = AuthService.getCurrentUser() || {};

        app.innerHTML = `
            <div class="hp-home-page">
                <div class="hp-home-top-bar">
                    <div class="hp-user-info-bar">
                        <div class="hp-user-avatar">${(user.nickname || 'U').charAt(0).toUpperCase()}</div>
                        <div class="hp-user-detail">
                            <div class="hp-user-name">${user.nickname || '战士'}</div>
                            <div class="hp-user-level">Lv.${user.level || 1}</div>
                        </div>
                        <div class="hp-user-exp-bar">
                            <div class="hp-user-exp-fill" style="width:${this.getExpPercent(user)}%"></div>
                        </div>
                    </div>
                </div>

                <div class="hp-home-menu">
                    <button class="hp-btn-start" id="hpStartGameBtn">
                        <span class="hp-btn-start-icon">⚔</span>
                        <span class="hp-btn-start-text">开始游戏</span>
                    </button>
                    <div class="hp-menu-grid">
                        <div class="hp-menu-item" id="hpMenuLeaderboard">
                            <div class="hp-menu-icon">🏆</div>
                            <div class="hp-menu-text">排行榜</div>
                        </div>
                        <div class="hp-menu-item" id="hpMenuAchievements">
                            <div class="hp-menu-icon">🎖</div>
                            <div class="hp-menu-text">成就</div>
                        </div>
                        <div class="hp-menu-item" id="hpMenuProfile">
                            <div class="hp-menu-icon">👤</div>
                            <div class="hp-menu-text">个人中心</div>
                        </div>
                    </div>
                </div>

                <div class="hp-home-section">
                    <div class="hp-section-title">选择战场</div>
                    <div class="hp-map-cards" id="hpMapCards">
                        <div class="hp-loading-text">加载地图中...</div>
                    </div>
                </div>

                <div class="hp-home-section">
                    <div class="hp-section-title">最近战绩</div>
                    <div class="hp-recent-records" id="hpRecentRecords">
                        <div class="hp-loading-text">加载中...</div>
                    </div>
                </div>

                <nav class="hp-tabbar">
                    <div class="hp-tabbar-item active" data-tab="home">
                        <span class="hp-tabbar-icon">🏠</span>
                        <span class="hp-tabbar-text">首页</span>
                    </div>
                    <div class="hp-tabbar-item" data-tab="leaderboard">
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

                <div class="hp-map-overlay" id="hpMapOverlay" style="display:none;">
                    <div class="hp-map-overlay-content">
                        <div class="hp-map-overlay-title">选择地图</div>
                        <div class="hp-map-overlay-list" id="hpMapOverlayList"></div>
                        <button class="hp-btn hp-btn-secondary" id="hpMapOverlayClose">取消</button>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        await this.loadData();
    },

    getExpPercent(user) {
        const level = user.level || 1;
        const exp = user.exp || 0;
        const needed = level * 100;
        return Math.min(100, Math.round((exp / needed) * 100));
    },

    bindEvents() {
        document.getElementById('hpStartGameBtn').addEventListener('click', () => {
            this.showMapPicker();
        });

        document.getElementById('hpMenuLeaderboard').addEventListener('click', () => {
            Router.navigate('leaderboard');
        });

        document.getElementById('hpMenuAchievements').addEventListener('click', () => {
            Router.navigate('achievements');
        });

        document.getElementById('hpMenuProfile').addEventListener('click', () => {
            Router.navigate('profile');
        });

        document.querySelectorAll('.hp-tabbar-item').forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                const routes = { home: 'home', leaderboard: 'leaderboard', achievements: 'achievements', profile: 'profile' };
                Router.navigate(routes[tab] || 'home');
            });
        });

        document.getElementById('hpMapOverlayClose').addEventListener('click', () => {
            document.getElementById('hpMapOverlay').style.display = 'none';
        });

        document.getElementById('hpMapOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'hpMapOverlay') {
                document.getElementById('hpMapOverlay').style.display = 'none';
            }
        });
    },

    async loadData() {
        await this.loadUserInfo();
        await Promise.all([
            this.loadMaps(),
            this.loadRecentRecords()
        ]);
    },

    async loadUserInfo() {
        try {
            const result = await AuthService.getCurrentUserInfo();
            if (result.code === 0 && result.data) {
                this.userInfo = result.data;
                Storage.setUser(result.data);
                const user = result.data;
                const avatarEl = document.querySelector('.hp-user-avatar');
                const nameEl = document.querySelector('.hp-user-name');
                const levelEl = document.querySelector('.hp-user-level');
                const expFill = document.querySelector('.hp-user-exp-fill');
                if (avatarEl) avatarEl.textContent = (user.nickname || 'U').charAt(0).toUpperCase();
                if (nameEl) nameEl.textContent = user.nickname || '战士';
                if (levelEl) levelEl.textContent = 'Lv.' + (user.level || 1);
                if (expFill) expFill.style.width = this.getExpPercent(user) + '%';
            }
        } catch (e) {
            console.error(e);
        }
    },

    async loadMaps() {
        try {
            const result = await ApiService.get('/heping/map/list/get', { page: 1, page_size: 10 });
            if (result.code === 0) {
                const data = result.data;
                if (Array.isArray(data)) {
                    this.maps = data;
                } else {
                    this.maps = data.items || data.list || [];
                }
                this.renderMapCards();
            } else {
                this.maps = [];
                this.renderMapCards();
            }
        } catch (e) {
            console.error(e);
            this.maps = [];
            this.renderMapCards();
        }
    },

    renderMapCards() {
        const container = document.getElementById('hpMapCards');
        if (!this.maps.length) {
            container.innerHTML = '<div class="hp-empty-text">暂无地图</div>';
            return;
        }
        container.innerHTML = this.maps.map(m => `
            <div class="hp-map-card" data-map-id="${m.id}">
                <div class="hp-map-card-icon">${this.getMapIcon(m.terrain_type)}</div>
                <div class="hp-map-card-name">${m.name}</div>
                <div class="hp-map-card-desc">${m.description || Utils.terrainText(m.terrain_type)}</div>
            </div>
        `).join('');

        container.querySelectorAll('.hp-map-card').forEach(card => {
            card.addEventListener('click', () => {
                Router.navigate('home');
            });
        });
    },

    getMapIcon(terrain) {
        const icons = { island: '🏝', desert: '🏜', forest: '🌲', city: '🏙' };
        return icons[terrain] || '🗺';
    },

    async loadRecentRecords() {
        try {
            const result = await ApiService.get('/heping/game/record/list/get', { page: 1, page_size: 3 });
            if (result.code === 0) {
                this.recentRecords = result.data.items || [];
                this.renderRecentRecords();
            }
        } catch (e) {
            console.error(e);
        }
    },

    renderRecentRecords() {
        const container = document.getElementById('hpRecentRecords');
        if (!this.recentRecords.length) {
            container.innerHTML = '<div class="hp-empty-text">暂无战绩，快去战斗吧</div>';
            return;
        }
        container.innerHTML = this.recentRecords.map(r => `
            <div class="hp-record-item">
                <div class="hp-record-rank ${r.is_win ? 'hp-rank-win' : ''}">#${r.rank}</div>
                <div class="hp-record-info">
                    <div class="hp-record-kills">击杀 ${r.kills}</div>
                    <div class="hp-record-time">${Utils.formatTime(r.created_at)}</div>
                </div>
                <div class="hp-record-result ${r.is_win ? 'hp-result-win' : ''}">${r.is_win ? '吃鸡' : '淘汰'}</div>
            </div>
        `).join('');
    },

    showMapPicker() {
        const overlay = document.getElementById('hpMapOverlay');
        const list = document.getElementById('hpMapOverlayList');

        if (!this.maps.length) {
            Utils.showToast('地图加载中，请稍后');
            return;
        }

        list.innerHTML = this.maps.map(m => `
            <div class="hp-map-pick-item" data-map-id="${m.id}" data-map-name="${m.name}">
                <div class="hp-map-pick-icon">${this.getMapIcon(m.terrain_type)}</div>
                <div class="hp-map-pick-info">
                    <div class="hp-map-pick-name">${m.name}</div>
                    <div class="hp-map-pick-desc">${m.description || Utils.terrainText(m.terrain_type)}</div>
                    <div class="hp-map-pick-players">最大${m.max_players || 100}人</div>
                </div>
                <div class="hp-map-pick-arrow">›</div>
            </div>
        `).join('');

        list.querySelectorAll('.hp-map-pick-item').forEach(item => {
            item.addEventListener('click', () => {
                const mapId = parseInt(item.dataset.mapId);
                this.startGame(mapId);
            });
        });

        overlay.style.display = 'flex';
    },

    async startGame(mapId) {
        try {
            Utils.showToast('正在进入战场...');
            const result = await ApiService.post('/heping/game/start', { map_id: mapId });
            if (result.code === 0) {
                document.getElementById('hpMapOverlay').style.display = 'none';
                Router.navigate('game', { map_id: mapId });
            } else {
                Utils.showToast(result.msg || '启动游戏失败');
            }
        } catch (e) {
            Utils.showToast('启动游戏失败');
        }
    }
};
