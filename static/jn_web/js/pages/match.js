const MatchPage = {
    matches: [],
    currentFilter: 'all',
    searchKeyword: '',
    categories: [],
    currentCategory: '',

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page-container">
                <header class="page-header">
                    <div class="header-left">
                        <button class="back-btn" onclick="Router.navigate('home')">
                            <span class="icon">‹</span>
                        </button>
                        <h1>匹配推荐</h1>
                    </div>
                </header>

                <div class="search-bar-expanded">
                    <span class="search-icon">🔍</span>
                    <input type="text" id="search-input" class="form-control" placeholder="搜索技能或用户">
                </div>

                <div class="category-scroll" id="category-scroll">
                    <div class="category-chip active" data-category="">全部</div>
                </div>

                <div class="content-scroll">
                    <div class="match-list" id="match-list">
                        <div class="loading-state">
                            <div class="loading"></div>
                            <span>加载中...</span>
                        </div>
                    </div>
                </div>

                <nav class="bottom-nav">
                    <div class="nav-item" data-route="home">
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

            <div class="modal-overlay" id="exchange-modal">
                <div class="modal modal-bottom">
                    <div class="modal-header">
                        <h3 class="modal-title">发起交换邀请</h3>
                        <button class="modal-close" id="exchange-modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="match-card-preview" id="match-preview"></div>
                        <form id="exchange-form">
                            <div class="form-group">
                                <label class="form-label">我提供的技能</label>
                                <select id="my-offer-skill" class="form-control">
                                    <option value="">请选择</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">我想学习的技能</label>
                                <select id="my-need-skill" class="form-control">
                                    <option value="">请选择</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">留言（可选）</label>
                                <textarea id="exchange-message" class="form-control" placeholder="说点什么..." rows="2"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="exchange-modal-cancel">取消</button>
                        <button type="button" class="btn btn-primary" id="exchange-modal-send">发送邀请</button>
                    </div>
                </div>
            </div>

            <div class="modal-overlay" id="user-detail-modal">
                <div class="modal modal-bottom modal-large">
                    <div class="modal-header">
                        <h3 class="modal-title">用户详情</h3>
                        <button class="modal-close" id="user-detail-close">&times;</button>
                    </div>
                    <div class="modal-body" id="user-detail-content">
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        await this.loadCategories();
        await this.loadMatches();
    },

    bindEvents() {
        const navItems = document.querySelectorAll('.bottom-nav .nav-item[data-route]');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                if (route) Router.navigate(route);
            });
        });

        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', Utils.debounce(() => {
            this.searchKeyword = searchInput.value.trim();
            this.loadMatches();
        }, 300));

        document.getElementById('exchange-modal-close').addEventListener('click', () => {
            document.getElementById('exchange-modal').classList.remove('show');
        });
        document.getElementById('exchange-modal-cancel').addEventListener('click', () => {
            document.getElementById('exchange-modal').classList.remove('show');
        });

        document.getElementById('user-detail-close').addEventListener('click', () => {
            document.getElementById('user-detail-modal').classList.remove('show');
        });

        document.getElementById('exchange-modal-send').addEventListener('click', () => this.sendExchangeInvite());
    },

    async loadCategories() {
        try {
            const result = await ApiService.get('/jn/category/tree/get');
            if (result.code === 0 && result.data) {
                this.categories = result.data;
                this.renderCategoryChips();
            }
        } catch (error) {
            console.error('加载分类失败:', error);
        }
    },

    renderCategoryChips() {
        const container = document.getElementById('category-scroll');
        if (!container) return;

        let html = '<div class="category-chip active" data-category="">全部</div>';
        html += this.categories.slice(0, 7).map(cat =>
            `<div class="category-chip" data-category="${cat.code}">${cat.name}</div>`
        ).join('');

        container.innerHTML = html;

        container.querySelectorAll('.category-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                container.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.currentCategory = chip.dataset.category;
                this.loadMatches();
            });
        });
    },

    async loadMatches() {
        const list = document.getElementById('match-list');
        list.innerHTML = `
            <div class="loading-state">
                <div class="loading"></div>
                <span>加载中...</span>
            </div>
        `;

        try {
            const params = { page_size: 20 };
            if (this.searchKeyword) params.keyword = this.searchKeyword;
            if (this.currentCategory) params.category = this.currentCategory;

            const result = await ApiService.get('/jn/match/recommend/get', params);
            if (result.code === 0 && result.data && result.data.items) {
                this.matches = result.data.items;
                this.renderMatches();
            } else {
                this.renderEmpty();
            }
        } catch (error) {
            console.error('加载匹配失败:', error);
            this.renderEmpty();
        }
    },

    renderMatches() {
        const list = document.getElementById('match-list');
        if (!list) return;

        if (!this.matches || this.matches.length === 0) {
            this.renderEmpty();
            return;
        }

        list.innerHTML = this.matches.map(match => {
            const user = match.user || match;
            const offerSkill = match.offer_skill || {};
            const needSkill = match.need_skill || {};

            return `
            <div class="match-card" data-user-id="${user.id}">
                <div class="match-header" onclick="MatchPage.showUserDetail(${user.id})">
                    <img class="user-avatar" src="${Utils.getAvatarUrl(user.avatar, user.nickname)}" alt="${user.nickname}">
                    <div class="user-info">
                        <span class="user-name">${user.nickname || '用户'}</span>
                        <div class="credit-info">
                            <span class="credit-score" style="color: ${Utils.getCreditColor(user.credit)}">★ ${user.credit || 100}</span>
                            ${user.location ? `<span class="user-location">📍 ${user.location}</span>` : ''}
                        </div>
                    </div>
                    ${match.match_score ? `
                    <div class="match-badge">
                        <span class="match-percent">${match.match_score}%</span>
                        <span class="match-label">匹配</span>
                    </div>
                    ` : ''}
                </div>

                <div class="match-content">
                    ${offerSkill.name ? `
                    <div class="skill-row">
                        <span class="label offer">提供</span>
                        <span class="skill-name">${offerSkill.name}</span>
                        ${offerSkill.level ? `<span class="skill-level">${Utils.getLevelText(offerSkill.level)}</span>` : ''}
                    </div>
                    ` : ''}
                    ${needSkill.name ? `
                    <div class="skill-row">
                        <span class="label need">需求</span>
                        <span class="skill-name">${needSkill.name}</span>
                    </div>
                    ` : ''}
                    ${user.bio ? `<p class="user-bio">${user.bio}</p>` : ''}
                </div>

                <div class="match-actions">
                    <button class="btn btn-outline action-btn" onclick="MatchPage.showUserDetail(${user.id})">
                        查看详情
                    </button>
                    <button class="btn btn-primary action-btn" onclick="MatchPage.showExchangeModal(${user.id})">
                        发起交换
                    </button>
                </div>
            </div>
        `}).join('');
    },

    renderEmpty() {
        const list = document.getElementById('match-list');
        if (!list) return;

        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p>没有找到匹配的用户</p>
                <p class="empty-subtitle">先去发布你的技能和需求吧</p>
                <button class="btn btn-primary" onclick="Router.navigate('skill')">发布技能</button>
            </div>
        `;
    },

    async showUserDetail(userId) {
        const modal = document.getElementById('user-detail-modal');
        const content = document.getElementById('user-detail-content');

        content.innerHTML = `
            <div class="loading-state">
                <div class="loading"></div>
                <span>加载中...</span>
            </div>
        `;
        modal.classList.add('show');

        try {
            const result = await ApiService.get('/jn/user/detail/get', { user_id: userId });
            if (result.code === 0 && result.data) {
                const user = result.data;
                content.innerHTML = `
                    <div class="user-detail-header">
                        <img class="user-avatar-large" src="${Utils.getAvatarUrl(user.avatar, user.nickname)}" alt="${user.nickname}">
                        <div class="user-info-main">
                            <h2 class="user-name-large">${user.nickname || '用户'}</h2>
                            <div class="credit-display">
                                <span class="credit-star" style="color: ${Utils.getCreditColor(user.credit)}">★</span>
                                <span class="credit-value" style="color: ${Utils.getCreditColor(user.credit)}">${user.credit || 100}</span>
                                <span class="credit-label">信用分</span>
                            </div>
                            ${user.location ? `<p class="user-location">📍 ${user.location}</p>` : ''}
                        </div>
                    </div>
                    ${user.bio ? `<p class="user-bio-large">${user.bio}</p>` : ''}

                    ${user.offer_skills && user.offer_skills.length > 0 ? `
                    <div class="skill-section">
                        <h3 class="section-title-small">💪 提供的技能</h3>
                        <div class="skill-tags">
                            ${user.offer_skills.map(s => `
                                <div class="skill-tag-item offer">
                                    <span class="tag-name">${s.name}</span>
                                    ${s.level ? `<span class="tag-level">${Utils.getLevelText(s.level)}</span>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}

                    ${user.need_skills && user.need_skills.length > 0 ? `
                    <div class="skill-section">
                        <h3 class="section-title-small">📚 想学的技能</h3>
                        <div class="skill-tags">
                            ${user.need_skills.map(s => `
                                <div class="skill-tag-item need">
                                    <span class="tag-name">${s.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <button class="btn btn-primary btn-block mt-3" onclick="MatchPage.showExchangeModal(${user.id})">
                        发起交换邀请
                    </button>
                `;
            }
        } catch (error) {
            content.innerHTML = '<div class="empty-state small">加载失败</div>';
        }
    },

    selectedUserId: null,

    async showExchangeModal(userId) {
        this.selectedUserId = userId;
        document.getElementById('user-detail-modal').classList.remove('show');

        const modal = document.getElementById('exchange-modal');
        const preview = document.getElementById('match-preview');

        const match = this.matches.find(m => (m.user?.id || m.id) === userId);
        if (match) {
            const user = match.user || match;
            preview.innerHTML = `
                <div class="match-header">
                    <img class="user-avatar" src="${Utils.getAvatarUrl(user.avatar, user.nickname)}" alt="">
                    <div class="user-info">
                        <span class="user-name">${user.nickname || '用户'}</span>
                        <div class="credit-info">
                            <span class="credit-score" style="color: ${Utils.getCreditColor(user.credit)}">★ ${user.credit || 100}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        await this.loadMySkills();
        modal.classList.add('show');
    },

    async loadMySkills() {
        const offerSelect = document.getElementById('my-offer-skill');
        const needSelect = document.getElementById('my-need-skill');

        offerSelect.innerHTML = '<option value="">请选择</option>';
        needSelect.innerHTML = '<option value="">请选择</option>';

        try {
            const result = await ApiService.get('/jn/skill/my/get');
            if (result.code === 0 && result.data) {
                const offers = result.data.filter(s => s.type === 'offer');
                const needs = result.data.filter(s => s.type === 'need');

                offers.forEach(s => {
                    offerSelect.innerHTML += `<option value="${s.id}">${s.name} (${Utils.getLevelText(s.level)})</option>`;
                });

                needs.forEach(s => {
                    needSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
                });
            }
        } catch (error) {
            console.error('加载我的技能失败:', error);
        }
    },

    async sendExchangeInvite() {
        const offerSkillId = document.getElementById('my-offer-skill').value;
        const needSkillId = document.getElementById('my-need-skill').value;
        const message = document.getElementById('exchange-message').value.trim();

        if (!offerSkillId) {
            Toast.error('请选择你提供的技能');
            return;
        }

        if (!needSkillId) {
            Toast.error('请选择你想学习的技能');
            return;
        }

        const btn = document.getElementById('exchange-modal-send');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> 发送中...';

        try {
            const result = await ApiService.post('/jn/exchange/create', {
                to_user: this.selectedUserId,
                offer_skill_id: parseInt(offerSkillId),
                need_skill_id: parseInt(needSkillId),
                message
            });

            if (result.code === 0) {
                Toast.success('邀请已发送');
                document.getElementById('exchange-modal').classList.remove('show');
            } else {
                Toast.error(result.msg || '发送失败');
            }
        } catch (error) {
            Toast.error(error.message || '网络错误');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '发送邀请';
        }
    }
};

window.MatchPage = MatchPage;
