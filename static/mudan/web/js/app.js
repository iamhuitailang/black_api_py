const App = {
    isInitialized: false,
    loadingOverlay: null,
    backendAPI: '/api/mudan',
    bannerData: [],
    tabData: [],
    currentTabId: null,
    defaultTabs: [
        { tab_id: 1, tab_name: '牡丹简介', icon: '📖' },
        { tab_id: 2, tab_name: '城市文旅', icon: '🏯' },
        { tab_id: 3, tab_name: '牡丹文化', icon: '📜' },
        { tab_id: 4, tab_name: '商业服务', icon: '🛍️' }
    ],

    async init() {
        if (this.isInitialized) return;

        this.loadingOverlay = document.getElementById('loading-overlay');

        try {
            await this.loadDataFromBackend();
        } catch (error) {
            console.warn('加载后端数据失败，使用默认数据:', error);
            this.tabData = [...this.defaultTabs];
        }

        if (this.tabData.length === 0) {
            console.log('⚠️ 后端无Tab数据，使用默认Tab');
            this.tabData = [...this.defaultTabs];
        }

        console.log('📋 最终Tab列表:', this.tabData);

        this.renderTabNavigation();
        this.renderBottomNavigation();
        this.renderSideMenu();
        this.renderTabContainers();

        BannerSlider.init({
            autoPlay: true,
            interval: 4000,
            banners: this.bannerData.length > 0 ? this.bannerData : undefined
        });

        TabManager.init();
        MenuManager.init();
        AnimationManager.init();

        TabManager.onTabChange = (tabId, prevTabId) => {
            this.onTabChanged(tabId);
        };

        this.bindGlobalEvents();

        this.isInitialized = true;

        const firstTabId = this.tabData.length > 0 ? this.tabData[0].tab_id : 1;
        this.currentTabId = firstTabId;
        
        console.log('🌸 初始化完成，当前Tab:', firstTabId);
        
        await this.loadAndRenderTabContent(firstTabId);

        this.hideLoading();

        console.log('🌸 牡丹国风M站已初始化');
    },

    async loadDataFromBackend() {
        await Promise.all([
            this.loadBanners(),
            this.loadTabs()
        ]);
    },

    async loadBanners() {
        console.log('📡 正在从后端加载Banner...');
        try {
            const response = await Utils.fetchAPI(`${this.backendAPI}/banner/get`);
            console.log('📡 Banner API响应:', response);
            
            if (response.code === 0 && response.data) {
                let banners = [];
                
                if (Array.isArray(response.data)) {
                    banners = response.data;
                } else if (response.data.items && Array.isArray(response.data.items)) {
                    banners = response.data.items;
                } else if (response.data.banners && Array.isArray(response.data.banners)) {
                    banners = response.data.banners;
                }
                
                if (banners.length > 0) {
                    this.bannerData = banners.map((item, index) => ({
                        id: item.id || index,
                        image_url: item.image_url,
                        title: item.title || `Banner ${index + 1}`,
                        description: item.jump_url || ''
                    }));
                    console.log('✅ 从后端加载Banner成功:', this.bannerData.length, '个');
                } else {
                    console.log('⚠️ 后端返回的Banner数组为空');
                }
            } else {
                console.log('⚠️ Banner API返回状态异常:', response);
            }
        } catch (error) {
            console.warn('❌ 获取Banner失败:', error);
            throw error;
        }
    },

    async loadTabs() {
        console.log('📡 正在从后端加载Tab列表...');
        try {
            const response = await Utils.fetchAPI(`${this.backendAPI}/tab/list/get`);
            console.log('📡 Tab列表API响应:', response);
            
            if (response.code === 0 && response.data) {
                if (Array.isArray(response.data)) {
                    this.tabData = response.data;
                } else if (response.data.tabs && Array.isArray(response.data.tabs)) {
                    this.tabData = response.data.tabs;
                } else if (response.data.items && Array.isArray(response.data.items)) {
                    this.tabData = response.data.items;
                } else {
                    this.tabData = [];
                }
                console.log('✅ 从后端加载Tab列表成功:', this.tabData.length, '个', this.tabData);
            } else {
                console.log('⚠️ Tab列表API返回状态异常:', response);
            }
        } catch (error) {
            console.warn('❌ 获取Tab列表失败:', error);
        }
    },

    async loadTabDetail(tabId) {
        console.log(`📡 正在从后端加载Tab ${tabId} 详情...`);
        try {
            const response = await Utils.fetchAPI(`${this.backendAPI}/tab/detail/get?tab_id=${tabId}`);
            console.log(`📡 Tab ${tabId} 详情API响应:`, response);
            
            if (response.code === 0 && response.data) {
                console.log(`✅ Tab ${tabId} 详情加载成功:`, response.data);
                return response.data;
            } else {
                console.log(`⚠️ Tab ${tabId} 详情API返回状态异常:`, response);
            }
        } catch (error) {
            console.warn(`❌ 获取Tab ${tabId} 详情失败:`, error);
        }
        return null;
    },

    async loadCommercialData() {
        console.log('📡 正在从后端加载商业服务数据...');
        try {
            const response = await Utils.fetchAPI(`${this.backendAPI}/commercial/get`);
            console.log('📡 商业服务API响应:', response);
            
            if (response.code === 0 && response.data) {
                console.log('✅ 商业服务数据加载成功:', response.data);
                return response.data;
            }
        } catch (error) {
            console.warn('❌ 获取商业服务数据失败:', error);
        }
        return null;
    },

    getTabIcon(tabId, tabName) {
        const icons = {
            1: '📖',
            2: '🏯',
            3: '📜',
            4: '🛍️'
        };
        const defaultTab = this.defaultTabs.find(t => t.tab_id === tabId);
        if (defaultTab) return defaultTab.icon;
        return icons[tabId] || '📄';
    },

    renderTabNavigation() {
        const container = document.getElementById('tab-nav-list');
        if (!container) return;

        container.innerHTML = '';
        
        this.tabData.forEach((tab, index) => {
            const isActive = index === 0;
            const icon = this.getTabIcon(tab.tab_id, tab.tab_name);
            
            const button = document.createElement('button');
            button.className = `tab-nav-item ${isActive ? 'active' : ''}`;
            button.setAttribute('data-tab', tab.tab_id);
            button.setAttribute('role', 'tab');
            button.setAttribute('aria-selected', isActive ? 'true' : 'false');
            
            button.innerHTML = `
                <span class="tab-icon">${icon}</span>
                <span>${tab.tab_name}</span>
            `;
            
            container.appendChild(button);
        });
        
        console.log('✅ 顶部Tab导航渲染完成');
    },

    renderBottomNavigation() {
        const container = document.getElementById('bottom-nav');
        if (!container) return;

        container.innerHTML = '';
        
        this.tabData.forEach((tab, index) => {
            const isActive = index === 0;
            const icon = this.getTabIcon(tab.tab_id, tab.tab_name);
            
            const button = document.createElement('button');
            button.className = `bottom-nav-item ${isActive ? 'active' : ''}`;
            button.setAttribute('data-tab', tab.tab_id);
            button.setAttribute('aria-label', tab.tab_name);
            
            button.innerHTML = `
                <span class="bottom-nav-icon">${icon}</span>
                <span class="bottom-nav-text">${tab.tab_name}</span>
            `;
            
            container.appendChild(button);
        });
        
        console.log('✅ 底部导航渲染完成');
    },

    renderSideMenu() {
        const container = document.getElementById('side-menu-list');
        if (!container) return;

        container.innerHTML = '';
        
        this.tabData.forEach((tab, index) => {
            const isActive = index === 0;
            const icon = this.getTabIcon(tab.tab_id, tab.tab_name);
            
            const li = document.createElement('li');
            li.className = `menu-item ${isActive ? 'active' : ''}`;
            li.setAttribute('data-tab', tab.tab_id);
            
            li.innerHTML = `
                <span class="menu-icon">${icon}</span>
                <span>${tab.tab_name}</span>
            `;
            
            container.appendChild(li);
        });
        
        console.log('✅ 侧边菜单渲染完成');
    },

    renderTabContainers() {
        const container = document.getElementById('content-section');
        if (!container) return;

        container.innerHTML = '';
        
        this.tabData.forEach((tab, index) => {
            const isActive = index === 0;
            
            const contentDiv = document.createElement('div');
            contentDiv.id = `tab-${tab.tab_id}`;
            contentDiv.className = `tab-content ${isActive ? 'active' : ''}`;
            contentDiv.setAttribute('role', 'tabpanel');
            
            contentDiv.innerHTML = `
                <div class="page-container">
                    <div class="content-loading" style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                        <div style="font-size: 40px; margin-bottom: 16px;">⏳</div>
                        <p>加载中...</p>
                    </div>
                </div>
            `;
            
            container.appendChild(contentDiv);
        });
        
        console.log('✅ Tab内容容器渲染完成');
    },

    async loadAndRenderTabContent(tabId) {
        const contentDiv = document.getElementById(`tab-${tabId}`);
        if (!contentDiv) {
            console.warn(`❌ 未找到Tab内容容器: tab-${tabId}`);
            return;
        }

        const pageContainer = contentDiv.querySelector('.page-container');
        if (!pageContainer) return;

        pageContainer.innerHTML = `
            <div class="content-loading" style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                <div style="font-size: 40px; margin-bottom: 16px;">⏳</div>
                <p>加载中...</p>
            </div>
        `;

        let data;
        if (tabId === 4) {
            data = await this.loadCommercialData();
            this.renderCommercialContent(tabId, data);
        } else {
            data = await this.loadTabDetail(tabId);
            this.renderTabDetailContent(tabId, data);
        }
    },

    renderTabDetailContent(tabId, data) {
        const contentDiv = document.getElementById(`tab-${tabId}`);
        if (!contentDiv) return;

        const pageContainer = contentDiv.querySelector('.page-container');
        if (!pageContainer) return;

        const tabInfo = this.tabData.find(t => t.tab_id === tabId);
        const tabName = tabInfo ? tabInfo.tab_name : '详情';
        const icon = this.getTabIcon(tabId, tabName);

        let title = tabName;
        let content = '';

        if (data && data.content) {
            title = data.title || tabName;
            content = data.content;
        } else {
            content = this.getDefaultTabContent(tabId);
        }

        content = this.formatContent(content);

        pageContainer.innerHTML = `
            <div class="page-header animate-on-scroll fade-in-up">
                <h1 class="page-title">${title}</h1>
            </div>
            <div class="content-card animate-on-scroll fade-in-up">
                <div class="card-content rich-text-content">
                    ${content}
                </div>
            </div>
        `;

        if (window.AnimationManager) {
            AnimationManager.observeContent(contentDiv);
        }

        console.log(`✅ Tab ${tabId} 内容渲染完成`);
    },

    renderCommercialContent(tabId, data) {
        const contentDiv = document.getElementById(`tab-${tabId}`);
        if (!contentDiv) return;

        const pageContainer = contentDiv.querySelector('.page-container');
        if (!pageContainer) return;

        const contact = data?.contact || {};
        const products = data?.products || [];

        let productsHtml = '';
        if (products.length > 0) {
            productsHtml = products.map(product => `
                <div class="product-item card-hover">
                    <div class="product-image">
                        ${product.image_url ? `<img src="${product.image_url}" alt="${product.name}" class="lazy-image">` : 
                         `<img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=peony%20product%20elegant%20chinese%20style&image_size=square_hd" alt="${product.name}" class="lazy-image">`}
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        ${product.description ? `<p>${product.description}</p>` : ''}
                        ${product.price > 0 ? `<span class="product-tag">¥${product.price}</span>` : ''}
                    </div>
                </div>
            `).join('');
        } else {
            productsHtml = `
                <div class="product-item card-hover">
                    <div class="product-image">
                        <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=peony%20tea%20chinese%20traditional%20style&image_size=square_hd" alt="牡丹花茶" class="lazy-image">
                    </div>
                    <div class="product-info">
                        <h3>牡丹花茶</h3>
                        <p>精选新鲜牡丹花瓣，经过特殊工艺精制而成，香气清雅，口感甘醇。</p>
                        <span class="product-tag">食品类</span>
                    </div>
                </div>
                <div class="product-item card-hover">
                    <div class="product-image">
                        <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=peony%20essential%20oil%20cosmetic%20elegant&image_size=square_hd" alt="牡丹精油" class="lazy-image">
                    </div>
                    <div class="product-info">
                        <h3>牡丹精油</h3>
                        <p>采用超临界CO2萃取技术提取牡丹精华，具有保湿、抗氧化、抗衰老等护肤功效。</p>
                        <span class="product-tag">化妆品</span>
                    </div>
                </div>
                <div class="product-item card-hover">
                    <div class="product-image">
                        <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=peony%20cake%20chinese%20pastry%20traditional&image_size=square_hd" alt="牡丹糕" class="lazy-image">
                    </div>
                    <div class="product-info">
                        <h3>牡丹糕</h3>
                        <p>以牡丹花瓣、糯米粉为主料，传统工艺制作，口感软糯香甜，花香四溢。</p>
                        <span class="product-tag">食品类</span>
                    </div>
                </div>
            `;
        }

        let contactHtml = '';
        if (contact.phone || contact.wechat) {
            contactHtml = `
                <div class="contact-section card-hover">
                    <h3>联系我们</h3>
                    <div class="contact-info">
                        ${contact.phone ? `<div class="contact-item"><span class="contact-icon">📞</span><span>电话：${contact.phone}</span></div>` : ''}
                        ${contact.wechat ? `<div class="contact-item"><span class="contact-icon">💬</span><span>微信：${contact.wechat}</span></div>` : ''}
                    </div>
                </div>
            `;
        } else {
            contactHtml = `
                <div class="contact-section card-hover">
                    <h3>联系我们</h3>
                    <div class="contact-info">
                        <div class="contact-item">
                            <span class="contact-icon">📍</span>
                            <span>地址：河南省洛阳市洛龙区牡丹大道888号</span>
                        </div>
                        <div class="contact-item">
                            <span class="contact-icon">📞</span>
                            <span>电话：400-888-8888</span>
                        </div>
                        <div class="contact-item">
                            <span class="contact-icon">📧</span>
                            <span>邮箱：contact@mudanguofeng.com</span>
                        </div>
                    </div>
                </div>
            `;
        }

        pageContainer.innerHTML = `
            <div class="page-header animate-on-scroll fade-in-up">
                <h1 class="page-title">商业服务</h1>
                <div class="page-subtitle">牡丹衍生产品与文旅服务</div>
            </div>

            <div class="content-card animate-on-scroll fade-in-up">
                <h2 class="card-title">牡丹衍生产品</h2>
                <div class="card-content">
                    <div class="product-grid">
                        ${productsHtml}
                    </div>
                </div>
            </div>

            <div class="content-card animate-on-scroll fade-in-up">
                <h2 class="card-title">品牌介绍</h2>
                <div class="card-content">
                    <div class="brand-section">
                        <div class="brand-header">
                            <div class="brand-logo">
                                <span class="logo-icon-large">🌸</span>
                                <span class="brand-name">牡丹国风</span>
                            </div>
                        </div>
                        <div class="brand-content">
                            <p><strong>牡丹国风</strong>是专注于牡丹文化传播与产业发展的品牌平台。我们致力于传承千年牡丹文化，推动牡丹产业创新发展，让更多人了解牡丹、爱上牡丹。</p>
                            <h3>品牌理念</h3>
                            <p>我们秉承"传承千年花韵，绽放时代芳华"的品牌理念，将传统牡丹文化与现代生活方式相结合，打造具有中国文化特色的产品和服务。</p>
                        </div>
                    </div>
                    ${contactHtml}
                </div>
            </div>
        `;

        if (window.AnimationManager) {
            AnimationManager.observeContent(contentDiv);
        }

        console.log(`✅ 商业服务Tab ${tabId} 内容渲染完成`);
    },

    formatContent(content) {
        if (!content) return '';
        
        let formatted = content
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
        
        if (formatted && !formatted.startsWith('<p>')) {
            formatted = '<p>' + formatted + '</p>';
        }
        
        return formatted;
    },

    getDefaultTabContent(tabId) {
        const defaults = {
            1: `牡丹（学名：Paeonia suffruticosa Andr.）是毛茛科芍药属植物，为多年生落叶灌木。原产于中国，是中国特有的木本名贵花卉，有数千年的自然生长和1500多年的人工栽培历史。

牡丹是中国十大名花之一，被誉为"花中之王"、"国色天香"。牡丹文化是中国传统文化的重要组成部分，牡丹作为精神象征，体现了中华民族的精神和品格。

牡丹品种繁多，花色丰富。根据花色可分为红色类、粉色类、白色类、紫色类、黄色类、绿色类等。`,
            2: `洛阳位于河南省西部，黄河中游南岸，是中国四大古都之一。洛阳是牡丹的重要原产地和栽培中心，"洛阳牡丹甲天下"的美誉流传千年。

主要观赏景点：
- 王城公园：洛阳最大的综合性公园，牡丹观赏区面积广大
- 中国国花园：以牡丹文化为主题的专类公园
- 隋唐城遗址植物园：位于隋唐洛阳城遗址上
- 白马寺：中国第一古刹
- 龙门石窟：世界文化遗产

最佳观赏时间：每年4月1日至5月5日是洛阳牡丹文化节。`,
            3: `历史典故：

武则天贬牡丹：这是流传最广的牡丹传说之一。相传武则天称帝后，冬日游上苑，见百花凋零，便下诏令百花连夜开放。次日，上苑百花果然奉旨开放，唯有牡丹抗旨不遵。武则天大怒，下令将牡丹贬至洛阳。牡丹到了洛阳后，却开得更加艳丽。

欧阳修与牡丹：北宋文学家欧阳修著有《洛阳牡丹记》，是中国历史上第一部关于牡丹的专著。

民间传说：

牡丹仙子：相传很久以前，洛阳有一位善良美丽的姑娘名叫牡丹。有一年，洛阳发生大瘟疫，牡丹姑娘梦见老神仙告诉她，只有用自己的鲜血浇灌牡丹，才能开出治病的仙花。牡丹姑娘不顾自身安危，每天用自己的鲜血浇灌牡丹。牡丹果然开出了奇异的花朵，治愈了百姓的瘟疫。`
        };
        
        return defaults[tabId] || '暂无内容';
    },

    onTabChanged(tabId) {
        console.log('Tab切换到:', tabId);
        this.currentTabId = tabId;
        
        this.loadAndRenderTabContent(tabId);
    },

    showLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('hidden');
        }
    },

    hideLoading() {
        if (this.loadingOverlay) {
            setTimeout(() => {
                this.loadingOverlay.classList.add('hidden');
            }, 300);
        }
    },

    bindGlobalEvents() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (BannerSlider.isPlaying) {
                    BannerSlider.stopAutoPlay();
                }
            } else {
                if (BannerSlider.options.autoPlay && !BannerSlider.isPlaying) {
                    BannerSlider.startAutoPlay();
                }
            }
        });

        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));

        this.setupKeyboardNavigation();
    },

    handleResize() {
        document.documentElement.style.setProperty('--vw', `${window.innerWidth * 0.01}px`);
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    },

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                    if (BannerSlider.isPlaying) {
                        BannerSlider.prevSlide();
                        BannerSlider.stopAutoPlay();
                    }
                    break;
                case 'ArrowRight':
                    if (BannerSlider.isPlaying) {
                        BannerSlider.nextSlide();
                        BannerSlider.stopAutoPlay();
                    }
                    break;
                case 'Escape':
                    if (MenuManager.isOpen) {
                        MenuManager.close();
                    }
                    break;
                case 'Home':
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    break;
                case 'End':
                    e.preventDefault();
                    window.scrollTo({ 
                        top: document.documentElement.scrollHeight, 
                        behavior: 'smooth' 
                    });
                    break;
            }
        });
    },

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };

        const toast = Utils.createElement('div', {
            className: `toast ${type}`
        }, [
            Utils.createElement('span', { className: 'toast-icon' }, [icons[type] || icons.info]),
            Utils.createElement('span', { className: 'toast-message' }, [message])
        ]);

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease forwards';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    },

    createToastContainer() {
        const container = Utils.createElement('div', {
            id: 'toast-container',
            className: 'toast-container'
        });
        document.body.appendChild(container);
        return container;
    },

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    },

    getCurrentPage() {
        return this.currentTabId;
    },

    goToPage(tabId) {
        TabManager.setActiveTab(tabId);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.App = App;