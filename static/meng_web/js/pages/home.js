const HomePage = {
    data: {
        user: null,
        publicDreams: [],
        loading: false
    },

    render() {
        this.data.user = AuthService.getCurrentUser();
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="home-page page">
                ${this.renderUserBar()}
                ${this.renderFeatureGrid()}
                ${this.renderDreamList()}
                ${Tabbar.render('home')}
            </div>
        `;

        this.bindEvents();
        this.loadData();
    },

    renderUserBar() {
        const user = this.data.user || {};
        const nickname = user.nickname || '梦境旅者';
        const avatar = user.avatar || '';
        const dreamFragments = user.dream_fragments || 0;
        const level = user.level || 1;

        return `
            <div class="home-user-bar">
                <div class="user-bar-bg"></div>
                <div class="user-bar-content">
                    <div class="user-info">
                        <div class="user-avatar">
                            ${avatar ? `<img src="${avatar}" alt="头像">` : '<span class="avatar-placeholder">🌙</span>'}
                        </div>
                        <div class="user-detail">
                            <div class="user-nickname">
                                ${nickname}
                                <span class="user-level">Lv.${level}</span>
                            </div>
                            <div class="user-fragments">
                                <span class="fragment-icon">💎</span>
                                <span class="fragment-count">${dreamFragments}</span>
                                <span class="fragment-label">梦境碎片</span>
                            </div>
                        </div>
                    </div>
                    <div class="user-notification" onclick="Toast.info('暂无新消息')">
                        <span class="notification-icon">🔔</span>
                    </div>
                </div>
            </div>
        `;
    },

    renderFeatureGrid() {
        const features = [
            { icon: '🌌', name: '我的梦境', desc: '管理你的梦境', action: "Router.navigate('dreams')" },
            { icon: '🔍', name: '探索梦境', desc: '发现精彩梦境', action: "Router.navigate('explore')" },
            { icon: '🎮', name: '开始游戏', desc: '进入梦境世界', action: "HomePage.startGame()" },
            { icon: '👥', name: '好友系统', desc: '梦境交友', action: "Toast.info('好友系统开发中')" }
        ];

        return `
            <div class="home-features">
                <div class="features-grid">
                    ${features.map(f => `
                        <div class="feature-item" onclick="${f.action}">
                            <div class="feature-icon-wrapper">
                                <span class="feature-icon">${f.icon}</span>
                            </div>
                            <div class="feature-name">${f.name}</div>
                            <div class="feature-desc">${f.desc}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderDreamList() {
        return `
            <div class="home-dreams">
                <div class="section-header">
                    <h2 class="section-title">
                        <span class="title-icon">✨</span>
                        热门公开梦境
                    </h2>
                    <a href="javascript:;" class="section-more" onclick="Toast.info('查看更多')">
                        更多 ›
                    </a>
                </div>
                <div id="dreamListContainer" class="dream-list">
                    ${this.renderDreamItems()}
                </div>
            </div>
        `;
    },

    renderDreamItems() {
        if (this.data.loading) {
            return `
                <div class="loading-more">
                    <span class="loading"></span>
                    <span>加载中...</span>
                </div>
            `;
        }

        if (!this.data.publicDreams || this.data.publicDreams.length === 0) {
            return `
                <div class="empty-dreams">
                    <span class="empty-icon">🌙</span>
                    <p class="empty-text">暂无公开梦境</p>
                    <button class="btn btn-outline btn-sm" onclick="HomePage.loadData()">刷新</button>
                </div>
            `;
        }

        return this.data.publicDreams.map(dream => `
            <div class="dream-card" onclick="HomePage.openDream(${dream.id})">
                <div class="dream-thumbnail">
                    ${dream.thumbnail ? 
                        `<img src="${dream.thumbnail}" alt="${dream.name}">` : 
                        `<div class="thumbnail-placeholder">
                            ${Utils.getTimeIcon(dream.time_of_day)}
                        </div>`
                    }
                    <div class="dream-tags">
                        <span class="dream-tag">
                            ${Utils.getWeatherIcon(dream.weather)} ${Utils.getWeatherName(dream.weather)}
                        </span>
                        <span class="dream-tag">
                            ${Utils.getTimeIcon(dream.time_of_day)} ${Utils.getTimeName(dream.time_of_day)}
                        </span>
                    </div>
                </div>
                <div class="dream-content">
                    <h3 class="dream-title">${dream.name}</h3>
                    <p class="dream-desc">${dream.description || '暂无描述'}</p>
                    <div class="dream-footer">
                        <div class="dream-author">
                            <span class="author-avatar">👤</span>
                            <span class="author-name">${dream.creator_nickname || '梦境创作者'}</span>
                        </div>
                        <div class="dream-stats">
                            <span class="stat-item">
                                <span class="stat-icon">❤️</span>
                                <span class="stat-count">${dream.like_count || 0}</span>
                            </span>
                            <span class="stat-item">
                                <span class="stat-icon">👁️</span>
                                <span class="stat-count">${dream.view_count || 0}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    bindEvents() {
    },

    async loadData() {
        this.data.loading = true;
        this.updateDreamList();

        try {
            const [userResult, dreamResult] = await Promise.all([
                AuthService.getCurrentUserInfo(),
                DreamService.getPublicDreams(1, 10)
            ]);

            if (userResult.code === 0 && userResult.data) {
                this.data.user = userResult.data;
                this.updateUserBar();
            }

            if (dreamResult.code === 0 && dreamResult.data) {
                this.data.publicDreams = dreamResult.data.items || dreamResult.data || [];
            }
        } catch (error) {
            console.error('加载数据失败:', error);
            Toast.error('加载数据失败，请刷新重试');
        } finally {
            this.data.loading = false;
            this.updateDreamList();
        }
    },

    updateUserBar() {
        const userBar = document.querySelector('.home-user-bar');
        if (userBar) {
            userBar.outerHTML = this.renderUserBar();
        }
    },

    updateDreamList() {
        const container = document.getElementById('dreamListContainer');
        if (container) {
            container.innerHTML = this.renderDreamItems();
        }
    },

    openDream(dreamId) {
        Router.navigate('dreamDetail', { dream_id: dreamId });
    },

    async startGame() {
        try {
            Loading.show();
            const dreamsResult = await DreamService.getMyDreams(1, 1);
            if (dreamsResult.code === 0 && dreamsResult.data) {
                const items = dreamsResult.data.items || dreamsResult.data || [];
                if (items.length > 0) {
                    Router.navigate('game', { dream_id: items[0].id });
                } else {
                    const createResult = await DreamService.createDream('我的第一个梦境', '欢迎来到梦境世界！');
                    if (createResult.code === 0 && createResult.data) {
                        Router.navigate('game', { dream_id: createResult.data.id });
                    } else {
                        Toast.error('创建梦境失败，请重试');
                    }
                }
            }
        } catch (error) {
            console.error('进入游戏失败:', error);
            Toast.error('进入游戏失败，请重试');
        } finally {
            Loading.hide();
        }
    }
};
