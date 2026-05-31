const HomePage = {
    services: [],
    categories: [],
    currentCategory: '',
    keyword: '',

    async render() {
        const app = document.getElementById('app');
        const user = AuthService.getCurrentUser();

        app.innerHTML = `
            <div class="page-container">
                <header class="header">
                    <div class="header-content">
                        <h1 class="logo">🏠 家政服务</h1>
                        <div class="header-actions">
                            <a href="#notifications" class="notification-btn">
                                🔔 <span class="badge" id="unreadBadge" style="display:none;">0</span>
                            </a>
                            <a href="#profile" class="user-info">
                                <span class="avatar">${user?.name?.charAt(0) || 'U'}</span>
                            </a>
                        </div>
                    </div>
                </header>

                <div class="search-bar">
                    <input type="text" id="searchInput" placeholder="搜索服务..." value="${this.keyword}">
                    <button class="btn btn-primary" id="searchBtn">搜索</button>
                </div>

                <div class="category-tabs" id="categoryTabs">
                    <button class="category-tab active" data-category="">全部</button>
                </div>

                <div class="service-list" id="serviceList">
                    <div class="loading">加载中...</div>
                </div>

                <nav class="bottom-nav">
                    <a href="#home" class="nav-item active">
                        <span class="nav-icon">🏠</span>
                        <span class="nav-text">首页</span>
                    </a>
                    <a href="#myOrders" class="nav-item">
                        <span class="nav-icon">📋</span>
                        <span class="nav-text">订单</span>
                    </a>
                    <a href="#notifications" class="nav-item">
                        <span class="nav-icon">🔔</span>
                        <span class="nav-text">消息</span>
                    </a>
                    <a href="#profile" class="nav-item">
                        <span class="nav-icon">👤</span>
                        <span class="nav-text">我的</span>
                    </a>
                </nav>
            </div>
        `;

        await this.loadData();
        this.bindEvents();
    },

    async loadData() {
        try {
            const [servicesResult, categoriesResult, unreadResult] = await Promise.all([
                ServiceApi.list({ category: this.currentCategory, keyword: this.keyword }),
                ServiceApi.categories(),
                NotificationApi.unreadCount()
            ]);

            if (servicesResult.code === 0) {
                this.services = servicesResult.data.items || [];
            }

            if (categoriesResult.code === 0) {
                this.categories = categoriesResult.data || [];
            }

            if (unreadResult.code === 0 && unreadResult.data.unread_count > 0) {
                const badge = document.getElementById('unreadBadge');
                badge.style.display = 'inline-block';
                badge.textContent = unreadResult.data.unread_count;
            }

            this.renderCategories();
            this.renderServices();
        } catch (error) {
            Utils.showToast('加载失败，请刷新重试', 'error');
            document.getElementById('serviceList').innerHTML = '<div class="empty">加载失败</div>';
        }
    },

    renderCategories() {
        const tabsContainer = document.getElementById('categoryTabs');
        let html = '<button class="category-tab active" data-category="">全部</button>';

        this.categories.forEach(cat => {
            const active = cat === this.currentCategory ? 'active' : '';
            html += `<button class="category-tab ${active}" data-category="${cat}">${cat}</button>`;
        });

        tabsContainer.innerHTML = html;

        tabsContainer.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabsContainer.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.loadServices();
            });
        });
    },

    async loadServices() {
        document.getElementById('serviceList').innerHTML = '<div class="loading">加载中...</div>';
        try {
            const result = await ServiceApi.list({ category: this.currentCategory, keyword: this.keyword });
            if (result.code === 0) {
                this.services = result.data.items || [];
                this.renderServices();
            }
        } catch (error) {
            document.getElementById('serviceList').innerHTML = '<div class="empty">加载失败</div>';
        }
    },

    renderServices() {
        const listContainer = document.getElementById('serviceList');

        if (this.services.length === 0) {
            listContainer.innerHTML = '<div class="empty">暂无服务</div>';
            return;
        }

        let html = '';
        this.services.forEach(service => {
            html += `
                <div class="service-card" data-id="${service.id}">
                    <div class="service-image">
                        <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(service.name + ' 家政服务 清洁 专业')}&image_size=square" alt="${service.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 font-size=%2220%22>🏠</text></svg>'">
                    </div>
                    <div class="service-info">
                        <div class="service-header">
                            <h3 class="service-name">${service.name}</h3>
                            <span class="service-category">${service.category}</span>
                        </div>
                        <p class="service-desc">${service.description || '暂无描述'}</p>
                        <div class="service-footer">
                            <span class="service-price">${Utils.formatPrice(service.price)}</span>
                            <span class="service-duration">${service.duration || 60}分钟</span>
                        </div>
                    </div>
                </div>
            `;
        });

        listContainer.innerHTML = html;

        listContainer.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                Router.navigate('serviceDetail', { id });
            });
        });
    },

    bindEvents() {
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');

        searchBtn.addEventListener('click', () => {
            this.keyword = searchInput.value;
            this.loadServices();
        });

        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.keyword = searchInput.value;
                this.loadServices();
            }
        });
    }
};
