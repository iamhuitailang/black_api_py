const ExplorePage = {
    data: {
        featuredDreams: [],
        hotDreams: [],
        latestDreams: [],
        searchKeyword: '',
        categoryFilter: 'all',
        sizeFilter: 'all',
        styleFilter: 'all',
        currentSlide: 0,
        slideTimer: null,
        loading: false
    },

    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="explore-page page">
                <div class="header">
                    <span class="header-title">探索梦境</span>
                </div>
                <div class="page has-header">
                    ${this.renderSearchBar()}
                    ${this.renderCarousel()}
                    ${this.renderCategoryFilters()}
                    ${this.renderHotDreams()}
                    ${this.renderLatestDreams()}
                    ${Tabbar.render('home')}
                </div>
            </div>
        `;

        this.bindEvents();
        this.loadData();
    },

    renderSearchBar() {
        return `
            <div class="explore-search">
                <div class="search-input-wrapper large">
                    <span class="search-icon">🔍</span>
                    <input type="text" 
                           id="exploreSearchInput"
                           class="search-input" 
                           placeholder="搜索梦境、创作者、标签..."
                           value="${this.data.searchKeyword}"
                           oninput="ExplorePage.handleSearch(this.value)">
                    ${this.data.searchKeyword ? `
                        <span class="search-clear" onclick="ExplorePage.clearSearch()">✕</span>
                    ` : ''}
                </div>
            </div>
        `;
    },

    renderCarousel() {
        const featured = this.data.featuredDreams.slice(0, 5);
        
        if (featured.length === 0) {
            return `
                <div class="explore-carousel">
                    <div class="carousel-placeholder">
                        <span class="placeholder-icon">✨</span>
                        <p>加载推荐梦境中...</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="explore-carousel">
                <div class="carousel-container" id="carouselContainer">
                    ${featured.map((dream, index) => `
                        <div class="carousel-slide ${index === 0 ? 'active' : ''}" 
                             data-index="${index}"
                             onclick="ExplorePage.openDream(${dream.id})">
                            <div class="carousel-image">
                                ${dream.thumbnail ? 
                                    `<img src="${dream.thumbnail}" alt="${dream.name}">` : 
                                    `<div class="carousel-placeholder-bg">
                                        ${this.getTimeIcon(dream.time_of_day)}
                                    </div>`
                                }
                                <div class="carousel-overlay"></div>
                            </div>
                            <div class="carousel-content">
                                <div class="carousel-badges">
                                    <span class="badge badge-featured">⭐ 精选推荐</span>
                                </div>
                                <h3 class="carousel-title">${dream.name}</h3>
                                <p class="carousel-desc">${dream.description || '探索这个精彩的梦境世界'}</p>
                                <div class="carousel-info">
                                    <span class="info-item">
                                        <span class="info-icon">👤</span>
                                        <span>${dream.creator_nickname || '梦境创作者'}</span>
                                    </span>
                                    <span class="info-item">
                                        <span class="info-icon">❤️</span>
                                        <span>${dream.like_count || 0}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="carousel-indicators">
                    ${featured.map((_, index) => `
                        <span class="carousel-dot ${index === 0 ? 'active' : ''}" 
                              data-index="${index}"
                              onclick="ExplorePage.goToSlide(${index})"></span>
                    `).join('')}
                </div>
                <button class="carousel-nav prev" onclick="ExplorePage.prevSlide()">‹</button>
                <button class="carousel-nav next" onclick="ExplorePage.nextSlide()">›</button>
            </div>
        `;
    },

    renderCategoryFilters() {
        const categories = [
            { value: 'all', label: '全部', icon: '🌈' },
            { value: 'adventure', label: '冒险', icon: '⚔️' },
            { value: 'puzzle', label: '解谜', icon: '🧩' },
            { value: 'parkour', label: '跑酷', icon: '🏃' },
            { value: 'creation', label: '创造', icon: '🏗️' },
            { value: 'survival', label: '生存', icon: '🔥' },
            { value: 'roleplay', label: '角色扮演', icon: '🎭' }
        ];

        const sizes = [
            { value: 'all', label: '全部大小' },
            { value: 'small', label: '小型' },
            { value: 'medium', label: '中型' },
            { value: 'large', label: '大型' }
        ];

        const styles = [
            { value: 'all', label: '全部风格' },
            { value: 'fantasy', label: '奇幻' },
            { value: 'modern', label: '现代' },
            { value: 'scifi', label: '科幻' },
            { value: 'retro', label: '复古' },
            { value: 'minimal', label: '极简' }
        ];

        return `
            <div class="explore-filters">
                <div class="filter-scroll">
                    <div class="filter-row">
                        <span class="filter-label">主题</span>
                        <div class="filter-chips">
                            ${categories.map(cat => `
                                <span class="filter-chip ${this.data.categoryFilter === cat.value ? 'active' : ''}"
                                      onclick="ExplorePage.setFilter('category', '${cat.value}')">
                                    <span class="chip-icon">${cat.icon}</span>
                                    <span class="chip-label">${cat.label}</span>
                                </span>
                            `).join('')}
                        </div>
                    </div>
                    <div class="filter-row">
                        <span class="filter-label">大小</span>
                        <div class="filter-chips">
                            ${sizes.map(size => `
                                <span class="filter-chip ${this.data.sizeFilter === size.value ? 'active' : ''}"
                                      onclick="ExplorePage.setFilter('size', '${size.value}')">
                                    <span class="chip-label">${size.label}</span>
                                </span>
                            `).join('')}
                        </div>
                    </div>
                    <div class="filter-row">
                        <span class="filter-label">风格</span>
                        <div class="filter-chips">
                            ${styles.map(style => `
                                <span class="filter-chip ${this.data.styleFilter === style.value ? 'active' : ''}"
                                      onclick="ExplorePage.setFilter('style', '${style.value}')">
                                    <span class="chip-label">${style.label}</span>
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderHotDreams() {
        const hotDreams = this.data.hotDreams.slice(0, 5);
        
        return `
            <div class="explore-section">
                <div class="section-header">
                    <h2 class="section-title">
                        <span class="title-icon">🔥</span>
                        热门排行榜
                    </h2>
                    <a href="javascript:;" class="section-more" onclick="ExplorePage.viewMore('hot')">
                        更多 ›
                    </a>
                </div>
                ${hotDreams.length === 0 ? `
                    <div class="loading-more">
                        <span class="loading" style="border-color: rgba(168, 85, 247, 0.3); border-top-color: var(--primary-color);"></span>
                        <span>加载中...</span>
                    </div>
                ` : `
                    <div class="hot-list">
                        ${hotDreams.map((dream, index) => this.renderHotItem(dream, index)).join('')}
                    </div>
                `}
            </div>
        `;
    },

    renderHotItem(dream, index) {
        const rankColors = ['#fbbf24', '#9ca3af', '#cd7f32', '#a855f7', '#a855f7'];
        const rankBg = index < 3 ? `background: ${rankColors[index]}20;` : '';
        const rankColor = index < 3 ? `color: ${rankColors[index]};` : '';

        return `
            <div class="hot-item" onclick="ExplorePage.openDream(${dream.id})">
                <div class="hot-rank" style="${rankBg} ${rankColor}">
                    ${index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                </div>
                <div class="hot-thumbnail">
                    ${dream.thumbnail ? 
                        `<img src="${dream.thumbnail}" alt="${dream.name}">` : 
                        `<div class="thumbnail-placeholder-small">
                            ${this.getTimeIcon(dream.time_of_day)}
                        </div>`
                    }
                </div>
                <div class="hot-info">
                    <h4 class="hot-title">${dream.name}</h4>
                    <p class="hot-desc">${dream.description || '暂无描述'}</p>
                    <div class="hot-meta">
                        <span class="meta-item">
                            <span class="meta-icon">👤</span>
                            <span>${dream.creator_nickname || '梦境创作者'}</span>
                        </span>
                        <span class="meta-item">
                            <span class="meta-icon">❤️</span>
                            <span>${dream.like_count || 0}</span>
                        </span>
                        <span class="meta-item">
                            <span class="meta-icon">👁️</span>
                            <span>${dream.view_count || 0}</span>
                        </span>
                    </div>
                </div>
                <span class="hot-arrow">›</span>
            </div>
        `;
    },

    renderLatestDreams() {
        const latestDreams = this.data.latestDreams;
        
        return `
            <div class="explore-section">
                <div class="section-header">
                    <h2 class="section-title">
                        <span class="title-icon">✨</span>
                        最新梦境
                    </h2>
                    <a href="javascript:;" class="section-more" onclick="ExplorePage.viewMore('latest')">
                        更多 ›
                    </a>
                </div>
                ${latestDreams.length === 0 ? `
                    <div class="empty-dreams">
                        <span class="empty-icon">🌙</span>
                        <p class="empty-text">暂无最新梦境</p>
                        <button class="btn btn-outline btn-sm" onclick="ExplorePage.refresh()">
                            <span>🔄</span>
                            <span>刷新</span>
                        </button>
                    </div>
                ` : `
                    <div class="latest-grid">
                        ${latestDreams.map(dream => this.renderLatestCard(dream)).join('')}
                    </div>
                    <div class="refresh-btn-wrapper">
                        <button class="btn btn-outline btn-sm refresh-btn" onclick="ExplorePage.refresh()">
                            <span>🔄</span>
                            <span>换一批</span>
                        </button>
                    </div>
                `}
            </div>
        `;
    },

    renderLatestCard(dream) {
        const tags = dream.tags ? (Array.isArray(dream.tags) ? dream.tags : dream.tags.split(',')) : [];
        const isPublic = dream.is_public !== undefined ? dream.is_public : true;

        return `
            <div class="latest-card" onclick="ExplorePage.openDream(${dream.id})">
                <div class="latest-thumbnail">
                    ${dream.thumbnail ? 
                        `<img src="${dream.thumbnail}" alt="${dream.name}" loading="lazy">` : 
                        `<div class="thumbnail-placeholder">
                            ${this.getTimeIcon(dream.time_of_day)}
                        </div>`
                    }
                    <div class="latest-badges">
                        ${isPublic ? '<span class="badge badge-public">🌍</span>' : ''}
                    </div>
                    <div class="latest-stats">
                        <span class="stat-item">
                            <span class="stat-icon">❤️</span>
                            <span class="stat-count">${dream.like_count || 0}</span>
                        </span>
                    </div>
                </div>
                <div class="latest-content">
                    <h4 class="latest-title">${dream.name}</h4>
                    <p class="latest-desc">${dream.description || '暂无描述'}</p>
                    ${tags.length > 0 ? `
                        <div class="latest-tags">
                            ${tags.slice(0, 2).map(tag => `<span class="latest-tag">#${tag.trim()}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="latest-footer">
                        <span class="latest-author">
                            <span class="author-icon">👤</span>
                            <span>${dream.creator_nickname || '梦境创作者'}</span>
                        </span>
                        <span class="latest-time">${DateUtils.timeAgo(dream.created_at)}</span>
                    </div>
                </div>
            </div>
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
        window.addEventListener('beforeunload', () => {
            this.stopAutoSlide();
        });
    },

    async loadData() {
        this.data.loading = true;

        try {
            const [featuredResult, hotResult, latestResult] = await Promise.all([
                this.loadFeaturedDreams(),
                this.loadHotDreams(),
                this.loadLatestDreams()
            ]);

            this.updateCarousel();
            this.updateHotDreams();
            this.updateLatestDreams();

            this.startAutoSlide();
        } catch (error) {
            console.error('加载探索数据失败:', error);
            Toast.error('加载失败，请刷新重试');
        } finally {
            this.data.loading = false;
        }
    },

    async loadFeaturedDreams() {
        try {
            const result = await DreamService.getPublicDreams({
                page: 1,
                pageSize: 5,
                keyword: this.data.searchKeyword
            });

            if (result.code === 0 && result.data) {
                this.data.featuredDreams = result.data.items || result.data || [];
            }
        } catch (error) {
            console.error('加载推荐梦境失败:', error);
        }
    },

    async loadHotDreams() {
        try {
            const result = await DreamService.getPublicDreams({
                page: 1,
                pageSize: 10,
                keyword: this.data.searchKeyword
            });

            if (result.code === 0 && result.data) {
                const items = result.data.items || result.data || [];
                this.data.hotDreams = items.sort((a, b) => 
                    (b.like_count || 0) - (a.like_count || 0)
                );
            }
        } catch (error) {
            console.error('加载热门梦境失败:', error);
        }
    },

    async loadLatestDreams() {
        try {
            const result = await DreamService.getPublicDreams({
                page: Math.floor(Math.random() * 5) + 1,
                pageSize: 6,
                keyword: this.data.searchKeyword
            });

            if (result.code === 0 && result.data) {
                const items = result.data.items || result.data || [];
                this.data.latestDreams = items.sort((a, b) => 
                    new Date(b.created_at || 0) - new Date(a.created_at || 0)
                );
            }
        } catch (error) {
            console.error('加载最新梦境失败:', error);
        }
    },

    handleSearch: Utils.debounce(function(keyword) {
        ExplorePage.data.searchKeyword = keyword;
        ExplorePage.loadData();
    }, 500),

    clearSearch() {
        this.data.searchKeyword = '';
        this.updateSearchBar();
        this.loadData();
    },

    setFilter(type, value) {
        if (type === 'category') {
            this.data.categoryFilter = value;
        } else if (type === 'size') {
            this.data.sizeFilter = value;
        } else if (type === 'style') {
            this.data.styleFilter = value;
        }
        
        this.updateCategoryFilters();
        this.applyFilters();
    },

    applyFilters() {
        Toast.info('筛选功能开发中');
    },

    startAutoSlide() {
        this.stopAutoSlide();
        
        const totalSlides = this.data.featuredDreams.length;
        if (totalSlides <= 1) return;

        this.data.slideTimer = setInterval(() => {
            this.nextSlide();
        }, 5000);
    },

    stopAutoSlide() {
        if (this.data.slideTimer) {
            clearInterval(this.data.slideTimer);
            this.data.slideTimer = null;
        }
    },

    nextSlide() {
        const totalSlides = this.data.featuredDreams.length;
        if (totalSlides <= 1) return;
        
        this.data.currentSlide = (this.data.currentSlide + 1) % totalSlides;
        this.updateCarouselUI();
    },

    prevSlide() {
        const totalSlides = this.data.featuredDreams.length;
        if (totalSlides <= 1) return;
        
        this.data.currentSlide = (this.data.currentSlide - 1 + totalSlides) % totalSlides;
        this.updateCarouselUI();
    },

    goToSlide(index) {
        const totalSlides = this.data.featuredDreams.length;
        if (index < 0 || index >= totalSlides) return;
        
        this.data.currentSlide = index;
        this.updateCarouselUI();
        this.startAutoSlide();
    },

    updateCarouselUI() {
        const container = document.getElementById('carouselContainer');
        if (!container) return;

        const slides = container.querySelectorAll('.carousel-slide');
        const dots = document.querySelectorAll('.carousel-dot');

        slides.forEach((slide, index) => {
            if (index === this.data.currentSlide) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        dots.forEach((dot, index) => {
            if (index === this.data.currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    },

    openDream(dreamId) {
        this.stopAutoSlide();
        Router.navigate('dreamDetail', { id: dreamId });
    },

    viewMore(type) {
        if (type === 'hot') {
            Toast.info('查看更多热门梦境');
        } else if (type === 'latest') {
            Toast.info('查看更多最新梦境');
        }
        Router.navigate('dreams');
    },

    refresh() {
        this.loadData();
    },

    updateSearchBar() {
        const searchBar = document.querySelector('.explore-search');
        if (searchBar) {
            searchBar.outerHTML = this.renderSearchBar();
        }
    },

    updateCarousel() {
        const carousel = document.querySelector('.explore-carousel');
        if (carousel) {
            carousel.outerHTML = this.renderCarousel();
        }
    },

    updateCategoryFilters() {
        const filters = document.querySelector('.explore-filters');
        if (filters) {
            filters.outerHTML = this.renderCategoryFilters();
        }
    },

    updateHotDreams() {
        const section = document.querySelector('.explore-section:has(.section-title:contains(热门排行榜))');
        if (section) {
            section.outerHTML = this.renderHotDreams();
        }
    },

    updateLatestDreams() {
        const sections = document.querySelectorAll('.explore-section');
        const latestSection = sections[sections.length - 1];
        if (latestSection) {
            latestSection.outerHTML = this.renderLatestDreams();
        }
    }
};

window.ExplorePage = ExplorePage;
