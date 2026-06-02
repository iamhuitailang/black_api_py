const DreamsPage = {
    data: {
        activeTab: 'my',
        myDreams: [],
        publicDreams: [],
        searchKeyword: '',
        filterWeather: null,
        filterTimeOfDay: null,
        page: 1,
        pageSize: 10,
        loading: false,
        hasMore: true
    },

    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="dreams-page page">
                <div class="header has-tabs">
                    <span class="header-title">我的梦境</span>
                </div>
                <div class="page has-header">
                    ${this.renderTabs()}
                    ${this.renderSearchBar()}
                    ${this.renderFilterBar()}
                    ${this.renderDreamGrid()}
                    ${this.renderCreateButton()}
                    ${Tabbar.render('dream')}
                </div>
            </div>
        `;

        this.bindEvents();
        this.loadInitialData();
    },

    renderTabs() {
        const tabs = [
            { key: 'my', label: '我的梦境', icon: '🌌' },
            { key: 'public', label: '探索梦境', icon: '🔍' }
        ];

        return `
            <div class="dreams-tabs">
                ${tabs.map(tab => `
                    <div class="tab-item ${this.data.activeTab === tab.key ? 'active' : ''}" 
                         data-tab="${tab.key}"
                         onclick="DreamsPage.switchTab('${tab.key}')">
                        <span class="tab-icon">${tab.icon}</span>
                        <span class="tab-label">${tab.label}</span>
                    </div>
                `).join('')}
                <div class="tab-indicator" style="left: ${this.data.activeTab === 'my' ? '0%' : '50%'};"></div>
            </div>
        `;
    },

    renderSearchBar() {
        return `
            <div class="search-bar">
                <div class="search-input-wrapper">
                    <span class="search-icon">🔍</span>
                    <input type="text" 
                           id="searchInput"
                           class="search-input" 
                           placeholder="搜索梦境名称、标签..."
                           value="${this.data.searchKeyword}"
                           oninput="DreamsPage.handleSearch(this.value)">
                    ${this.data.searchKeyword ? `
                        <span class="search-clear" onclick="DreamsPage.clearSearch()">✕</span>
                    ` : ''}
                </div>
            </div>
        `;
    },

    renderFilterBar() {
        const weathers = [
            { value: null, label: '全部天气', icon: '🌈' },
            { value: 'sunny', label: '晴天', icon: '☀️' },
            { value: 'cloudy', label: '多云', icon: '⛅' },
            { value: 'rainy', label: '雨天', icon: '🌧️' },
            { value: 'snowy', label: '雪天', icon: '❄️' },
            { value: 'stormy', label: '雷暴', icon: '⛈️' }
        ];

        const times = [
            { value: null, label: '全部时段', icon: '🌅' },
            { value: 'dawn', label: '黎明', icon: '🌅' },
            { value: 'day', label: '白天', icon: '☀️' },
            { value: 'dusk', label: '黄昏', icon: '🌇' },
            { value: 'night', label: '夜晚', icon: '🌙' }
        ];

        return `
            <div class="filter-bar">
                <div class="filter-scroll">
                    <div class="filter-group">
                        <span class="filter-label">天气</span>
                        <div class="filter-chips">
                            ${weathers.map(w => `
                                <span class="filter-chip ${this.data.filterWeather === w.value ? 'active' : ''}"
                                      onclick="DreamsPage.setFilter('weather', ${JSON.stringify(w.value)})">
                                    <span class="chip-icon">${w.icon}</span>
                                    <span class="chip-label">${w.label}</span>
                                </span>
                            `).join('')}
                        </div>
                    </div>
                    <div class="filter-group">
                        <span class="filter-label">昼夜</span>
                        <div class="filter-chips">
                            ${times.map(t => `
                                <span class="filter-chip ${this.data.filterTimeOfDay === t.value ? 'active' : ''}"
                                      onclick="DreamsPage.setFilter('timeOfDay', ${JSON.stringify(t.value)})">
                                    <span class="chip-icon">${t.icon}</span>
                                    <span class="chip-label">${t.label}</span>
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderDreamGrid() {
        const dreams = this.data.activeTab === 'my' ? this.data.myDreams : this.data.publicDreams;

        if (this.data.loading && dreams.length === 0) {
            return `
                <div class="dreams-grid-loading">
                    <span class="loading" style="border-color: rgba(168, 85, 247, 0.3); border-top-color: var(--primary-color);"></span>
                    <span>加载梦境中...</span>
                </div>
            `;
        }

        if (!dreams || dreams.length === 0) {
            const emptyText = this.data.activeTab === 'my' 
                ? '还没有创建任何梦境，点击右下角按钮开始创建吧！'
                : '暂无公开梦境，快去发现更多精彩梦境吧！';
            const emptyIcon = this.data.activeTab === 'my' ? '🌙' : '🔍';
            
            return `
                <div class="dreams-empty">
                    <span class="empty-icon">${emptyIcon}</span>
                    <p class="empty-text">${emptyText}</p>
                    <button class="btn btn-primary btn-sm" onclick="DreamsPage.refresh()">
                        <span>🔄</span>
                        <span>刷新</span>
                    </button>
                </div>
            `;
        }

        return `
            <div class="dreams-grid">
                ${dreams.map(dream => this.renderDreamCard(dream)).join('')}
            </div>
            ${this.data.hasMore && !this.data.loading ? `
                <div class="load-more" onclick="DreamsPage.loadMore()">
                    <span>加载更多</span>
                </div>
            ` : ''}
            ${this.data.loading && dreams.length > 0 ? `
                <div class="loading-more">
                    <span class="loading" style="border-color: rgba(168, 85, 247, 0.3); border-top-color: var(--primary-color);"></span>
                    <span>加载中...</span>
                </div>
            ` : ''}
        `;
    },

    renderDreamCard(dream) {
        const isMyDream = this.data.activeTab === 'my';
        const tags = dream.tags ? (Array.isArray(dream.tags) ? dream.tags : dream.tags.split(',')) : [];
        const isPublic = dream.is_public !== undefined ? dream.is_public : false;

        return `
            <div class="dream-card-grid">
                <div class="dream-thumbnail-wrapper" onclick="DreamsPage.openDreamDetail(${dream.id})">
                    <div class="dream-thumbnail">
                        ${dream.thumbnail ? 
                            `<img src="${dream.thumbnail}" alt="${dream.name}" loading="lazy">` : 
                            `<div class="thumbnail-placeholder">
                                ${this.getTimeIcon(dream.time_of_day)}
                            </div>`
                        }
                        <div class="dream-badges">
                            ${isPublic ? '<span class="badge badge-public">🌍 公开</span>' : '<span class="badge badge-private">🔒 私有</span>'}
                        </div>
                        <div class="dream-stats-overlay">
                            <span class="stat-item">
                                <span class="stat-icon">👁️</span>
                                <span class="stat-count">${dream.view_count || 0}</span>
                            </span>
                            <span class="stat-item">
                                <span class="stat-icon">❤️</span>
                                <span class="stat-count">${dream.like_count || 0}</span>
                            </span>
                        </div>
                    </div>
                </div>
                <div class="dream-card-content">
                    <h3 class="dream-card-title" onclick="DreamsPage.openDreamDetail(${dream.id})">${dream.name}</h3>
                    <p class="dream-card-desc">${dream.description || '暂无描述'}</p>
                    ${tags.length > 0 ? `
                        <div class="dream-card-tags">
                            ${tags.slice(0, 3).map(tag => `<span class="dream-card-tag">#${tag.trim()}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="dream-card-info">
                        ${isMyDream ? `
                            <span class="info-item">
                                <span class="info-icon">📊</span>
                                <span class="info-text">${dream.block_count || 0} 方块</span>
                            </span>
                        ` : `
                            <span class="info-item">
                                <span class="info-icon">👤</span>
                                <span class="info-text">${dream.creator_nickname || '梦境创作者'}</span>
                            </span>
                        `}
                        <span class="info-item">
                            <span class="info-icon">${this.getWeatherIcon(dream.weather)}</span>
                            <span class="info-text">${this.getTimeIcon(dream.time_of_day)}</span>
                        </span>
                    </div>
                    ${isMyDream ? this.renderMyDreamActions(dream) : this.renderPublicDreamActions(dream)}
                </div>
            </div>
        `;
    },

    renderMyDreamActions(dream) {
        const isPublic = dream.is_public !== undefined ? dream.is_public : false;
        
        return `
            <div class="dream-card-actions">
                <button class="action-btn action-edit" onclick="DreamsPage.handleEditDream(${dream.id})">
                    <span class="action-icon">✏️</span>
                    <span class="action-text">编辑</span>
                </button>
                <button class="action-btn ${isPublic ? 'action-unpublish' : 'action-publish'}" 
                        onclick="DreamsPage.handleTogglePublic(${dream.id}, ${isPublic})">
                    <span class="action-icon">${isPublic ? '🔒' : '🌍'}</span>
                    <span class="action-text">${isPublic ? '私有' : '公开'}</span>
                </button>
                <button class="action-btn action-delete" onclick="DreamsPage.handleDeleteDream(${dream.id})">
                    <span class="action-icon">🗑️</span>
                    <span class="action-text">删除</span>
                </button>
            </div>
        `;
    },

    renderPublicDreamActions(dream) {
        return `
            <div class="dream-card-actions">
                <button class="action-btn action-visit" onclick="DreamsPage.handleVisitDream(${dream.id})">
                    <span class="action-icon">🚪</span>
                    <span class="action-text">访问</span>
                </button>
                <button class="action-btn action-like" onclick="DreamsPage.handleLikeDream(${dream.id})">
                    <span class="action-icon">❤️</span>
                    <span class="action-text">点赞</span>
                </button>
            </div>
        `;
    },

    renderCreateButton() {
        if (this.data.activeTab !== 'my') return '';
        
        return `
            <button class="fab-btn" onclick="DreamsPage.handleCreateDream()">
                <span class="fab-icon">✨</span>
                <span class="fab-text">新建梦境</span>
            </button>
        `;
    },

    getWeatherIcon(weather) {
        const icons = {
            sunny: '☀️',
            cloudy: '⛅',
            rainy: '🌧️',
            snowy: '❄️',
            stormy: '⛈️',
            foggy: '🌫️'
        };
        return icons[weather] || '🌈';
    },

    getTimeIcon(time) {
        const icons = {
            dawn: '🌅',
            day: '☀️',
            dusk: '🌇',
            night: '🌙'
        };
        return icons[time] || '🌅';
    },

    bindEvents() {
    },

    async loadInitialData() {
        this.data.page = 1;
        this.data.hasMore = true;
        
        if (this.data.activeTab === 'my') {
            await this.loadMyDreams();
        } else {
            await this.loadPublicDreams();
        }
    },

    async loadMyDreams() {
        this.data.loading = true;
        this.updateDreamGrid();

        try {
            const result = await DreamService.getMyDreams(this.data.page, this.data.pageSize);
            
            if (result.code === 0 && result.data) {
                const items = result.data.items || result.data || [];
                
                if (this.data.page === 1) {
                    this.data.myDreams = items;
                } else {
                    this.data.myDreams = [...this.data.myDreams, ...items];
                }
                
                this.data.hasMore = items.length >= this.data.pageSize;
            } else {
                Toast.error(result.message || '加载梦境失败');
            }
        } catch (error) {
            console.error('加载我的梦境失败:', error);
            Toast.error('加载失败，请刷新重试');
        } finally {
            this.data.loading = false;
            this.updateDreamGrid();
        }
    },

    async loadPublicDreams() {
        this.data.loading = true;
        this.updateDreamGrid();

        try {
            const params = {
                page: this.data.page,
                pageSize: this.data.pageSize,
                keyword: this.data.searchKeyword,
                weather: this.data.filterWeather,
                timeOfDay: this.data.filterTimeOfDay
            };

            const result = await DreamService.getPublicDreams(params);
            
            if (result.code === 0 && result.data) {
                const items = result.data.items || result.data || [];
                
                if (this.data.page === 1) {
                    this.data.publicDreams = items;
                } else {
                    this.data.publicDreams = [...this.data.publicDreams, ...items];
                }
                
                this.data.hasMore = items.length >= this.data.pageSize;
            } else {
                Toast.error(result.message || '加载梦境失败');
            }
        } catch (error) {
            console.error('加载公开梦境失败:', error);
            Toast.error('加载失败，请刷新重试');
        } finally {
            this.data.loading = false;
            this.updateDreamGrid();
        }
    },

    async loadMore() {
        if (this.data.loading || !this.data.hasMore) return;
        
        this.data.page++;
        if (this.data.activeTab === 'my') {
            await this.loadMyDreams();
        } else {
            await this.loadPublicDreams();
        }
    },

    switchTab(tab) {
        if (this.data.activeTab === tab) return;
        
        this.data.activeTab = tab;
        this.data.page = 1;
        this.data.hasMore = true;
        
        this.updateTabs();
        this.updateSearchBar();
        this.updateFilterBar();
        this.updateDreamGrid();
        this.updateCreateButton();
        
        this.loadInitialData();
    },

    handleSearch: Utils.debounce(function(keyword) {
        DreamsPage.data.searchKeyword = keyword;
        DreamsPage.data.page = 1;
        DreamsPage.data.hasMore = true;
        
        if (DreamsPage.data.activeTab === 'public') {
            DreamsPage.loadPublicDreams();
        }
    }, 300),

    clearSearch() {
        this.data.searchKeyword = '';
        this.data.page = 1;
        this.data.hasMore = true;
        this.updateSearchBar();
        
        if (this.data.activeTab === 'public') {
            this.loadPublicDreams();
        }
    },

    setFilter(type, value) {
        if (type === 'weather') {
            this.data.filterWeather = value;
        } else if (type === 'timeOfDay') {
            this.data.filterTimeOfDay = value;
        }
        
        this.data.page = 1;
        this.data.hasMore = true;
        this.updateFilterBar();
        
        if (this.data.activeTab === 'public') {
            this.loadPublicDreams();
        }
    },

    refresh() {
        this.data.page = 1;
        this.data.hasMore = true;
        this.loadInitialData();
    },

    openDreamDetail(dreamId) {
        Router.navigate('dreamDetail', { id: dreamId });
    },

    handleCreateDream() {
        const name = prompt('请输入梦境名称：', '新梦境');
        if (!name || !name.trim()) {
            Toast.warning('请输入梦境名称');
            return;
        }

        const description = prompt('请输入梦境描述（可选）：', '');
        
        Loading.show();
        DreamService.createDream(name.trim(), description || '')
            .then(result => {
                Loading.hide();
                if (result.code === 0) {
                    Toast.success('梦境创建成功！');
                    this.refresh();
                } else {
                    Toast.error(result.message || '创建失败');
                }
            })
            .catch(error => {
                Loading.hide();
                console.error('创建梦境失败:', error);
                Toast.error('创建失败，请重试');
            });
    },

    handleEditDream(dreamId) {
        Router.navigate('game', { dream_id: dreamId, mode: 'edit' });
    },

    async handleTogglePublic(dreamId, currentIsPublic) {
        const confirmMsg = currentIsPublic 
            ? '确定要将此梦境设为私有吗？其他用户将无法访问。'
            : '确定要公开此梦境吗？其他用户将可以访问和访问。';
        
        if (!confirm(confirmMsg)) return;

        try {
            const result = await DreamService.togglePublic(dreamId);
            
            if (result.code === 0) {
                Toast.success(currentIsPublic ? '已设为私有' : '已设为公开');
                
                const dreamList = this.data.activeTab === 'my' ? this.data.myDreams : this.data.publicDreams;
                const dreamIndex = dreamList.findIndex(d => d.id === dreamId);
                if (dreamIndex !== -1) {
                    dreamList[dreamIndex].is_public = !currentIsPublic;
                    this.updateDreamGrid();
                }
            } else {
                Toast.error(result.message || '操作失败');
            }
        } catch (error) {
            console.error('切换公开状态失败:', error);
            Toast.error('操作失败，请重试');
        }
    },

    async handleDeleteDream(dreamId) {
        if (!confirm('确定要删除这个梦境吗？此操作不可恢复！')) return;

        try {
            const result = await DreamService.deleteDream(dreamId);
            
            if (result.code === 0) {
                Toast.success('删除成功');
                
                this.data.myDreams = this.data.myDreams.filter(d => d.id !== dreamId);
                this.updateDreamGrid();
            } else {
                Toast.error(result.message || '删除失败');
            }
        } catch (error) {
            console.error('删除梦境失败:', error);
            Toast.error('删除失败，请重试');
        }
    },

    handleVisitDream(dreamId) {
        Router.navigate('game', { dream_id: dreamId, mode: 'visit' });
    },

    async handleLikeDream(dreamId) {
        try {
            const result = await DreamService.likeDream(dreamId);
            
            if (result.code === 0) {
                Toast.success('点赞成功！');
                
                const dreamIndex = this.data.publicDreams.findIndex(d => d.id === dreamId);
                if (dreamIndex !== -1) {
                    this.data.publicDreams[dreamIndex].like_count = 
                        (this.data.publicDreams[dreamIndex].like_count || 0) + 1;
                    this.updateDreamGrid();
                }
            } else {
                Toast.error(result.message || '点赞失败');
            }
        } catch (error) {
            console.error('点赞失败:', error);
            Toast.error('点赞失败，请重试');
        }
    },

    updateTabs() {
        const tabsContainer = document.querySelector('.dreams-tabs');
        if (tabsContainer) {
            tabsContainer.outerHTML = this.renderTabs();
        }
    },

    updateSearchBar() {
        const searchBar = document.querySelector('.search-bar');
        if (searchBar) {
            searchBar.outerHTML = this.renderSearchBar();
        }
    },

    updateFilterBar() {
        const filterBar = document.querySelector('.filter-bar');
        if (filterBar) {
            filterBar.outerHTML = this.renderFilterBar();
        }
    },

    updateDreamGrid() {
        const gridContainer = document.querySelector('.dreams-grid') || 
                              document.querySelector('.dreams-empty') ||
                              document.querySelector('.dreams-grid-loading');
        if (gridContainer) {
            const parent = gridContainer.parentElement;
            const newContent = this.renderDreamGrid();
            
            const loadMore = parent.querySelector('.load-more');
            const loadingMore = parent.querySelector('.loading-more');
            
            gridContainer.outerHTML = newContent;
            
            if (loadMore) loadMore.remove();
            if (loadingMore) loadingMore.remove();
        }
    },

    updateCreateButton() {
        const oldFab = document.querySelector('.fab-btn');
        const newFabHtml = this.renderCreateButton();
        
        if (oldFab && newFabHtml) {
            oldFab.outerHTML = newFabHtml;
        } else if (oldFab && !newFabHtml) {
            oldFab.remove();
        } else if (!oldFab && newFabHtml) {
            const page = document.querySelector('.dreams-page .page');
            if (page) {
                page.insertAdjacentHTML('beforeend', newFabHtml);
            }
        }
    }
};

window.DreamsPage = DreamsPage;
