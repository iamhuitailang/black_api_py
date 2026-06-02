const DreamDetailPage = {
    data: {
        dreamId: null,
        dream: null,
        loading: false,
        isOwner: false,
        isLiked: false,
        visitors: [],
        blocks: [],
        creatures: [],
        levels: []
    },

    render() {
        const routerParams = Router.getParams ? Router.getParams() : {};
        const queryParams = Utils.getQueryParams();
        this.data.dreamId = routerParams.dream_id || queryParams.dream_id || routerParams.id || queryParams.id;
        
        if (!this.data.dreamId) {
            Toast.error('梦境ID不存在');
            Router.navigate('dreams');
            return;
        }

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="dream-detail-page page no-tabbar">
                <div class="header">
                    <span class="header-back" onclick="DreamDetailPage.goBack()">‹</span>
                    <span class="header-title">梦境详情</span>
                    <span class="header-action" onclick="DreamDetailPage.share()">
                        <span class="action-icon">📤</span>
                    </span>
                </div>
                <div class="page has-header" id="dreamDetailContent">
                    ${this.renderLoading()}
                </div>
            </div>
        `;

        this.bindEvents();
        this.loadDreamDetail();
    },

    renderLoading() {
        return `
            <div class="detail-loading">
                <span class="loading" style="width: 32px; height: 32px; border-width: 3px; border-color: rgba(168, 85, 247, 0.3); border-top-color: var(--primary-color);"></span>
                <span>加载梦境详情中...</span>
            </div>
        `;
    },

    renderContent() {
        const dream = this.data.dream;
        if (!dream) return this.renderEmpty();

        const isPublic = dream.is_public !== undefined ? dream.is_public : false;
        const tags = dream.tags ? (Array.isArray(dream.tags) ? dream.tags : dream.tags.split(',')) : [];

        return `
            <div class="detail-content">
                ${this.renderDreamHeader(dream, isPublic, tags)}
                ${this.renderQuickActions(dream, isPublic)}
                ${this.renderSettings(dream)}
                ${this.renderStatistics(dream)}
                ${this.renderBlocks()}
                ${this.renderCreatures()}
                ${this.renderLevels()}
                ${this.renderVisitors()}
            </div>
        `;
    },

    renderDreamHeader(dream, isPublic, tags) {
        return `
            <div class="detail-hero">
                <div class="detail-thumbnail">
                    ${dream.thumbnail ? 
                        `<img src="${dream.thumbnail}" alt="${dream.name}">` : 
                        `<div class="thumbnail-placeholder-large">
                            ${this.getTimeIcon(dream.time_of_day)}
                        </div>`
                    }
                    <div class="detail-hero-overlay"></div>
                    <div class="detail-hero-info">
                        <div class="detail-badges">
                            ${isPublic ? '<span class="badge badge-light">🌍 公开</span>' : '<span class="badge badge-light">🔒 私有</span>'}
                            ${dream.is_featured ? '<span class="badge badge-featured">⭐ 精选</span>' : ''}
                        </div>
                        <h1 class="detail-title">${dream.name}</h1>
                        <p class="detail-desc">${dream.description || '暂无描述'}</p>
                        ${tags.length > 0 ? `
                            <div class="detail-tags">
                                ${tags.map(tag => `<span class="detail-tag">#${tag.trim()}</span>`).join('')}
                            </div>
                        ` : ''}
                        <div class="detail-author">
                            <div class="author-avatar-large">
                                <span class="avatar-placeholder">👤</span>
                            </div>
                            <div class="author-info">
                                <div class="author-name">${dream.creator_nickname || '梦境创作者'}</div>
                                <div class="create-time">创建于 ${DateUtils.formatTime(dream.created_at, 'YYYY-MM-DD')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderQuickActions(dream, isPublic) {
        return `
            <div class="quick-actions">
                ${this.data.isOwner ? `
                    <button class="quick-action-btn primary" onclick="DreamDetailPage.enterGame('edit')">
                        <span class="action-icon-large">🏗️</span>
                        <span class="action-text-large">进入建造</span>
                    </button>
                ` : `
                    <button class="quick-action-btn primary" onclick="DreamDetailPage.enterGame('visit')">
                        <span class="action-icon-large">🚪</span>
                        <span class="action-text-large">访问梦境</span>
                    </button>
                `}
                <button class="quick-action-btn ${this.data.isLiked ? 'liked' : ''}" onclick="DreamDetailPage.toggleLike()">
                    <span class="action-icon-large">${this.data.isLiked ? '❤️' : '🤍'}</span>
                    <span class="action-text-large">${this.data.isLiked ? '已赞' : '点赞'}</span>
                    <span class="action-count">${dream.like_count || 0}</span>
                </button>
                <button class="quick-action-btn" onclick="DreamDetailPage.share()">
                    <span class="action-icon-large">📤</span>
                    <span class="action-text-large">分享</span>
                </button>
                ${this.data.isOwner ? `
                    <button class="quick-action-btn ${isPublic ? 'active' : ''}" onclick="DreamDetailPage.togglePublic()">
                        <span class="action-icon-large">${isPublic ? '🌍' : '🔒'}</span>
                        <span class="action-text-large">${isPublic ? '公开' : '私有'}</span>
                    </button>
                ` : ''}
            </div>
        `;
    },

    renderSettings(dream) {
        const weatherName = this.getWeatherName(dream.weather);
        const timeName = this.getTimeName(dream.time_of_day);
        const gravity = dream.gravity !== undefined ? dream.gravity : 1.0;

        return `
            <div class="detail-section">
                <h3 class="section-title">
                    <span class="title-icon">⚙️</span>
                    梦境设置
                </h3>
                <div class="settings-grid">
                    <div class="setting-card">
                        <div class="setting-icon">${this.getWeatherIcon(dream.weather)}</div>
                        <div class="setting-name">天气</div>
                        <div class="setting-value">${weatherName}</div>
                    </div>
                    <div class="setting-card">
                        <div class="setting-icon">${this.getTimeIcon(dream.time_of_day)}</div>
                        <div class="setting-name">昼夜</div>
                        <div class="setting-value">${timeName}</div>
                    </div>
                    <div class="setting-card">
                        <div class="setting-icon">🌍</div>
                        <div class="setting-name">重力</div>
                        <div class="setting-value">${gravity}g</div>
                    </div>
                    <div class="setting-card">
                        <div class="setting-icon">📐</div>
                        <div class="setting-name">大小</div>
                        <div class="setting-value">${dream.width || 64} × ${dream.height || 64} × ${dream.depth || 32}</div>
                    </div>
                </div>
            </div>
        `;
    },

    renderStatistics(dream) {
        return `
            <div class="detail-section">
                <h3 class="section-title">
                    <span class="title-icon">📊</span>
                    数据统计
                </h3>
                <div class="stats-grid">
                    <div class="stat-item-card">
                        <div class="stat-number">${dream.view_count || 0}</div>
                        <div class="stat-label">浏览量</div>
                    </div>
                    <div class="stat-item-card">
                        <div class="stat-number">${dream.visit_count || 0}</div>
                        <div class="stat-label">访问数</div>
                    </div>
                    <div class="stat-item-card">
                        <div class="stat-number">${dream.like_count || 0}</div>
                        <div class="stat-label">点赞数</div>
                    </div>
                    <div class="stat-item-card">
                        <div class="stat-number">${dream.share_count || 0}</div>
                        <div class="stat-label">分享数</div>
                    </div>
                </div>
            </div>
        `;
    },

    renderBlocks() {
        const blocks = this.data.blocks;
        
        if (!blocks || blocks.length === 0) {
            return `
                <div class="detail-section">
                    <h3 class="section-title">
                        <span class="title-icon">🧱</span>
                        方块统计
                    </h3>
                    <div class="empty-content">
                        <span class="empty-icon">🧱</span>
                        <p>暂无方块数据</p>
                    </div>
                </div>
            `;
        }

        const totalBlocks = blocks.reduce((sum, b) => sum + (b.count || 0), 0);

        return `
            <div class="detail-section">
                <h3 class="section-title">
                    <span class="title-icon">🧱</span>
                    方块统计
                    <span class="section-count">${totalBlocks} 个</span>
                </h3>
                <div class="blocks-grid">
                    ${blocks.slice(0, 8).map(block => `
                        <div class="block-item">
                            <div class="block-icon" style="background: ${block.color || '#e9d5ff'}">
                                ${block.icon || '⬜'}
                            </div>
                            <div class="block-name">${block.name}</div>
                            <div class="block-count">${block.count || 0}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderCreatures() {
        const creatures = this.data.creatures;
        
        if (!creatures || creatures.length === 0) {
            return `
                <div class="detail-section">
                    <h3 class="section-title">
                        <span class="title-icon">🐾</span>
                        生物统计
                    </h3>
                    <div class="empty-content">
                        <span class="empty-icon">🐾</span>
                        <p>暂无生物数据</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="detail-section">
                <h3 class="section-title">
                    <span class="title-icon">🐾</span>
                    生物统计
                    <span class="section-count">${creatures.length} 种</span>
                </h3>
                <div class="creatures-grid">
                    ${creatures.map(creature => `
                        <div class="creature-item">
                            <div class="creature-icon">${creature.icon || '🐾'}</div>
                            <div class="creature-name">${creature.name}</div>
                            <div class="creature-count">${creature.count || 0}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderLevels() {
        const levels = this.data.levels;
        
        if (!levels || levels.length === 0) {
            return `
                <div class="detail-section">
                    <h3 class="section-title">
                        <span class="title-icon">🎯</span>
                        关卡列表
                    </h3>
                    <div class="empty-content">
                        <span class="empty-icon">🎯</span>
                        <p>暂无关卡数据</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="detail-section">
                <h3 class="section-title">
                    <span class="title-icon">🎯</span>
                    关卡列表
                    <span class="section-count">${levels.length} 关</span>
                </h3>
                <div class="levels-list">
                    ${levels.map((level, index) => `
                        <div class="level-item">
                            <div class="level-number">${index + 1}</div>
                            <div class="level-info">
                                <div class="level-name">${level.name}</div>
                                <div class="level-desc">${level.description || '暂无描述'}</div>
                            </div>
                            <div class="level-stars">
                                ${[1, 2, 3].map(star => `
                                    <span class="star ${star <= (level.stars || 0) ? 'filled' : ''}">★</span>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderVisitors() {
        const visitors = this.data.visitors;
        
        if (!visitors || visitors.length === 0) {
            return `
                <div class="detail-section">
                    <h3 class="section-title">
                        <span class="title-icon">👥</span>
                        访客记录
                    </h3>
                    <div class="empty-content">
                        <span class="empty-icon">👥</span>
                        <p>暂无访客记录</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="detail-section">
                <h3 class="section-title">
                    <span class="title-icon">👥</span>
                    访客记录
                    <span class="section-count">${visitors.length} 人</span>
                </h3>
                <div class="visitors-list">
                    ${visitors.map(visitor => `
                        <div class="visitor-item">
                            <div class="visitor-avatar">
                                <span class="avatar-placeholder-small">👤</span>
                            </div>
                            <div class="visitor-info">
                                <div class="visitor-name">${visitor.nickname || '匿名用户'}</div>
                                <div class="visit-time">${DateUtils.timeAgo(visitor.visited_at)}</div>
                            </div>
                            ${visitor.is_online ? '<span class="online-badge">在线</span>' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderEmpty() {
        return `
            <div class="empty-content">
                <span class="empty-icon">🌙</span>
                <p>梦境不存在或已被删除</p>
                <button class="btn btn-primary btn-sm" onclick="DreamDetailPage.goBack()">返回</button>
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

    getWeatherName(weather) {
        const names = {
            sunny: '晴天',
            cloudy: '多云',
            rainy: '雨天',
            snowy: '雪天',
            stormy: '雷暴',
            foggy: '雾天'
        };
        return names[weather] || '未知';
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

    getTimeName(time) {
        const names = {
            dawn: '黎明',
            day: '白天',
            dusk: '黄昏',
            night: '夜晚'
        };
        return names[time] || '未知';
    },

    bindEvents() {
    },

    async loadDreamDetail() {
        this.data.loading = true;

        try {
            const result = await DreamService.getDreamDetail(this.data.dreamId);
            
            if (result.code === 0 && result.data) {
                this.data.dream = result.data;
                this.data.isOwner = result.data.is_owner || false;
                this.data.isLiked = result.data.is_liked || false;
                this.data.visitors = result.data.visitors || [];
                this.data.blocks = result.data.blocks || [];
                this.data.creatures = result.data.creatures || [];
                this.data.levels = result.data.levels || [];
                
                this.updateContent();
            } else {
                Toast.error(result.message || '加载失败');
                this.updateContent();
            }
        } catch (error) {
            console.error('加载梦境详情失败:', error);
            Toast.error('加载失败，请刷新重试');
            this.updateContent();
        } finally {
            this.data.loading = false;
        }
    },

    enterGame(mode = 'visit') {
        if (!this.data.dream) return;
        
        Router.navigate('game', { dream_id: this.data.dreamId, mode });
    },

    async toggleLike() {
        if (!this.data.dream) return;

        try {
            const result = await DreamService.likeDream(this.data.dreamId);
            
            if (result.code === 0) {
                this.data.isLiked = !this.data.isLiked;
                
                if (this.data.isLiked) {
                    this.data.dream.like_count = (this.data.dream.like_count || 0) + 1;
                    Toast.success('点赞成功！');
                } else {
                    this.data.dream.like_count = Math.max(0, (this.data.dream.like_count || 0) - 1);
                    Toast.info('已取消点赞');
                }
                
                this.updateContent();
            } else {
                Toast.error(result.message || '操作失败');
            }
        } catch (error) {
            console.error('点赞操作失败:', error);
            Toast.error('操作失败，请重试');
        }
    },

    async togglePublic() {
        if (!this.data.dream) return;
        
        const currentIsPublic = this.data.dream.is_public !== undefined ? this.data.dream.is_public : false;
        const confirmMsg = currentIsPublic 
            ? '确定要将此梦境设为私有吗？其他用户将无法访问。'
            : '确定要公开此梦境吗？其他用户将可以访问和访问。';
        
        if (!confirm(confirmMsg)) return;

        try {
            const result = await DreamService.togglePublic(this.data.dreamId);
            
            if (result.code === 0) {
                this.data.dream.is_public = !currentIsPublic;
                Toast.success(currentIsPublic ? '已设为私有' : '已设为公开');
                this.updateContent();
            } else {
                Toast.error(result.message || '操作失败');
            }
        } catch (error) {
            console.error('切换公开状态失败:', error);
            Toast.error('操作失败，请重试');
        }
    },

    share() {
        if (!this.data.dream) return;

        const shareData = {
            title: this.data.dream.name,
            text: this.data.dream.description || '来探索这个精彩的梦境吧！',
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData)
                .then(() => {
                    Toast.success('分享成功！');
                    if (this.data.dream) {
                        this.data.dream.share_count = (this.data.dream.share_count || 0) + 1;
                    }
                })
                .catch(() => {
                });
        } else {
            Utils.copyToClipboard(window.location.href)
                .then(() => {
                    Toast.success('链接已复制到剪贴板');
                    if (this.data.dream) {
                        this.data.dream.share_count = (this.data.dream.share_count || 0) + 1;
                    }
                })
                .catch(() => {
                    Toast.info(window.location.href);
                });
        }
    },

    goBack() {
        Router.navigate('dreams');
    },

    updateContent() {
        const contentContainer = document.getElementById('dreamDetailContent');
        if (contentContainer) {
            contentContainer.innerHTML = this.renderContent();
        }
    }
};

window.DreamDetailPage = DreamDetailPage;
