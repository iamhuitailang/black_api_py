const HomePage = {
    currentPage: 1, pageSize: 10, currentType: '', keyword: '', hasMore: true, services: [],
    serviceTypes: [
        { code: '', name: '全部' },
        { code: 'daycare', name: '日间寄养', icon: '🏠' },
        { code: 'boarding', name: '长期寄养', icon: '🏨' },
        { code: 'grooming', name: '美容洗护', icon: '✂️' },
        { code: 'walking', name: '遛宠服务', icon: '🚶' },
        { code: 'vet', name: '医疗陪护', icon: '🏥' }
    ],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <h1 class="header-title">宠托帮</h1>
                    <div class="header-action" onclick="Router.navigate('adminLogin')">管理</div>
                </header>
                <div class="home-banner">
                    <h2 class="home-banner-title">🐾 宠物寄养 · 宠托帮</h2>
                    <p class="home-banner-subtitle">给毛孩子一个温暖可靠的家</p>
                </div>
                <div class="search-bar">
                    <div class="search-input-wrapper">
                        <span class="search-icon">🔍</span>
                        <input type="text" class="search-input" id="searchInput" placeholder="搜索寄养服务">
                    </div>
                    <button class="search-btn" id="searchBtn">搜索</button>
                </div>
                <div class="category-tabs" id="categoryTabs">
                    ${this.serviceTypes.map(t => `<div class="category-tab ${t.code === this.currentType ? 'active' : ''}" data-type="${t.code}">${t.name}</div>`).join('')}
                </div>
                <div class="service-list" id="serviceList">
                    <div class="empty-state"><div class="empty-state-icon">🐾</div><div class="empty-state-text">加载中...</div></div>
                </div>
                ${Tabbar.render('home')}
            </div>
        `;
        this.bindEvents();
        this.currentPage = 1; this.hasMore = true; this.services = [];
        await this.loadServices();
    },

    bindEvents() {
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentType = tab.dataset.type;
                this.currentPage = 1; this.hasMore = true; this.services = [];
                document.querySelectorAll('.category-tab').forEach(t => t.classList.toggle('active', t.dataset.type === this.currentType));
                this.loadServices();
            });
        });
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.keyword = document.getElementById('searchInput').value.trim();
            this.currentPage = 1; this.hasMore = true; this.services = [];
            this.loadServices();
        });
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.keyword = e.target.value.trim();
                this.currentPage = 1; this.hasMore = true; this.services = [];
                this.loadServices();
            }
        });
    },

    async loadServices() {
        const serviceList = document.getElementById('serviceList');
        try {
            const params = { page: this.currentPage, page_size: this.pageSize };
            if (this.currentType) params.type = this.currentType;
            if (this.keyword) params.keyword = this.keyword;
            const result = await ApiService.get('/chongwu09/service/list/get', params);
            if (result.code === 0) {
                const newServices = result.data.items || [];
                if (newServices.length === 0 && this.currentPage === 1) {
                    serviceList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">暂无服务</div></div>';
                    return;
                }
                if (newServices.length < this.pageSize) this.hasMore = false;
                this.services = this.currentPage === 1 ? newServices : [...this.services, ...newServices];
                serviceList.innerHTML = this.services.map(s => this.renderServiceItem(s)).join('');
                if (this.hasMore) {
                    serviceList.innerHTML += '<div class="text-center" style="padding:12px"><button class="btn btn-outline btn-sm" id="loadMoreBtn">加载更多</button></div>';
                    document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
                        this.currentPage++;
                        this.loadServices();
                    });
                }
                this.bindServiceEvents();
            } else { Toast.error(result.msg || '加载失败'); }
        } catch (error) {
            serviceList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-text">加载失败</div></div>';
        }
    },

    renderServiceItem(service) {
        const icon = Utils.getServiceIcon(service.type);
        const capacityText = `${service.current_booked || 0}/${service.capacity || 10} 已预约`;
        return `
            <div class="service-item" data-id="${service.id}">
                <div class="service-header">
                    <div class="service-icon">${icon}</div>
                    <div class="service-info">
                        <div class="service-title">${service.title}</div>
                        <div class="service-meta">${service.type_name} · ${service.address || '暂无地址'}</div>
                    </div>
                </div>
                <div class="service-desc">${service.description || '暂无描述'}</div>
                <div class="service-footer">
                    <div class="service-capacity">${capacityText}</div>
                    <div>
                        <span class="service-price">¥${service.price}</span>
                        <span class="service-price-unit">/${service.price_unit || '天'}</span>
                    </div>
                </div>
            </div>
        `;
    },

    bindServiceEvents() {
        document.querySelectorAll('.service-item').forEach(item => {
            item.addEventListener('click', () => {
                Router.navigate('serviceDetail', { service_id: item.dataset.id });
            });
        });
    }
};
