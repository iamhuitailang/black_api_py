const ExchangePage = {
    currentTab: 'pending',
    exchanges: [],
    tabCounts: { pending: 0, in_progress: 0, completed: 0 },

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page-container">
                <header class="page-header">
                    <div class="header-left">
                        <div class="header-logo">🔄</div>
                        <h1>我的交换</h1>
                    </div>
                </header>

                <div class="tab-header">
                    <div class="tab-item active" data-tab="pending">
                        待确认
                        <span class="tab-badge" id="badge-pending">0</span>
                    </div>
                    <div class="tab-item" data-tab="in_progress">
                        进行中
                        <span class="tab-badge" id="badge-in_progress">0</span>
                    </div>
                    <div class="tab-item" data-tab="completed">
                        已完成
                        <span class="tab-badge" id="badge-completed">0</span>
                    </div>
                </div>

                <div class="content-scroll">
                    <div id="tab-pending" class="tab-content">
                        <div class="exchange-list" id="list-pending">
                            <div class="loading-state">
                                <div class="loading"></div>
                                <span>加载中...</span>
                            </div>
                        </div>
                    </div>

                    <div id="tab-in_progress" class="tab-content hidden">
                        <div class="exchange-list" id="list-in_progress">
                        </div>
                    </div>

                    <div id="tab-completed" class="tab-content hidden">
                        <div class="exchange-list" id="list-completed">
                        </div>
                    </div>
                </div>

                <nav class="bottom-nav">
                    <div class="nav-item" data-route="home">
                        <span class="nav-icon">🏠</span>
                        <span class="nav-label">首页</span>
                    </div>
                    <div class="nav-item" data-route="skill">
                        <span class="nav-icon">⚡</span>
                        <span class="nav-label">技能</span>
                    </div>
                    <div class="nav-item add-btn" data-route="skill">
                        <span class="nav-icon">+</span>
                    </div>
                    <div class="nav-item active" data-route="exchange">
                        <span class="nav-icon">🔄</span>
                        <span class="nav-label">交换</span>
                    </div>
                    <div class="nav-item" data-route="profile">
                        <span class="nav-icon">👤</span>
                        <span class="nav-label">我的</span>
                    </div>
                </nav>
            </div>

            <div class="modal-overlay" id="exchange-detail-modal">
                <div class="modal modal-bottom modal-large">
                    <div class="modal-header">
                        <h3 class="modal-title">交换详情</h3>
                        <button class="modal-close" id="exchange-detail-close">&times;</button>
                    </div>
                    <div class="modal-body" id="exchange-detail-content">
                    </div>
                </div>
            </div>

            <div class="modal-overlay" id="review-modal">
                <div class="modal modal-bottom">
                    <div class="modal-header">
                        <h3 class="modal-title">评价</h3>
                        <button class="modal-close" id="review-modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="review-form">
                            <div class="form-group">
                                <label class="form-label">评分</label>
                                <div class="rating-stars" id="rating-stars">
                                    <span class="star" data-rating="1">★</span>
                                    <span class="star" data-rating="2">★</span>
                                    <span class="star" data-rating="3">★</span>
                                    <span class="star" data-rating="4">★</span>
                                    <span class="star" data-rating="5">★</span>
                                </div>
                                <input type="hidden" id="review-score" value="5">
                            </div>
                            <div class="form-group">
                                <label class="form-label">评价内容</label>
                                <textarea id="review-content" class="form-control" placeholder="分享你的交换体验..." rows="4"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="review-modal-cancel">取消</button>
                        <button type="button" class="btn btn-primary" id="review-modal-submit">提交评价</button>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        await this.loadExchanges();
    },

    bindEvents() {
        const navItems = document.querySelectorAll('.bottom-nav .nav-item[data-route]');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                if (route) Router.navigate(route);
            });
        });

        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });

        document.getElementById('exchange-detail-close').addEventListener('click', () => {
            document.getElementById('exchange-detail-modal').classList.remove('show');
        });

        document.getElementById('review-modal-close').addEventListener('click', () => {
            document.getElementById('review-modal').classList.remove('show');
        });
        document.getElementById('review-modal-cancel').addEventListener('click', () => {
            document.getElementById('review-modal').classList.remove('show');
        });

        document.getElementById('review-modal-submit').addEventListener('click', () => this.submitReview());

        this.bindRatingStars();
    },

    bindRatingStars() {
        const stars = document.querySelectorAll('#rating-stars .star');
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                const rating = index + 1;
                document.getElementById('review-score').value = rating;
                this.updateStars(rating);
            });

            star.addEventListener('mouseenter', () => {
                this.updateStars(index + 1, true);
            });
        });

        const container = document.getElementById('rating-stars');
        container.addEventListener('mouseleave', () => {
            const currentRating = parseInt(document.getElementById('review-score').value) || 5;
            this.updateStars(currentRating);
        });
    },

    updateStars(rating, isHover = false) {
        const stars = document.querySelectorAll('#rating-stars .star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
                if (isHover) star.classList.add('hover');
            } else {
                star.classList.remove('active', 'hover');
            }
        });
    },

    switchTab(tab) {
        this.currentTab = tab;

        document.querySelectorAll('.tab-item').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });

        ['pending', 'in_progress', 'completed'].forEach(t => {
            const tabContent = document.getElementById(`tab-${t}`);
            if (tabContent) {
                tabContent.classList.toggle('hidden', t !== tab);
            }
        });

        const list = document.getElementById(`list-${tab}`);
        if (list && list.innerHTML.trim() === '') {
            this.renderTabContent(tab);
        }
    },

    async loadExchanges() {
        try {
            const result = await ApiService.get('/jn/exchange/my/get');
            if (result.code === 0 && result.data) {
                this.exchanges = result.data;
                this.calculateCounts();
                this.updateBadges();
                this.renderTabContent('pending');
            }
        } catch (error) {
            console.error('加载交换记录失败:', error);
            this.renderEmpty('pending');
        }
    },

    calculateCounts() {
        this.tabCounts = {
            pending: this.exchanges.filter(e => e.status === 'pending').length,
            in_progress: this.exchanges.filter(e => ['accepted', 'in_progress'].includes(e.status)).length,
            completed: this.exchanges.filter(e => ['completed', 'rejected', 'cancelled'].includes(e.status)).length
        };
    },

    updateBadges() {
        ['pending', 'in_progress', 'completed'].forEach(tab => {
            const badge = document.getElementById(`badge-${tab}`);
            if (badge) {
                badge.textContent = this.tabCounts[tab] || 0;
                badge.style.display = this.tabCounts[tab] > 0 ? 'inline-block' : 'none';
            }
        });
    },

    renderTabContent(tab) {
        const list = document.getElementById(`list-${tab}`);
        if (!list) return;

        let filtered = [];
        if (tab === 'pending') {
            filtered = this.exchanges.filter(e => e.status === 'pending');
        } else if (tab === 'in_progress') {
            filtered = this.exchanges.filter(e => ['accepted', 'in_progress'].includes(e.status));
        } else {
            filtered = this.exchanges.filter(e => ['completed', 'rejected', 'cancelled'].includes(e.status));
        }

        if (filtered.length === 0) {
            this.renderEmpty(tab);
            return;
        }

        list.innerHTML = filtered.map(exchange => this.renderExchangeCard(exchange)).join('');

        list.querySelectorAll('.exchange-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                const exchange = this.exchanges.find(e => e.id === parseInt(id));
                if (exchange) this.showExchangeDetail(exchange);
            });
        });
    },

    renderExchangeCard(exchange) {
        const isFromMe = exchange.is_from_me;
        const otherUser = isFromMe ? exchange.to_user_info : exchange.from_user_info;
        const statusDisplay = this.getStatusDisplay(exchange.status);

        return `
            <div class="exchange-card" data-id="${exchange.id}">
                <div class="exchange-header">
                    <img class="user-avatar" src="${Utils.getAvatarUrl(otherUser?.avatar, otherUser?.nickname)}" alt="">
                    <div class="user-info">
                        <span class="user-name">${otherUser?.nickname || '用户'}</span>
                        <span class="exchange-role">${isFromMe ? '我发起的' : '发给我的'}</span>
                    </div>
                    <span class="status-badge ${statusDisplay.class}">${statusDisplay.text}</span>
                </div>

                <div class="exchange-skills">
                    <div class="skill-pair">
                        <div class="skill-item offer">
                            <span class="skill-label">我提供</span>
                            <span class="skill-name">${exchange.offer_skill?.name || '-'}</span>
                        </div>
                        <span class="exchange-arrow">→</span>
                        <div class="skill-item need">
                            <span class="skill-label">我想学</span>
                            <span class="skill-name">${exchange.need_skill?.name || '-'}</span>
                        </div>
                    </div>
                </div>

                <div class="exchange-footer">
                    <span class="exchange-time">${Utils.formatDate(exchange.created_at)}</span>
                    <div class="exchange-actions">
                        ${this.renderCardActions(exchange)}
                    </div>
                </div>
            </div>
        `;
    },

    getStatusDisplay(status) {
        const statuses = {
            'pending': { text: '待确认', class: 'pending' },
            'accepted': { text: '已接受', class: 'accepted' },
            'in_progress': { text: '进行中', class: 'in-progress' },
            'completed': { text: '已完成', class: 'completed' },
            'rejected': { text: '已拒绝', class: 'rejected' },
            'cancelled': { text: '已取消', class: 'cancelled' }
        };
        return statuses[status] || { text: status, class: 'pending' };
    },

    renderCardActions(exchange) {
        const isFromMe = exchange.is_from_me;
        let actions = '';

        if (exchange.status === 'pending') {
            if (!isFromMe) {
                actions += `<button class="btn btn-sm btn-primary action-btn-inline" onclick="event.stopPropagation(); ExchangePage.acceptExchange(${exchange.id})">接受</button>`;
                actions += `<button class="btn btn-sm btn-secondary action-btn-inline" onclick="event.stopPropagation(); ExchangePage.rejectExchange(${exchange.id})">拒绝</button>`;
            } else {
                actions += `<button class="btn btn-sm btn-secondary action-btn-inline" onclick="event.stopPropagation(); ExchangePage.cancelExchange(${exchange.id})">取消</button>`;
            }
        } else if (exchange.status === 'accepted' || exchange.status === 'in_progress') {
            if (!isFromMe) {
                actions += `<button class="btn btn-sm btn-primary action-btn-inline" onclick="event.stopPropagation(); ExchangePage.startExchange(${exchange.id})">开始交换</button>`;
            }
            actions += `<button class="btn btn-sm btn-secondary action-btn-inline" onclick="event.stopPropagation(); ExchangePage.completeExchange(${exchange.id})">完成交换</button>`;
        } else if (exchange.status === 'completed') {
            if (!exchange.reviewed) {
                actions += `<button class="btn btn-sm btn-primary action-btn-inline" onclick="event.stopPropagation(); ExchangePage.showReviewModal(${exchange.id})">去评价</button>`;
            }
        }

        return actions;
    },

    renderEmpty(tab) {
        const list = document.getElementById(`list-${tab}`);
        if (!list) return;

        const messages = {
            pending: '暂无待确认的交换',
            in_progress: '暂无进行中的交换',
            completed: '暂无已完成的交换'
        };

        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>${messages[tab] || '暂无数据'}</p>
                <button class="btn btn-primary" onclick="Router.navigate('match')">去寻找匹配</button>
            </div>
        `;
    },

    currentExchangeId: null,

    showExchangeDetail(exchange) {
        this.currentExchangeId = exchange.id;
        const modal = document.getElementById('exchange-detail-modal');
        const content = document.getElementById('exchange-detail-content');

        const isFromMe = exchange.is_from_me;
        const otherUser = isFromMe ? exchange.to_user_info : exchange.from_user_info;
        const statusDisplay = this.getStatusDisplay(exchange.status);

        content.innerHTML = `
            <div class="exchange-detail-header">
                <img class="user-avatar-large" src="${Utils.getAvatarUrl(otherUser?.avatar, otherUser?.nickname)}" alt="">
                <div class="user-info-main">
                    <h3 class="user-name-large">${otherUser?.nickname || '用户'}</h3>
                    <span class="status-badge ${statusDisplay.class}">${statusDisplay.text}</span>
                    <div class="credit-info">
                        <span class="credit-score" style="color: ${Utils.getCreditColor(otherUser?.credit)}">★ ${otherUser?.credit || 100}</span>
                    </div>
                </div>
            </div>

            <div class="exchange-detail-section">
                <h4 class="detail-label">交换内容</h4>
                <div class="skill-pair-detail">
                    <div class="skill-block">
                        <span class="block-label offer">我提供</span>
                        <div class="skill-info-large">
                            <span class="skill-name">${exchange.offer_skill?.name || '-'}</span>
                            ${exchange.offer_skill?.level ? `<span class="skill-level">${Utils.getLevelText(exchange.offer_skill.level)}</span>` : ''}
                        </div>
                    </div>
                    <div class="arrow-center">↔</div>
                    <div class="skill-block">
                        <span class="block-label need">我想学</span>
                        <div class="skill-info-large">
                            <span class="skill-name">${exchange.need_skill?.name || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>

            ${exchange.message ? `
            <div class="exchange-detail-section">
                <h4 class="detail-label">留言</h4>
                <p class="message-text">${exchange.message}</p>
            </div>
            ` : ''}

            <div class="exchange-detail-section">
                <h4 class="detail-label">交换信息</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">发起时间</span>
                        <span class="info-value">${Utils.formatDate(exchange.created_at)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">发起方</span>
                        <span class="info-value">${isFromMe ? '我' : '对方'}</span>
                    </div>
                </div>
            </div>

            <div class="action-buttons">
                ${this.renderCardActions(exchange)}
            </div>
        `;

        modal.classList.add('show');
    },

    async acceptExchange(id) {
        if (!confirm('确定接受这个交换邀请吗？')) return;

        try {
            const result = await ApiService.post(`/jn/exchange/accept?exchange_id=${id}`);
            if (result.code === 0) {
                Toast.success('已接受邀请');
                document.getElementById('exchange-detail-modal').classList.remove('show');
                await this.loadExchanges();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error(error.message || '网络错误');
        }
    },

    async rejectExchange(id) {
        if (!confirm('确定拒绝这个交换邀请吗？')) return;

        try {
            const result = await ApiService.post(`/jn/exchange/reject?exchange_id=${id}`);
            if (result.code === 0) {
                Toast.success('已拒绝邀请');
                document.getElementById('exchange-detail-modal').classList.remove('show');
                await this.loadExchanges();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error(error.message || '网络错误');
        }
    },

    async cancelExchange(id) {
        if (!confirm('确定取消这个交换邀请吗？')) return;

        try {
            const result = await ApiService.post(`/jn/exchange/cancel?exchange_id=${id}`);
            if (result.code === 0) {
                Toast.success('已取消邀请');
                document.getElementById('exchange-detail-modal').classList.remove('show');
                await this.loadExchanges();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error(error.message || '网络错误');
        }
    },

    async startExchange(id) {
        if (!confirm('确定开始交换吗？')) return;

        try {
            const result = await ApiService.post(`/jn/exchange/start?exchange_id=${id}`);
            if (result.code === 0) {
                Toast.success('交换已开始');
                document.getElementById('exchange-detail-modal').classList.remove('show');
                await this.loadExchanges();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error(error.message || '网络错误');
        }
    },

    async completeExchange(id) {
        if (!confirm('确定完成交换吗？完成后可以进行评价。')) return;

        try {
            const result = await ApiService.post(`/jn/exchange/complete?exchange_id=${id}`);
            if (result.code === 0) {
                Toast.success('交换已完成');
                document.getElementById('exchange-detail-modal').classList.remove('show');
                await this.loadExchanges();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error(error.message || '网络错误');
        }
    },

    showReviewModal(exchangeId) {
        this.currentExchangeId = exchangeId;
        document.getElementById('exchange-detail-modal').classList.remove('show');

        document.getElementById('review-score').value = 5;
        document.getElementById('review-content').value = '';
        this.updateStars(5);

        document.getElementById('review-modal').classList.add('show');
    },

    async submitReview() {
        const score = parseInt(document.getElementById('review-score').value) || 5;
        const content = document.getElementById('review-content').value.trim();

        const btn = document.getElementById('review-modal-submit');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> 提交中...';

        try {
            const result = await ApiService.post('/jn/review/create', {
                exchange_id: this.currentExchangeId,
                score,
                content
            });

            if (result.code === 0) {
                Toast.success('评价提交成功');
                document.getElementById('review-modal').classList.remove('show');
                await this.loadExchanges();
            } else {
                Toast.error(result.msg || '提交失败');
            }
        } catch (error) {
            Toast.error(error.message || '网络错误');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '提交评价';
        }
    }
};

window.ExchangePage = ExchangePage;
