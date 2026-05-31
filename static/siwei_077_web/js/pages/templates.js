const TemplatesPage = {
    categories: [],
    templates: [],
    selectedCategory: '',

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="templates-page">
                <div class="header">
                    <div class="header-back" id="back-btn">←</div>
                    <span class="header-title">模板库</span>
                </div>
                <div class="category-tabs" id="category-tabs"></div>
                <div class="template-grid" id="template-grid"></div>
            </div>
        `;
        this.bindEvents();
        await this.loadCategories();
        await this.loadTemplates();
    },

    bindEvents() {
        document.getElementById('back-btn').addEventListener('click', () => {
            Router.navigate('home');
        });
    },

    async loadCategories() {
        try {
            const result = await MindmapService.getTemplateCategories();
            if (result.code === 0) {
                this.categories = result.data || [];
                this.renderCategories();
            }
        } catch (e) {}
    },

    async loadTemplates() {
        try {
            const result = await MindmapService.getTemplateList(1, 50, this.selectedCategory || undefined);
            if (result.code === 0) {
                this.templates = result.data.items || [];
                this.renderTemplates();
            }
        } catch (e) {}
    },

    renderCategories() {
        const tabs = document.getElementById('category-tabs');
        tabs.innerHTML = `<div class="category-tab ${!this.selectedCategory ? 'active' : ''}" data-cat="">全部</div>` +
            this.categories.map(c => `
                <div class="category-tab ${this.selectedCategory === c.code ? 'active' : ''}" data-cat="${c.code}">
                    ${c.icon} ${c.name}
                </div>
            `).join('');

        tabs.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', async () => {
                this.selectedCategory = tab.dataset.cat;
                tabs.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                await this.loadTemplates();
            });
        });
    },

    renderTemplates() {
        const grid = document.getElementById('template-grid');
        if (this.templates.length === 0) {
            grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">暂无模板</div></div>';
            return;
        }
        grid.innerHTML = this.templates.map(t => `
            <div class="template-card" data-id="${t.id}">
                <div class="template-preview">
                    <div style="font-size:28px;">🧠</div>
                </div>
                <div class="template-info">
                    <div class="template-name">${t.name}</div>
                    <div class="template-desc">${t.description || ''}</div>
                    <div class="template-meta">使用 ${t.use_count || 0} 次</div>
                </div>
            </div>
        `).join('');

        grid.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', async () => {
                const templateId = parseInt(card.dataset.id);
                const title = this.templates.find(t => t.id === templateId)?.name || '';
                if (!confirm(`使用模板「${title}」创建新的思维导图？`)) return;
                Utils.showLoading();
                try {
                    const result = await MindmapService.createMapFromTemplate(templateId);
                    if (result.code === 0) {
                        Utils.showToast('创建成功');
                        Router.navigate('editor', { mapId: result.data.id });
                    } else {
                        Utils.showToast(result.msg || '创建失败');
                    }
                } catch (e) {
                    Utils.showToast('创建失败');
                } finally {
                    Utils.hideLoading();
                }
            });
        });
    }
};
