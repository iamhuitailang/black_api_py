const ProfilePage = {
    user: null,
    userSkills: { offer: [], need: [] },

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page-container">
                <header class="page-header">
                    <div class="header-left">
                        <div class="header-logo">👤</div>
                        <h1>我的</h1>
                    </div>
                    <div class="header-right">
                        <button class="header-btn" onclick="Router.navigate('settings')">
                            <span class="icon">⚙️</span>
                        </button>
                    </div>
                </header>

                <div class="content-scroll">
                    <div class="profile-card" id="profile-card">
                        <div class="loading-state">
                            <div class="loading"></div>
                            <span>加载中...</span>
                        </div>
                    </div>

                    <div class="menu-list">
                        <div class="menu-item" onclick="Router.navigate('skill')">
                            <span class="menu-icon">⚡</span>
                            <span class="menu-text">我的技能</span>
                            <span class="menu-arrow">›</span>
                        </div>
                        <div class="menu-item" onclick="Router.navigate('exchange')">
                            <span class="menu-icon">🔄</span>
                            <span class="menu-text">我的交换</span>
                            <span class="menu-arrow">›</span>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-header">
                            <h2 class="section-title">我的技能标签</h2>
                        </div>
                        <div id="profile-skills">
                            <div class="loading-state small">
                                <div class="loading"></div>
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-header">
                            <h2 class="section-title">我的数据</h2>
                        </div>
                        <div class="stats-grid" id="profile-stats">
                            <div class="stat-card-small">
                                <div class="stat-value">--</div>
                                <div class="stat-label">发布技能</div>
                            </div>
                            <div class="stat-card-small">
                                <div class="stat-value">--</div>
                                <div class="stat-label">完成交换</div>
                            </div>
                            <div class="stat-card-small">
                                <div class="stat-value">--</div>
                                <div class="stat-label">平均评分</div>
                            </div>
                        </div>
                    </div>

                    <button class="btn btn-secondary btn-block logout-btn" id="logout-btn">
                        退出登录
                    </button>
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
                    <div class="nav-item active" data-route="profile">
                        <span class="nav-icon">👤</span>
                        <span class="nav-label">我的</span>
                    </div>
                </nav>
            </div>

            <div class="modal-overlay" id="edit-profile-modal">
                <div class="modal modal-bottom">
                    <div class="modal-header">
                        <h3 class="modal-title">编辑资料</h3>
                        <button class="modal-close" id="edit-modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="edit-profile-form">
                            <div class="form-group">
                                <label class="form-label">昵称</label>
                                <input type="text" id="edit-nickname" class="form-control" placeholder="请输入昵称" maxlength="20">
                            </div>
                            <div class="form-group">
                                <label class="form-label">个人简介</label>
                                <textarea id="edit-bio" class="form-control" placeholder="介绍一下自己..." rows="3" maxlength="200"></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">所在地</label>
                                <input type="text" id="edit-location" class="form-control" placeholder="如：北京、上海" maxlength="50">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="edit-modal-cancel">取消</button>
                        <button type="button" class="btn btn-primary" id="edit-modal-save">保存</button>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        await this.loadProfile();
    },

    bindEvents() {
        const navItems = document.querySelectorAll('.bottom-nav .nav-item[data-route]');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                if (route) Router.navigate(route);
            });
        });

        document.getElementById('logout-btn').addEventListener('click', () => this.logout());

        document.getElementById('edit-modal-close').addEventListener('click', () => {
            document.getElementById('edit-profile-modal').classList.remove('show');
        });
        document.getElementById('edit-modal-cancel').addEventListener('click', () => {
            document.getElementById('edit-profile-modal').classList.remove('show');
        });
        document.getElementById('edit-modal-save').addEventListener('click', () => this.saveProfile());
    },

    async loadProfile() {
        try {
            const result = await AuthService.getCurrentUser();
            if (result.code === 0 && result.data) {
                this.user = result.data;
                this.renderProfile();
                await this.loadUserSkills();
                await this.loadUserStats();
            }
        } catch (error) {
            console.error('加载用户信息失败:', error);
        }
    },

    renderProfile() {
        const card = document.getElementById('profile-card');
        if (!card || !this.user) return;

        card.innerHTML = `
            <div class="profile-header">
                <img class="profile-avatar" src="${Utils.getAvatarUrl(this.user.avatar, this.user.nickname)}" alt="${this.user.nickname}">
                <div class="profile-info">
                    <h2 class="profile-name">${this.user.nickname || '用户'}</h2>
                    <p class="profile-phone">${this.maskPhone(this.user.phone)}</p>
                    ${this.user.bio ? `<p class="profile-bio">${this.user.bio}</p>` : ''}
                    ${this.user.location ? `<p class="profile-location">📍 ${this.user.location}</p>` : ''}
                </div>
                <button class="edit-btn" onclick="ProfilePage.showEditModal()">
                    ✏️
                </button>
            </div>

            <div class="credit-section">
                <div class="credit-label">信用分</div>
                <div class="credit-display-large">
                    <span class="credit-star" style="color: ${Utils.getCreditColor(this.user.credit)}">★</span>
                    <span class="credit-value-large" style="color: ${Utils.getCreditColor(this.user.credit)}">${this.user.credit || 100}</span>
                </div>
                <div class="credit-bar-large">
                    <div class="credit-bar-fill-large" style="width: ${Math.min(this.user.credit || 100, 100)}%; background: ${Utils.getCreditColor(this.user.credit)}"></div>
                </div>
            </div>
        `;
    },

    maskPhone(phone) {
        if (!phone || phone.length < 11) return phone;
        return phone.slice(0, 3) + '****' + phone.slice(7);
    },

    async loadUserSkills() {
        try {
            const result = await ApiService.get('/jn/skill/my/get');
            if (result.code === 0 && result.data) {
                this.userSkills.offer = result.data.filter(s => s.type === 'offer');
                this.userSkills.need = result.data.filter(s => s.type === 'need');
                this.renderSkills();
            }
        } catch (error) {
            console.error('加载用户技能失败:', error);
        }
    },

    renderSkills() {
        const container = document.getElementById('profile-skills');
        if (!container) return;

        const hasSkills = this.userSkills.offer.length > 0 || this.userSkills.need.length > 0;

        if (!hasSkills) {
            container.innerHTML = `
                <div class="empty-state small">
                    <p>还没有发布技能</p>
                    <button class="btn btn-primary btn-sm" onclick="Router.navigate('skill')">发布技能</button>
                </div>
            `;
            return;
        }

        let html = '';

        if (this.userSkills.offer.length > 0) {
            html += `
                <div class="skill-group">
                    <div class="skill-group-title">
                        <span class="badge-small offer">提供</span>
                        <span>我能提供的技能</span>
                    </div>
                    <div class="skill-tags-inline">
                        ${this.userSkills.offer.map(s => `
                            <span class="skill-tag-item offer">
                                ${s.name}
                                ${s.level ? `<span class="level-small">${Utils.getLevelText(s.level)}</span>` : ''}
                            </span>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if (this.userSkills.need.length > 0) {
            html += `
                <div class="skill-group">
                    <div class="skill-group-title">
                        <span class="badge-small need">需求</span>
                        <span>我想学的技能</span>
                    </div>
                    <div class="skill-tags-inline">
                        ${this.userSkills.need.map(s => `
                            <span class="skill-tag-item need">${s.name}</span>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    },

    async loadUserStats() {
        const statsContainer = document.getElementById('profile-stats');
        if (!statsContainer) return;

        let published = this.userSkills.offer.length + this.userSkills.need.length;
        let completed = 0;
        let avgRating = 0;

        try {
            const exchangeResult = await ApiService.get('/jn/exchange/my/get');
            if (exchangeResult.code === 0 && exchangeResult.data) {
                completed = exchangeResult.data.filter(e => e.status === 'completed').length;
            }

            const reviewResult = await ApiService.get('/jn/review/rating/get', { user_id: this.user?.id });
            if (reviewResult.code === 0 && reviewResult.data) {
                avgRating = reviewResult.data.avg_score || 0;
            }
        } catch (error) {
            console.error('加载统计数据失败:', error);
        }

        statsContainer.innerHTML = `
            <div class="stat-card-small">
                <div class="stat-value">${published}</div>
                <div class="stat-label">发布技能</div>
            </div>
            <div class="stat-card-small">
                <div class="stat-value">${completed}</div>
                <div class="stat-label">完成交换</div>
            </div>
            <div class="stat-card-small">
                <div class="stat-value">${avgRating > 0 ? avgRating.toFixed(1) : '--'}</div>
                <div class="stat-label">平均评分</div>
            </div>
        `;
    },

    showEditModal() {
        if (!this.user) return;

        document.getElementById('edit-nickname').value = this.user.nickname || '';
        document.getElementById('edit-bio').value = this.user.bio || '';
        document.getElementById('edit-location').value = this.user.location || '';

        document.getElementById('edit-profile-modal').classList.add('show');
    },

    async saveProfile() {
        const nickname = document.getElementById('edit-nickname').value.trim();
        const bio = document.getElementById('edit-bio').value.trim();
        const location = document.getElementById('edit-location').value.trim();

        if (!nickname) {
            Toast.error('请输入昵称');
            return;
        }

        const btn = document.getElementById('edit-modal-save');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> 保存中...';

        try {
            const result = await AuthService.updateProfile({
                nickname,
                bio,
                location
            });

            if (result.code === 0) {
                Toast.success('保存成功');
                document.getElementById('edit-profile-modal').classList.remove('show');
                await this.loadProfile();
            } else {
                Toast.error(result.msg || '保存失败');
            }
        } catch (error) {
            Toast.error(error.message || '网络错误');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '保存';
        }
    },

    async logout() {
        if (!confirm('确定要退出登录吗？')) return;

        try {
            await AuthService.logout();
            Toast.success('已退出登录');
            Router.navigate('login');
        } catch (error) {
            Storage.removeToken();
            Storage.removeUser();
            Router.navigate('login');
        }
    }
};

window.ProfilePage = ProfilePage;
