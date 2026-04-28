var HomePage = {
    currentPage: 1,
    pageSize: 10,
    isLoading: false,
    hasMore: true,
    selectedCategory: '',
    
    categories: [
        { name: '数码', icon: '📱' },
        { name: '图书', icon: '📚' },
        { name: '家居', icon: '🏠' },
        { name: '服饰', icon: '👗' },
        { name: '美妆', icon: '💄' },
        { name: '运动', icon: '⚽' },
        { name: '母婴', icon: '👶' },
        { name: '其他', icon: '📦' }
    ],
    
    render: function() {
        var app = document.getElementById('app');
        app.innerHTML = `
            <div class="page-container with-tabbar">
                <div class="search-bar" onclick="Router.navigate('/search')">
                    <div class="search-input-wrapper">
                        <span class="icon">🔍</span>
                        <input type="text" placeholder="搜索你想要的物品..." readonly>
                    </div>
                </div>
                <div class="page-content" id="homeContent">
                    <div class="banner">
                        <div class="banner-content">
                            <div class="banner-title">换享 · 以物换物</div>
                            <div class="banner-desc">让闲置物品流动起来</div>
                        </div>
                    </div>
                    <div class="category-section">
                        <div class="category-title">分类浏览</div>
                        <div class="category-list" id="categoryList"></div>
                    </div>
                    <div class="section-header">
                        <div class="section-title" id="sectionTitle">最新上架</div>
                        <div class="section-more" onclick="Router.navigate('/search')">
                            更多
                            <span>›</span>
                        </div>
                    </div>
                    <div class="item-grid" id="itemList">
                        <div class="text-center" style="grid-column: span 2; padding: 20px;">
                            <span class="loading"></span> 加载中...
                        </div>
                    </div>
                </div>
                ` + this.renderTabBar('home') + `
            </div>
        `;
        
        this.renderCategories();
        this.loadItems(true);
        this.bindScroll();
    },
    
    renderCategories: function() {
        var container = document.getElementById('categoryList');
        if (!container) return;
        
        var html = '<div class="category-item" data-category="" onclick="HomePage.selectCategory(\'\')"><div class="category-icon">🏠</div><div class="category-name">全部</div></div>';
        
        this.categories.forEach(function(cat) {
            html += '<div class="category-item" data-category="' + cat.name + '" onclick="HomePage.selectCategory(\'' + cat.name + '\')"><div class="category-icon">' + cat.icon + '</div><div class="category-name">' + cat.name + '</div></div>';
        });
        
        container.innerHTML = html;
    },
    
    selectCategory: function(category) {
        this.selectedCategory = category;
        this.currentPage = 1;
        this.hasMore = true;
        
        var title = category || '最新上架';
        var sectionTitle = document.getElementById('sectionTitle');
        if (sectionTitle) {
            sectionTitle.textContent = title;
        }
        
        var items = document.querySelectorAll('.category-item');
        items.forEach(function(item) {
            var itemCat = item.getAttribute('data-category');
            if (itemCat === category) {
                item.style.backgroundColor = 'var(--primary-light)';
            } else {
                item.style.backgroundColor = '';
            }
        });
        
        this.loadItems(true);
    },
    
    loadItems: function(refresh) {
        if (this.isLoading) return;
        if (!refresh && !this.hasMore) return;
        
        this.isLoading = true;
        
        if (refresh) {
            this.currentPage = 1;
        }
        
        var url = '/ex/item/search/get?page=' + this.currentPage + '&limit=' + this.pageSize;
        if (this.selectedCategory) {
            url += '&category=' + encodeURIComponent(this.selectedCategory);
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
                        <div class="empty-state" style="grid-column: span 2;">
                            <div class="icon">📦</div>
                            <p>暂无物品</p>
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
                console.error('加载物品失败:', error);
                self.isLoading = false;
                if (refresh) {
                    var container = document.getElementById('itemList');
                    container.innerHTML = `
                        <div class="empty-state" style="grid-column: span 2;">
                            <div class="icon">❌</div>
                            <p>加载失败: ` + (error.message || '未知错误') + `</p>
                            <button class="btn btn-primary btn-sm" onclick="HomePage.loadItems(true)">重试</button>
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
    
    bindScroll: function() {
        var self = this;
        window.addEventListener('scroll', function() {
            var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            var scrollHeight = document.documentElement.scrollHeight;
            var clientHeight = document.documentElement.clientHeight;
            
            if (scrollTop + clientHeight >= scrollHeight - 200) {
                self.loadItems(false);
            }
        });
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
