const HomePage = {
    categories: [],
    hotSkills: [],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page-container">
                <header class="page-header">
                    <div class="header-left">
                        <div class="header-logo">🔄</div>
                        <div class="header-title">
                            <h1>易技圈</h1>
                            <p>技能交换平台</p>
                        </div>
                    </div>
                    <div class="header-right">
                        <button class="search-btn" onclick="Router.navigate('match')">
                            <span class="icon">🔍</span>
                        </button>
                    </div>
                </header>

                <div class="search-bar" onclick="Router.navigate('match')">
                    <span class="search-icon">🔍</span>
                    <span class="search-placeholder">搜索技能或用户</span>
                </div>

                <div class="content-scroll">
                    <div class="section">
                        <div class="section-header">
                            <h2 class="section-title">技能分类</h2>
                        </div>
                        <div class="category-grid" id="category-grid">
                            <div class="skeleton skeleton-category"></div>
                            <div class="skeleton skeleton-category"></div>
                            <div class="skeleton skeleton-category"></div>
                            <div class="skeleton skeleton-category"></div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-header">
                            <h2 class="section-title">热门技能</h2>
                            <a href="#match" class="section-more">查看更多</a>
                        </div>
                        <div class="skill-list" id="hot-skills">
                            <div class="skeleton skeleton-skill"></div>
                            <div class="skeleton skeleton-skill"></div>
                            <div class="skeleton skeleton-skill"></div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-header">
                            <h2 class="section-title">为你推荐</h2>
                            <a href="#match" class="section-more">查看更多</a>
                        </div>
                        <div class="match-list" id="recommend-list">
                            <div class="skeleton skeleton-match"></div>
                            <div class="skeleton skeleton-match"></div>
                        </div>
                    </div>
                </div>

                <nav class="bottom-nav">
                    <div class="nav-item active" data-route="home">
                        <span class="nav-icon">🏠</span>
                        <span class="nav-label">首页</span>
                    </div>
                    <div class="nav-item" data-route="skill">
                        <span class="nav-icon">⚡</span>
                        <span class="nav-label">技能</span>
                    </div>
                    <div class="nav-item add-btn" data-route="skill">
                        <span class="nav-icon">+</span>
                    </div>
                    <div class="nav-item" data-route="exchange">
                        <span class="nav-icon">🔄</span>
                        <span class="nav-label">交换</span>
                    </div>
                    <div class="nav-item" data-route="profile">
                        <span class="nav-icon">👤</span>
                        <span class="nav-label">我的</span>
                    </div>
                </nav>
            </div>
        `;

        this.bindEvents();
        await this.loadData();
    },

    bindEvents() {
        const navItems = document.querySelectorAll('.bottom-nav .nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                if (route) {
                    Router.navigate(route);
                }
            });
        });
    },

    async loadData() {
        try {
            await Promise.all([
                this.loadCategories(),
                this.loadHotSkills(),
                this.loadRecommendations()
            ]);
        } catch (error) {
            console.error('加载首页数据失败:', error);
        }
    },

    async loadCategories() {
        try {
            const result = await ApiService.get('/jn/category/tree/get');
            if (result.code === 0 && result.data) {
                this.categories = result.data.slice(0, 8);
                this.renderCategories();
            }
        } catch (error) {
            console.error('加载分类失败:', error);
        }
    },

    renderCategories() {
        const grid = document.getElementById('category-grid');
        if (!grid) return;

        const icons = {
            '编程': '💻',
            '设计': '🎨',
            '语言': '🌍',
            '音乐': '🎵',
            '运动': '⚽',
            '生活': '🏠',
            '职场': '💼'
        };

        grid.innerHTML = this.categories.map(cat => `
            <div class="category-item" onclick="Router.navigate('match?category=${encodeURIComponent(cat.code || cat.name)}')">
                <div class="category-icon">${icons[cat.name] || '📚'}</div>
                <span class="category-name">${cat.name}</span>
            </div>
        `).join('');
    },

    async loadHotSkills() {
        try {
            const result = await ApiService.get('/jn/skill/search/get', { page_size: 5, skill_type: 'offer' });
            if (result.code === 0 && result.data && result.data.items) {
                this.hotSkills = result.data.items;
                this.renderHotSkills();
            }
        } catch (error) {
            console.error('加载热门技能失败:', error);
        }
    },

    renderHotSkills() {
        const container = document.getElementById('hot-skills');
        if (!container) return;

        if (this.hotSkills.length === 0) {
            container.innerHTML = '<div class="empty-state small">暂无热门技能</div>';
            return;
        }

        container.innerHTML = this.hotSkills.slice(0, 5).map(skill => `
            <div class="skill-card-mini" onclick="Router.navigate('match')">
                <div class="skill-info">
                    <span class="skill-name">${skill.name || skill.skill_name || '技能'}</span>
                    <span class="skill-count">${skill.count || skill.user_count || 0}人</span>
                </div>
                <span class="arrow">›</span>
            </div>
        `).join('');
    },

    async loadRecommendations() {
        try {
            const result = await ApiService.get('/jn/match/recommend/get', { page_size: 3 });
            if (result.code === 0 && result.data && result.data.items) {
                this.renderRecommendations(result.data.items);
            } else {
                this.renderRecommendations([]);
            }
        } catch (error) {
            console.error('加载推荐失败:', error);
            this.renderRecommendations([]);
        }
    },

    renderRecommendations(matches) {
        const container = document.getElementById('recommend-list');
        if (!container) return;

        if (!matches || matches.length === 0) {
            container.innerHTML = `
                <div class="empty-state small">
                    <p>先去发布你的技能吧</p>
                    <button class="btn btn-primary btn-sm" onclick="Router.navigate('skill')">发布技能</button>
                </div>
            `;
            return;
        }

        container.innerHTML = matches.slice(0, 3).map(match => {
            const user = match.user || match;
            return `
            <div class="match-card" onclick="Router.navigate('match')">
                <div class="match-header">
                    <img class="user-avatar" src="${Utils.getAvatarUrl(user.avatar, user.nickname)}" alt="${user.nickname}">
                    <div class="user-info">
                        <span class="user-name">${user.nickname || '用户'}</span>
                        <div class="credit-info">
                            <span class="credit-score" style="color: ${Utils.getCreditColor(user.credit)}">★ ${user.credit || 100}</span>
                        </div>
                    </div>
                </div>
                <div class="match-content">
                    ${match.offer_skill ? `
                    <div class="skill-row">
                        <span class="label offer">提供</span>
                        <span class="skill-tag">${match.offer_skill.name || ''}</span>
                    </div>
                    ` : ''}
                    ${match.need_skill ? `
                    <div class="skill-row">
                        <span class="label need">需求</span>
                        <span class="skill-tag">${match.need_skill.name || ''}</span>
                    </div>
                    ` : ''}
                    ${match.match_score ? `
                    <div class="match-score">
                        匹配度: <strong>${match.match_score}%</strong>
                    </div>
                    ` : ''}
                </div>
            </div>
        `}).join('');
    }
};

window.HomePage = HomePage;
