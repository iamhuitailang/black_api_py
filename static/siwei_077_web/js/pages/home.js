const HomePage = {
    page: 1,
    keyword: '',
    maps: [],

    render() {
        const app = document.getElementById('app');
        const user = AuthService.getCurrentUser();
        app.innerHTML = `
            <div class="home-page">
                <div class="header">
                    <span class="header-title">🧠 思维导图</span>
                    <div class="header-action" id="user-menu">
                        <span>${user ? (user.nickname || user.username) : ''}</span>
                    </div>
                </div>
                <div class="search-bar">
                    <div class="search-input-wrapper">
                        <span class="search-icon">🔍</span>
                        <input type="text" class="search-input" id="search-input" placeholder="搜索思维导图...">
                    </div>
                    <button class="search-btn" id="search-btn">搜索</button>
                </div>
                <div class="home-actions">
                    <button class="btn btn-primary" id="create-map-btn" style="flex:1;">+ 新建导图</button>
                    <button class="btn btn-outline" id="template-btn" style="flex:1;margin-left:8px;">📋 模板库</button>
                </div>
                <div class="section-title">我的导图</div>
                <div id="map-list" class="map-list"></div>
                <div id="load-more" class="pull-refresh hidden">加载更多</div>
                <div class="user-dropdown hidden" id="user-dropdown">
                    <div class="dropdown-item" id="settings-btn">⚙️ 设置</div>
                    <div class="dropdown-item" id="logout-btn">🚪 退出登录</div>
                </div>
            </div>
        `;
        this.bindEvents();
        this.loadMaps();
    },

    bindEvents() {
        document.getElementById('create-map-btn').addEventListener('click', async () => {
            Utils.showLoading();
            try {
                const result = await MindmapService.createMap('未命名思维导图');
                if (result.code === 0) {
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

        document.getElementById('template-btn').addEventListener('click', () => {
            Router.navigate('templates');
        });

        document.getElementById('search-btn').addEventListener('click', () => {
            this.keyword = document.getElementById('search-input').value.trim();
            this.page = 1;
            this.loadMaps();
        });

        document.getElementById('search-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('search-btn').click();
        });

        document.getElementById('user-menu').addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('user-dropdown');
            dropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', () => {
            const dropdown = document.getElementById('user-dropdown');
            if (dropdown) dropdown.classList.add('hidden');
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            Router.navigate('settings');
        });

        document.getElementById('logout-btn').addEventListener('click', async () => {
            await AuthService.logout();
            Router.navigate('login');
        });

        document.getElementById('load-more').addEventListener('click', () => {
            this.page++;
            this.loadMaps(true);
        });
    },

    async loadMaps(append = false) {
        try {
            const result = await MindmapService.getMyMaps(this.page, 10, this.keyword);
            if (result.code === 0) {
                const items = result.data.items || [];
                if (!append) this.maps = items;
                else this.maps = this.maps.concat(items);
                this.renderMapList();
                const loadMore = document.getElementById('load-more');
                if (result.data.page < result.data.total_pages) {
                    loadMore.classList.remove('hidden');
                } else {
                    loadMore.classList.add('hidden');
                }
            }
        } catch (e) {
            console.error(e);
        }
    },

    renderMapList() {
        const container = document.getElementById('map-list');
        if (!container) return;
        if (this.maps.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">暂无思维导图，点击新建开始创作</div></div>';
            return;
        }
        container.innerHTML = this.maps.map(map => `
            <div class="map-item" data-id="${map.id}">
                <div class="map-item-info">
                    <div class="map-item-title">${map.title || '未命名思维导图'}</div>
                    <div class="map-item-meta">${Utils.formatDate(map.updated_at)}</div>
                </div>
                <div class="map-item-actions">
                    <button class="btn btn-sm btn-outline map-edit-btn" data-id="${map.id}">编辑</button>
                    <button class="btn btn-sm btn-danger map-delete-btn" data-id="${map.id}">删除</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.map-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                Router.navigate('editor', { mapId: parseInt(btn.dataset.id) });
            });
        });

        container.querySelectorAll('.map-delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (!confirm('确定要删除这个思维导图吗？')) return;
                Utils.showLoading();
                try {
                    const result = await MindmapService.deleteMap(parseInt(btn.dataset.id));
                    if (result.code === 0) {
                        Utils.showToast('删除成功');
                        this.page = 1;
                        this.loadMaps();
                    } else {
                        Utils.showToast(result.msg || '删除失败');
                    }
                } catch (e) {
                    Utils.showToast('删除失败');
                } finally {
                    Utils.hideLoading();
                }
            });
        });
    }
};
