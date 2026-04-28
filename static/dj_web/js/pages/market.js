const MarketPage = {
    currentPage: 1,
    pageSize: 10,
    total: 0,
    items: [],
    isLoading: false,
    currentFilter: 'all',
    userFavorites: new Set(),
    
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="app-container">
                <div class="header">
                    <div class="header-title">🏪 赶大集</div>
                </div>
                
                <div class="main-content" id="mainContent">
                    <div class="search-bar mb-2">
                        <span class="search-icon">🔍</span>
                        <input type="text" id="searchInput" placeholder="搜索集市名称..." onkeypress="MarketPage.handleSearchKeyPress(event)">
                    </div>
                    
                    <div class="filter-bar" id="filterBar">
                        <div class="filter-chip active" data-filter="all">全部</div>
                        <div class="filter-chip" data-filter="today">今天</div>
                        <div class="filter-chip" data-filter="tomorrow">明天</div>
                    </div>
                    
                    <div id="marketList">
                        <div class="loading-container">
                            <div class="loading"></div>
                        </div>
                    </div>
                    
                    <div id="pagination" class="mt-2" style="display:none;"></div>
                </div>
                
                ${this.renderTabBar()}
            </div>
        `;
        
        this.bindEvents();
        this.loadData();
    },
    
    renderTabBar() {
        return `
            <div class="tab-bar">
                <div class="tab-item active" data-route="market">
                    <span class="tab-icon">🏠</span>
                    <span class="tab-label">集市</span>
                </div>
                <div class="tab-item" data-route="favorite">
                    <span class="tab-icon">❤</span>
                    <span class="tab-label">收藏</span>
                </div>
                <div class="tab-item" data-route="profile">
                    <span class="tab-icon">👤</span>
                    <span class="tab-label">我的</span>
                </div>
            </div>
        `;
    },
    
    bindEvents() {
        const filterBar = document.getElementById('filterBar');
        if (filterBar) {
            filterBar.addEventListener('click', (e) => {
                const chip = e.target.closest('.filter-chip');
                if (chip) {
                    filterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    
                    const filter = chip.dataset.filter;
                    this.currentFilter = filter;
                    this.currentPage = 1;
                    this.loadData();
                }
            });
        }
    },
    
    handleSearchKeyPress(e) {
        if (e.key === 'Enter') {
            this.currentPage = 1;
            this.loadData();
        }
    },
    
    async loadData() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        const marketList = document.getElementById('marketList');
        
        if (this.currentPage === 1) {
            marketList.innerHTML = `
                <div class="loading-container">
                    <div class="loading"></div>
                </div>
            `;
        }
        
        try {
            let result;
            const keyword = document.getElementById('searchInput')?.value.trim() || '';
            
            switch (this.currentFilter) {
                case 'today':
                    result = await MarketService.getToday();
                    break;
                case 'tomorrow':
                    result = await MarketService.getTomorrow();
                    break;
                default:
                    result = await MarketService.getList(this.currentPage, this.pageSize, 1, keyword);
            }
            
            if (result.code === 0) {
                const items = result.data?.items || result.data || [];
                this.total = result.data?.total || items.length;
                
                if (this.currentPage === 1) {
                    this.items = items;
                } else {
                    this.items = [...this.items, ...items];
                }
                
                await this.loadUserFavorites();
                this.renderList();
                this.updatePagination();
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (error) {
            console.error('加载集市失败:', error);
            Toast.error(error.message || '网络错误');
            if (this.currentPage === 1) {
                marketList.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">⚠️</div>
                        <p>加载失败，请重试</p>
                    </div>
                `;
            }
        } finally {
            this.isLoading = false;
        }
    },
    
    async loadUserFavorites() {
        try {
            const result = await FavoriteService.getList();
            if (result.code === 0 && result.data) {
                this.userFavorites = new Set(result.data.map(item => item.market_id || item.id));
            }
        } catch (error) {
            console.error('加载收藏列表失败:', error);
        }
    },
    
    renderList() {
        const marketList = document.getElementById('marketList');
        
        if (this.items.length === 0) {
            marketList.innerHTML = `
                <div class="empty-state">
                    <div class="icon">🏪</div>
                    <p>暂无集市数据</p>
                </div>
            `;
            return;
        }
        
        const statusMap = {
            1: { text: '营业中', class: 'badge-success' },
            2: { text: '暂停', class: 'badge-warning' },
            3: { text: '关闭', class: 'badge-danger' }
        };
        
        const listHtml = this.items.map(item => {
            const isFavorited = this.userFavorites.has(item.id);
            const status = statusMap[item.status] || statusMap[1];
            
            return `
                <div class="market-card" data-id="${item.id}">
                    <div class="market-card-header">
                        <div class="market-card-title">
                            <h3>${item.name || '未命名集市'}</h3>
                            <span class="badge ${status.class}">${status.text}</span>
                        </div>
                        <span class="market-card-favorite ${isFavorited ? 'active' : ''}" data-id="${item.id}">
                            ${isFavorited ? '❤' : '🤍'}
                        </span>
                    </div>
                    
                    <div class="market-card-body">
                        <div class="market-card-info">
                            ${item.location ? `
                            <div class="market-info-item">
                                <span class="icon">📍</span>
                                <span>${item.location}</span>
                            </div>
                            ` : ''}
                            
                            ${item.open_time || item.close_time ? `
                            <div class="market-info-item">
                                <span class="icon">⏰</span>
                                <span>${item.open_time || '--'} - ${item.close_time || '--'}</span>
                            </div>
                            ` : ''}
                            
                            ${item.lunar_dates ? `
                            <div class="market-info-item">
                                <span class="icon">📅</span>
                                <span>农历: ${item.lunar_dates}</span>
                            </div>
                            ` : ''}
                            
                            ${item.solar_dates ? `
                            <div class="market-info-item">
                                <span class="icon">📆</span>
                                <span>公历: ${item.solar_dates}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="market-card-footer">
                        <div class="market-tags">
                            ${item.scale ? `<span class="market-tag">${item.scale}</span>` : ''}
                            ${item.booth_count ? `<span class="market-tag">约${item.booth_count}个摊位</span>` : ''}
                            ${item.hot ? `<span class="market-tag">热度: ${item.hot}</span>` : ''}
                        </div>
                        <div class="market-rating">
                            <span class="rating-stars">${'★'.repeat(Math.floor(item.rating || 0))}${'☆'.repeat(5 - Math.floor(item.rating || 0))}</span>
                            <span class="rating-value">${item.rating || 0}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        marketList.innerHTML = listHtml;
        this.bindCardEvents();
    },
    
    bindCardEvents() {
        document.querySelectorAll('.market-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.market-card-favorite')) {
                    const id = card.dataset.id;
                    window.location.hash = `#market_detail?id=${id}`;
                }
            });
        });
        
        document.querySelectorAll('.market-card-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.toggleFavorite(id, btn);
            });
        });
    },
    
    async toggleFavorite(marketId, btn) {
        try {
            const result = await FavoriteService.toggle(marketId);
            
            if (result.code === 0) {
                const isFavorited = result.data?.is_favorite;
                if (isFavorited) {
                    btn.classList.add('active');
                    btn.textContent = '❤';
                    this.userFavorites.add(marketId);
                } else {
                    btn.classList.remove('active');
                    btn.textContent = '🤍';
                    this.userFavorites.delete(marketId);
                }
                Toast.success(isFavorited ? '已收藏' : '已取消收藏');
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            console.error('收藏操作失败:', error);
            Toast.error(error.message || '网络错误');
        }
    },
    
    updatePagination() {
        const pagination = document.getElementById('pagination');
        const totalPages = Math.ceil(this.total / this.pageSize);
        
        if (totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }
        
        let html = '<div class="pagination">';
        
        if (this.currentPage > 1) {
            html += `<button class="pagination-btn" onclick="MarketPage.goToPage(${this.currentPage - 1})">‹</button>`;
        }
        
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);
        
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === this.currentPage;
            html += `<button class="pagination-btn ${isActive ? 'active' : ''}" onclick="MarketPage.goToPage(${i})">${i}</button>`;
        }
        
        if (this.currentPage < totalPages) {
            html += `<button class="pagination-btn" onclick="MarketPage.goToPage(${this.currentPage + 1})">›</button>`;
        }
        
        html += `<span class="pagination-info">共 ${this.total} 条</span>`;
        html += '</div>';
        
        pagination.innerHTML = html;
        pagination.style.display = 'flex';
    },
    
    goToPage(page) {
        this.currentPage = page;
        this.loadData();
    }
};
