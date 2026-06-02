const Tabbar = {
    render(active = 'home') {
        return `
            <nav class="tabbar">
                <div class="tabbar-item ${active === 'home' ? 'active' : ''}" onclick="Router.navigate('home')">
                    <span class="tabbar-icon">🔍</span>
                    <span class="tabbar-text">案件</span>
                </div>
                <div class="tabbar-item ${active === 'myCases' ? 'active' : ''}" onclick="Router.navigate('profile')">
                    <span class="tabbar-icon">📋</span>
                    <span class="tabbar-text">我的</span>
                </div>
                <div class="tabbar-item ${active === 'profile' ? 'active' : ''}" onclick="Router.navigate('profile')">
                    <span class="tabbar-icon">👤</span>
                    <span class="tabbar-text">个人中心</span>
                </div>
            </nav>
        `;
    }
};

const HomePage = {
    currentPage: 1,
    pageSize: 10,
    currentEra: 'all',
    currentDifficulty: null,
    keyword: '',
    hasMore: true,
    cases: [],
    eras: [],

    async render() {
        const app = document.getElementById('app');
        const user = AuthService.getCurrentUser() || {};
        const level = Utils.calculateLevel(user.exp || 0);

        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <h1 class="header-title">时光侦探</h1>
                    <div class="header-action" onclick="HomePage.handleInit()">
                        初始化
                    </div>
                </header>

                <div class="home-banner">
                    <h2 class="home-banner-title">🔍 时光侦探</h2>
                    <p class="home-banner-subtitle">欢迎回来，${user.nickname || '侦探'} · Lv.${level}</p>
                </div>

                <div class="home-stats">
                    <div class="home-stat-item">
                        <div class="home-stat-value" id="totalCases">0</div>
                        <div class="home-stat-label">案件总数</div>
                    </div>
                    <div class="home-stat-item">
                        <div class="home-stat-value" id="solvedCases">0</div>
                        <div class="home-stat-label">已破案件</div>
                    </div>
                    <div class="home-stat-item">
                        <div class="home-stat-value" id="collectClues">0</div>
                        <div class="home-stat-label">收集线索</div>
                    </div>
                </div>

                <div class="section-title">选择时代</div>
                <div class="era-filters" id="eraFilters">
                    <div class="era-filter active" data-era="all">全部</div>
                </div>

                <div class="search-bar">
                    <span class="search-icon">🔍</span>
                    <input type="text" class="search-input" id="searchInput" placeholder="搜索案件名称...">
                </div>

                <div class="case-list" id="caseList">
                    <div class="empty-state">
                        <div class="empty-state-icon">📜</div>
                        <div class="empty-state-title">加载中<span class="loading-dots"></span></div>
                    </div>
                </div>

                ${Tabbar.render('home')}
            </div>
        `;

        this.bindEvents();
        this.currentPage = 1;
        this.currentEra = 'all';
        this.keyword = '';
        this.hasMore = true;
        this.cases = [];
        await this.loadEras();
        await this.loadCases();
    },

    bindEvents() {
        document.getElementById('searchInput').addEventListener('input', Utils.debounce((e) => {
            this.keyword = e.target.value.trim();
            this.currentPage = 1;
            this.hasMore = true;
            this.cases = [];
            this.loadCases();
        }, 500));
    },

    bindEraEvents() {
        document.querySelectorAll('.era-filter').forEach(filter => {
            filter.addEventListener('click', () => {
                if (this.currentEra === filter.dataset.era) return;
                this.currentEra = filter.dataset.era;
                this.currentPage = 1;
                this.hasMore = true;
                this.cases = [];
                this.updateEraFilters();
                this.loadCases();
            });
        });
    },

    updateEraFilters() {
        document.querySelectorAll('.era-filter').forEach(filter => {
            filter.classList.toggle('active', filter.dataset.era === this.currentEra);
        });
    },

    async loadEras() {
        try {
            const result = await PoanApi.getEras();
            if (result.code === 0 && result.data) {
                this.eras = result.data || [];
                this.renderEras();
                this.bindEraEvents();
            }
        } catch (error) {
            console.error('加载时代列表失败:', error);
        }
    },

    renderEras() {
        const container = document.getElementById('eraFilters');
        let html = '<div class="era-filter active" data-era="all">全部</div>';
        this.eras.forEach(era => {
            html += `
                <div class="era-filter" data-era="${era.code}">
                    ${Utils.getEraIcon(era.code)} ${era.name}
                </div>
            `;
        });
        container.innerHTML = html;
    },

    async loadCases() {
        const caseList = document.getElementById('caseList');
        if (this.currentPage === 1) {
            caseList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📜</div>
                    <div class="empty-state-title">加载中<span class="loading-dots"></span></div>
                </div>
            `;
        }

        try {
            const params = {
                page: this.currentPage,
                page_size: this.pageSize
            };

            if (this.currentEra && this.currentEra !== 'all') {
                params.era = this.currentEra;
            }

            if (this.keyword) {
                params.keyword = this.keyword;
            }

            const result = await PoanApi.getCaseList(params);

            if (result.code === 0) {
                const newCases = result.data.items || [];
                const total = result.data.total || 0;

                document.getElementById('totalCases').textContent = total;

                if (newCases.length === 0 && this.currentPage === 1) {
                    caseList.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">🔍</div>
                            <div class="empty-state-title">暂无案件</div>
                            <div class="empty-state-text">点击右上角"初始化"按钮添加示例案件</div>
                        </div>
                    `;
                    return;
                }

                if (newCases.length < this.pageSize) {
                    this.hasMore = false;
                }

                if (this.currentPage === 1) {
                    this.cases = newCases;
                } else {
                    this.cases = [...this.cases, ...newCases];
                }

                caseList.innerHTML = this.cases.map(c => this.renderCaseCard(c)).join('');

                if (!this.hasMore && this.cases.length > 0) {
                    caseList.innerHTML += `
                        <div class="text-center" style="padding: 16px; color: var(--text-muted); font-size: 12px;">
                            没有更多了
                        </div>
                    `;
                }

                this.bindCaseEvents();
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (error) {
            console.error('加载案件列表失败:', error);
            if (this.currentPage === 1) {
                caseList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">❌</div>
                        <div class="empty-state-title">加载失败</div>
                        <div class="empty-state-text">点击重试</div>
                    </div>
                `;
                caseList.querySelector('.empty-state').onclick = () => this.loadCases();
            }
        }
    },

    renderCaseCard(c) {
        const stars = Utils.getDifficultyStars(c.difficulty || 1);
        const eraName = Utils.getEraName(c.era);
        const eraIcon = Utils.getEraIcon(c.era);

        return `
            <div class="case-card" data-id="${c.id}">
                <div class="case-card-image">
                    <div class="case-card-era">
                        <span class="badge badge-primary">${eraIcon} ${eraName}</span>
                    </div>
                    <div class="case-card-difficulty">
                        <span class="badge ${Utils.getDifficultyClass(c.difficulty)}">${Utils.getDifficultyText(c.difficulty)}</span>
                    </div>
                    ${c.icon || '📜'}
                </div>
                <div class="case-card-content">
                    <div class="case-card-title">${c.title}</div>
                    <div class="case-card-desc">${c.description || '暂无描述'}</div>
                    <div class="case-card-footer">
                        <div class="case-card-meta">
                            <span>👁️ ${c.view_count || 0}</span>
                            <span>⭐ ${c.play_count || 0}</span>
                        </div>
                        <div class="difficulty-stars">
                            ${stars.map((s, i) => '<span class="star ' + s + '">★</span>').join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    bindCaseEvents() {
        document.querySelectorAll('.case-card').forEach(card => {
            card.addEventListener('click', () => {
                const caseId = card.dataset.id;
                Router.navigate('case_detail', { case_id: caseId });
            });
        });
    },

    async handleInit() {
        Loading.show();
        try {
            const result = await PoanApi.initCases();
            if (result.code === 0) {
                Toast.success('初始化成功，已添加示例案件');
                this.currentPage = 1;
                this.hasMore = true;
                this.cases = [];
                await this.loadCases();
            } else {
                Toast.error(result.msg || '初始化失败');
            }
        } catch (error) {
            console.error('初始化失败:', error);
            Toast.error('初始化失败，请检查网络');
        } finally {
            Loading.hide();
        }
    }
};

window.HomePage = HomePage;
window.Tabbar = Tabbar;
