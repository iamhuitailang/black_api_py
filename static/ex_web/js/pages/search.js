var SearchPage = {
    currentPage: 1,
    pageSize: 10,
    isLoading: false,
    hasMore: true,
    keyword: '',
    category: '',
    condition: '',
    sortBy: '',
    userId: null,
    
    categories: [
        { name: '全部', value: '' },
        { name: '数码', value: '数码' },
        { name: '图书', value: '图书' },
        { name: '家居', value: '家居' },
        { name: '服饰', value: '服饰' },
        { name: '美妆', value: '美妆' },
        { name: '运动', value: '运动' },
        { name: '母婴', value: '母婴' },
        { name: '其他', value: '其他' }
    ],
    
    conditions: [
        { name: '全部', value: '' },
        { name: '全新', value: '1' },
        { name: '几乎全新', value: '2' },
        { name: '轻微使用', value: '3' },
        { name: '明显使用', value: '4' }
    ],
    
    sortOptions: [
        { name: '最新发布', value: '' },
        { name: '信用最高', value: 'credit' }
    ],
    
    render: function() {
        var params = Router.getParams();
        this.keyword = params.keyword || '';
        this.userId = params.user_id ? parseInt(params.user_id) : null;
        
        var app = document.getElementById('app');
        
        var categoriesHtml = this.categories.map(function(cat, index) {
            return '<div class="filter-item" data-category="' + cat.value + '">' + cat.name + '</div>';
        }).join('');
        
        app.innerHTML = `
            <div class="page-container with-tabbar">
                <div class="search-bar" style="border-bottom: 1px solid var(--border-color);">
                    <div class="search-back-btn" onclick="Router.navigate('/')">
                        <span style="font-size: 20px;">‹</span>
                    </div>
                    <div class="search-input-wrapper" style="background: var(--bg-color); flex: 1;">
                        <span class="icon">🔍</span>
                        <input type="text" id="searchInput" placeholder="搜索物品..." value="` + this.keyword + `">
                    </div>
                    <button class="search-btn" id="searchBtn">搜索</button>
                </div>
                <div class="filter-section" id="categoryFilters">
                    ` + categoriesHtml + `
                </div>
                <div class="page-content" id="searchContent" style="padding: 12px;">
                    <div class="item-grid" id="itemList">
                        <div class="text-center" style="grid-column: span 2; padding: 20px;">
                            <span class="loading"></span> 加载中...
                        </div>
                    </div>
                </div>
                ` + this.renderTabBar('search') + `
            </div>
        `;
        
        this.bindEvents();
        this.search(true);
    },
    
    bindEvents: function() {
        var self = this;
        var searchBtn = document.getElementById('searchBtn');
        var searchInput = document.getElementById('searchInput');
        
        searchBtn.addEventListener('click', function() {
            self.keyword = searchInput.value.trim();
            self.currentPage = 1;
            self.hasMore = true;
            self.search(true);
            
            if (self.keyword) {
                Storage.addSearchHistory(self.keyword);
            }
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
        
        var categoryFilters = document.getElementById('categoryFilters');
        if (categoryFilters) {
            categoryFilters.querySelectorAll('.filter-item').forEach(function(item, index) {
                if (index === 0) {
                    item.classList.add('active');
                }
                
                item.addEventListener('click', function() {
                    categoryFilters.querySelectorAll('.filter-item').forEach(function(i) {
                        i.classList.remove('active');
                    });
                    this.classList.add('active');
                    
                    self.category = this.getAttribute('data-category');
                    self.currentPage = 1;
                    self.hasMore = true;
                    self.search(true);
                });
            });
        }
    },
    
    search: function(refresh) {
        if (this.isLoading) return;
        if (!refresh && !this.hasMore) return;
        
        this.isLoading = true;
        
        if (refresh) {
            this.currentPage = 1;
        }
        
        var url = '/ex/item/search/get?page=' + this.currentPage + '&limit=' + this.pageSize;
        
        if (this.keyword) {
            url += '&keyword=' + encodeURIComponent(this.keyword);
        }
        if (this.category) {
            url += '&category=' + encodeURIComponent(this.category);
        }
        if (this.condition) {
            url += '&condition=' + this.condition;
        }
        if (this.userId) {
            url += '&user_id=' + this.userId;
        }
        
        var self = this;
        API.get(url)
            .then(function(response) {
                var data = response.data;
                var items = data.list || data;
                var total = data.total || items.length;
                
                var container = document.getElementById('itemList');
                if (refresh) {
                    container.innerHTML = '';
                }
                
                if (items.length === 0 && refresh) {
                    container.innerHTML = `
                        <div class="empty-state" style="grid-column: span 2; padding: 40px 0;">
                            <div class="icon">🔍</div>
                            <p>未找到相关物品</p>
                            <button class="btn btn-primary btn-sm" onclick="Router.navigate('/')">去首页</button>
                        </div>
                    `;
                } else {
                    items.forEach(function(item) {
                        container.innerHTML += self.renderItemCard(item);
                    });
                }
                
                self.isLoading = false;
                self.currentPage++;
                
                if (items.length < self.pageSize) {
                    self.hasMore = false;
                }
            })
            .catch(function(error) {
                console.error('搜索失败:', error);
                self.isLoading = false;
                
                var container = document.getElementById('itemList');
                if (refresh) {
                    container.innerHTML = `
                        <div class="empty-state" style="grid-column: span 2; padding: 40px 0;">
                            <div class="icon">❌</div>
                            <p>搜索失败: ` + (error.message || '未知错误') + `</p>
                            <button class="btn btn-primary btn-sm" onclick="SearchPage.search(true)">重试</button>
                        </div>
                    `;
                }
            });
    },
    
    renderItemCard: function(item) {
        var image = item.images && item.images.length > 0 ? item.images[0] : '';
        var conditionMap = { 1: '全新', 2: '几乎全新', 3: '轻微使用', 4: '明显使用' };
        var condition = conditionMap[item.condition] || '';
        
        return `
            <div class="item-card" onclick="Router.navigate('/item/` + item.id + `')">
                <img src="` + image + `" class="item-card-image" alt="` + item.title + `" onerror="this.style.backgroundColor='var(--bg-color)';this.style.display='none';">
                <div class="item-card-content">
                    <div class="item-card-title">` + (item.title || '-') + `</div>
                    <div class="item-card-tags">
                        ` + (item.category ? '<span class="item-card-tag">' + item.category + '</span>' : '') + `
                        ` + (condition ? '<span class="item-card-tag">' + condition + '</span>' : '') + `
                    </div>
                    <div class="item-card-user">
                        <div class="item-card-avatar">
                            ` + (item.publisher_nickname ? item.publisher_nickname.charAt(0).toUpperCase() : '?') + `
                        </div>
                        <span class="item-card-nickname">` + (item.publisher_nickname || item.publisher_phone || '-') + `</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    renderTabBar: function(active) {
        var unreadCount = 0;
        
        return `
            <div class="tab-bar safe-bottom">
                <div class="tab-item ` + (active === 'home' ? 'active' : '') + `" onclick="Router.navigate('/')">
                    <div class="icon">🏠</div>
                    <div class="label">首页</div>
                </div>
                <div class="tab-item ` + (active === 'exchange' ? 'active' : '') + `" onclick="Router.navigate('/exchange')">
                    <div class="icon">🔄</div>
                    <div class="label">交换</div>
                </div>
                <div class="tab-item ` + (active === 'publish' ? 'active' : '') + `" onclick="Router.navigate('/publish')">
                    <div class="icon">➕</div>
                    <div class="label">发布</div>
                </div>
                <div class="tab-item ` + (active === 'message' ? 'active' : '') + `" onclick="Router.navigate('/message')">
                    <div class="icon">💬</div>
                    ` + (unreadCount > 0 ? '<div class="badge">' + (unreadCount > 99 ? '99+' : unreadCount) + '</div>' : '') + `
                    <div class="label">消息</div>
                </div>
                <div class="tab-item ` + (active === 'profile' ? 'active' : '') + `" onclick="Router.navigate('/profile')">
                    <div class="icon">👤</div>
                    <div class="label">我的</div>
                </div>
            </div>
        `;
    }
};
