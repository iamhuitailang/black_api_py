const SkillPage = {
    currentTab: 'my',
    skills: { offer: [], need: [] },
    categories: [],
    isLoading: false,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page-container">
                <header class="page-header">
                    <div class="header-left">
                        <div class="header-logo">⚡</div>
                        <h1>我的技能</h1>
                    </div>
                    <div class="header-right">
                        <button class="header-btn" id="add-skill-btn">
                            <span class="icon">+</span>
                        </button>
                    </div>
                </header>

                <div class="tab-header">
                    <div class="tab-item active" data-tab="my">我的技能</div>
                    <div class="tab-item" data-tab="all">全部技能</div>
                </div>

                <div class="content-scroll">
                    <div id="tab-my" class="tab-content">
                        <div class="skill-type-tabs">
                            <div class="type-tab active" data-type="offer">
                                <span class="type-icon">💪</span>
                                <span>我能提供</span>
                            </div>
                            <div class="type-tab" data-type="need">
                                <span class="type-icon">📚</span>
                                <span>我想学的</span>
                            </div>
                        </div>

                        <div class="skill-list" id="my-skills-list">
                            <div class="loading-state">
                                <div class="loading"></div>
                                <span>加载中...</span>
                            </div>
                        </div>
                    </div>

                    <div id="tab-all" class="tab-content hidden">
                        <div class="search-box-inline">
                            <span class="search-icon">🔍</span>
                            <input type="text" id="search-input" class="form-control" placeholder="搜索技能名称...">
                        </div>

                        <div class="filter-row">
                            <div class="filter-item active" data-filter="all">全部</div>
                            <div class="filter-item" data-filter="offer">提供</div>
                            <div class="filter-item" data-filter="need">需求</div>
                        </div>

                        <div class="skill-list" id="all-skills-list">
                            <div class="empty-state small">点击上方搜索框开始搜索</div>
                        </div>
                    </div>
                </div>

                <nav class="bottom-nav">
                    <div class="nav-item" data-route="home">
                        <span class="nav-icon">🏠</span>
                        <span class="nav-label">首页</span>
                    </div>
                    <div class="nav-item active" data-route="skill">
                        <span class="nav-icon">⚡</span>
                        <span class="nav-label">技能</span>
                    </div>
                    <div class="nav-item add-btn" id="fab-add-btn">
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

            <div class="modal-overlay" id="skill-modal">
                <div class="modal modal-bottom">
                    <div class="modal-header">
                        <h3 class="modal-title" id="modal-title">发布技能</h3>
                        <button class="modal-close" id="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="skill-form">
                            <div class="form-group">
                                <label class="form-label">技能类型</label>
                                <div class="radio-group" id="skill-type-group">
                                    <label class="radio-item active">
                                        <input type="radio" name="skill_type" value="offer" checked>
                                        <span>我能提供</span>
                                    </label>
                                    <label class="radio-item">
                                        <input type="radio" name="skill_type" value="need">
                                        <span>我想学的</span>
                                    </label>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">技能名称 <span class="required">*</span></label>
                                <input type="text" id="skill-name" class="form-control" placeholder="如：Python、UI设计">
                            </div>

                            <div class="form-group">
                                <label class="form-label">分类</label>
                                <select id="skill-category" class="form-control">
                                    <option value="">请选择分类</option>
                                </select>
                            </div>

                            <div class="form-group" id="level-group">
                                <label class="form-label">熟练程度</label>
                                <select id="skill-level" class="form-control">
                                    <option value="beginner">初级</option>
                                    <option value="intermediate" selected>中级</option>
                                    <option value="advanced">高级</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label">描述</label>
                                <textarea id="skill-desc" class="form-control" placeholder="详细描述一下你的技能..." rows="3"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="modal-cancel">取消</button>
                        <button type="button" class="btn btn-primary" id="modal-save">保存</button>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        await this.loadCategories();
        await this.loadMySkills();
    },

    bindEvents() {
        const navItems = document.querySelectorAll('.bottom-nav .nav-item[data-route]');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                if (route) Router.navigate(route);
            });
        });

        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });

        document.querySelectorAll('.type-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTypeTab(tab.dataset.type);
            });
        });

        document.querySelectorAll('.filter-item').forEach(filter => {
            filter.addEventListener('click', () => {
                this.switchFilter(filter.dataset.filter);
            });
        });

        document.getElementById('add-skill-btn').addEventListener('click', () => this.showAddModal());
        document.getElementById('fab-add-btn').addEventListener('click', () => this.showAddModal());

        document.getElementById('modal-close').addEventListener('click', () => this.hideModal());
        document.getElementById('modal-cancel').addEventListener('click', () => this.hideModal());

        document.querySelectorAll('#skill-type-group .radio-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('#skill-type-group .radio-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                item.querySelector('input').checked = true;

                const levelGroup = document.getElementById('level-group');
                const type = item.querySelector('input').value;
                levelGroup.style.display = type === 'offer' ? 'block' : 'none';
            });
        });

        document.getElementById('modal-save').addEventListener('click', () => this.saveSkill());

        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.searchSkills();
            }, 300));
        }
    },

    switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.tab-item').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('hidden', c.id !== `tab-${tab}`));
    },

    switchTypeTab(type) {
        document.querySelectorAll('.type-tab').forEach(t => t.classList.toggle('active', t.dataset.type === type));
        this.renderMySkills(type);
    },

    switchFilter(filter) {
        document.querySelectorAll('.filter-item').forEach(f => f.classList.toggle('active', f.dataset.filter === filter));
        this.searchSkills(filter);
    },

    async loadCategories() {
        try {
            const result = await ApiService.get('/jn/category/tree/get');
            if (result.code === 0 && result.data) {
                this.categories = result.data;
                this.renderCategoryOptions();
            }
        } catch (error) {
            console.error('加载分类失败:', error);
        }
    },

    renderCategoryOptions() {
        const select = document.getElementById('skill-category');
        if (!select) return;

        const options = this.categories.map(cat => {
            let html = `<option value="${cat.code}">${cat.name}</option>`;
            if (cat.children && cat.children.length > 0) {
                html += cat.children.map(child =>
                    `<option value="${child.code}">&nbsp;&nbsp;${child.name}</option>`
                ).join('');
            }
            return html;
        }).join('');

        select.innerHTML = '<option value="">请选择分类</option>' + options;
    },

    async loadMySkills() {
        try {
            const result = await ApiService.get('/jn/skill/my/get');
            if (result.code === 0 && result.data) {
                this.skills.offer = result.data.filter(s => s.type === 'offer');
                this.skills.need = result.data.filter(s => s.type === 'need');
                this.renderMySkills('offer');
            }
        } catch (error) {
            console.error('加载我的技能失败:', error);
            this.renderMySkills('offer');
        }
    },

    renderMySkills(type) {
        const list = document.getElementById('my-skills-list');
        if (!list) return;

        const skills = this.skills[type] || [];

        if (skills.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">${type === 'offer' ? '💪' : '📚'}</div>
                    <p>${type === 'offer' ? '还没有发布技能' : '还没有发布需求'}</p>
                    <button class="btn btn-primary" onclick="SkillPage.showAddModal()">${type === 'offer' ? '发布技能' : '发布需求'}</button>
                </div>
            `;
            return;
        }

        list.innerHTML = skills.map(skill => `
            <div class="skill-card" data-id="${skill.id}">
                <div class="skill-header">
                    <span class="skill-badge ${skill.type}">${Utils.getTypeText(skill.type)}</span>
                    <div class="skill-actions">
                        <button class="action-btn edit-btn" data-id="${skill.id}">✏️</button>
                        <button class="action-btn delete-btn" data-id="${skill.id}">🗑️</button>
                    </div>
                </div>
                <h3 class="skill-name">${skill.name}</h3>
                ${skill.description ? `<p class="skill-desc">${skill.description}</p>` : ''}
                <div class="skill-footer">
                    ${skill.category ? `<span class="skill-meta">🏷️ ${skill.category}</span>` : ''}
                    ${skill.level ? `<span class="skill-meta">📊 ${Utils.getLevelText(skill.level)}</span>` : ''}
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editSkill(btn.dataset.id, skills);
            });
        });

        list.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteSkill(btn.dataset.id);
            });
        });
    },

    async searchSkills(filter = 'all') {
        const keyword = document.getElementById('search-input').value.trim();
        const list = document.getElementById('all-skills-list');

        if (!keyword && filter === 'all') {
            list.innerHTML = '<div class="empty-state small">输入关键词搜索技能</div>';
            return;
        }

        try {
            const params = {};
            if (keyword) params.keyword = keyword;
            if (filter !== 'all') params.type = filter;

            const result = await ApiService.get('/jn/skill/search/get', params);
            if (result.code === 0 && result.data) {
                this.renderSearchResults(result.data);
            }
        } catch (error) {
            list.innerHTML = '<div class="empty-state small">搜索失败，请重试</div>';
        }
    },

    renderSearchResults(skills) {
        const list = document.getElementById('all-skills-list');
        if (!list) return;

        if (!skills || skills.length === 0) {
            list.innerHTML = '<div class="empty-state small">没有找到相关技能</div>';
            return;
        }

        list.innerHTML = skills.map(skill => `
            <div class="skill-card-mini clickable" onclick="Router.navigate('match')">
                <div class="match-header">
                    <img class="user-avatar" src="${Utils.getAvatarUrl(skill.user_avatar, skill.user_nickname)}" alt="">
                    <div class="user-info">
                        <span class="user-name">${skill.user_nickname || '用户'}</span>
                        <div class="credit-info">
                            <span class="credit-score" style="color: ${Utils.getCreditColor(skill.user_credit)}">★ ${skill.user_credit || 100}</span>
                        </div>
                    </div>
                </div>
                <div class="skill-info-row">
                    <span class="skill-badge ${skill.type}">${Utils.getTypeText(skill.type)}</span>
                    <span class="skill-name">${skill.name}</span>
                </div>
                ${skill.category ? `<span class="skill-meta small">🏷️ ${skill.category}</span>` : ''}
            </div>
        `).join('');
    },

    showAddModal() {
        document.getElementById('modal-title').textContent = '发布技能';
        document.getElementById('skill-form').reset();
        document.querySelectorAll('#skill-type-group .radio-item').forEach((item, index) => {
            item.classList.toggle('active', index === 0);
            item.querySelector('input').checked = index === 0;
        });
        document.getElementById('level-group').style.display = 'block';
        document.getElementById('skill-modal').classList.add('show');
    },

    editSkill(id, skills) {
        const skill = skills.find(s => s.id === parseInt(id));
        if (!skill) return;

        document.getElementById('modal-title').textContent = '编辑技能';

        const typeRadios = document.querySelectorAll('#skill-type-group .radio-item');
        typeRadios.forEach(item => {
            const isActive = item.querySelector('input').value === skill.type;
            item.classList.toggle('active', isActive);
            item.querySelector('input').checked = isActive;
        });

        document.getElementById('level-group').style.display = skill.type === 'offer' ? 'block' : 'none';
        document.getElementById('skill-name').value = skill.name || '';
        document.getElementById('skill-category').value = skill.category || '';
        document.getElementById('skill-level').value = skill.level || 'intermediate';
        document.getElementById('skill-desc').value = skill.description || '';

        document.getElementById('skill-modal').classList.add('show');
    },

    hideModal() {
        document.getElementById('skill-modal').classList.remove('show');
    },

    async saveSkill() {
        const type = document.querySelector('input[name="skill_type"]:checked').value;
        const name = document.getElementById('skill-name').value.trim();
        const category = document.getElementById('skill-category').value;
        const level = document.getElementById('skill-level').value;
        const description = document.getElementById('skill-desc').value.trim();

        if (!name) {
            Toast.error('请输入技能名称');
            return;
        }

        const btn = document.getElementById('modal-save');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> 保存中...';

        try {
            const data = {
                name,
                skill_type: type,
                category,
                description
            };
            if (type === 'offer') {
                data.level = level;
            }

            const result = await ApiService.post('/jn/skill/create', data);

            if (result.code === 0) {
                Toast.success('保存成功');
                this.hideModal();
                await this.loadMySkills();
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

    async deleteSkill(id) {
        if (!confirm('确定要删除这个技能吗？')) return;

        try {
            const result = await ApiService.post(`/jn/skill/delete?skill_id=${id}`);
            if (result.code === 0) {
                Toast.success('删除成功');
                await this.loadMySkills();
            } else {
                Toast.error(result.msg || '删除失败');
            }
        } catch (error) {
            Toast.error(error.message || '网络错误');
        }
    }
};

window.SkillPage = SkillPage;
