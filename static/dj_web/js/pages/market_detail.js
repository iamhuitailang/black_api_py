const MarketDetailPage = {
    marketId: null,
    marketData: null,
    isFavorite: false,
    hasCheckedIn: false,
    
    render(params) {
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
        this.marketId = parseInt(urlParams.get('id')) || parseInt(params[0]) || 0;
        
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="app-container">
                <div class="header">
                    <div class="header-back" onclick="Router.navigate('market')">←</div>
                    <div class="header-title" id="detailTitle">集市详情</div>
                    <div class="header-action" id="favoriteBtn" onclick="MarketDetailPage.toggleFavorite()">🤍</div>
                </div>
                
                <div class="main-content" id="mainContent">
                    <div class="loading-container">
                        <div class="loading"></div>
                    </div>
                </div>
            </div>
            
            <div id="toastContainer" class="toast-container"></div>
        `;
        
        this.loadData();
    },
    
    async loadData() {
        if (!this.marketId) {
            Toast.error('集市ID无效');
            return;
        }
        
        try {
            const [marketResult, favoriteResult, checkinResult] = await Promise.all([
                MarketService.getDetail(this.marketId),
                FavoriteService.check(this.marketId),
                CheckinService.checkToday(this.marketId)
            ]).catch(() => [null, null, null]);
            
            if (marketResult && marketResult.code === 0) {
                this.marketData = marketResult.data;
                document.getElementById('detailTitle').textContent = this.marketData.name || '集市详情';
                this.isFavorite = favoriteResult?.data?.is_favorite || false;
                this.hasCheckedIn = checkinResult?.data?.has_checked_in || false;
                
                const favoriteBtn = document.getElementById('favoriteBtn');
                favoriteBtn.textContent = this.isFavorite ? '❤' : '🤍';
                
                this.renderDetail();
            } else {
                Toast.error(marketResult?.msg || '加载失败');
            }
        } catch (error) {
            Toast.error(error.message || '网络错误');
        }
    },
    
    renderDetail() {
        const mainContent = document.getElementById('mainContent');
        const item = this.marketData;
        
        const statusMap = {
            1: { text: '营业中', class: 'badge-success' },
            2: { text: '暂停', class: 'badge-warning' },
            3: { text: '关闭', class: 'badge-danger' }
        };
        const status = statusMap[item.status] || statusMap[1];
        
        mainContent.innerHTML = `
            <div class="card mb-2">
                <div class="card-body">
                    <div class="flex-between mb-2">
                        <h2 class="card-title" style="margin:0;">${item.name || '未命名集市'}</h2>
                        <span class="badge ${status.class}">${status.text}</span>
                    </div>
                    <div class="market-rating mb-2">
                        <span class="rating-stars">${'★'.repeat(Math.floor(item.rating || 0))}${'☆'.repeat(5 - Math.floor(item.rating || 0))}</span>
                        <span class="rating-value">${item.rating || 0}</span>
                        <span style="color:var(--text-light);">(${item.rating_count || 0}人评价)</span>
                    </div>
                </div>
            </div>
            
            <div class="card mb-2">
                <div class="card-header">
                    <span class="card-title">📍 基本信息</span>
                </div>
                <div class="card-body">
                    ${item.location ? `
                    <div class="market-info-item mb-2">
                        <span class="icon">🏠</span>
                        <span>地址: ${item.location}</span>
                    </div>
                    ` : ''}
                    
                    <div class="market-info-item mb-2">
                        <span class="icon">⏰</span>
                        <span>营业时间: ${item.open_time || '--'} - ${item.close_time || '--'}</span>
                    </div>
                    
                    ${item.lunar_dates ? `
                    <div class="market-info-item mb-2">
                        <span class="icon">📅</span>
                        <span>农历日期: ${item.lunar_dates}</span>
                    </div>
                    ` : ''}
                    
                    ${item.solar_dates ? `
                    <div class="market-info-item mb-2">
                        <span class="icon">📆</span>
                        <span>公历日期: ${item.solar_dates}</span>
                    </div>
                    ` : ''}
                    
                    <div class="market-info-item mb-2">
                        <span class="icon">📊</span>
                        <span>规模: ${item.scale || '未填写'}</span>
                    </div>
                    
                    <div class="market-info-item mb-2">
                        <span class="icon">🏪</span>
                        <span>摊位数量: 约${item.booth_count || 0}个</span>
                    </div>
                    
                    <div class="market-info-item">
                        <span class="icon">🔥</span>
                        <span>热度: ${item.hot || 0}</span>
                    </div>
                </div>
            </div>
            
            ${item.admin_phone ? `
            <div class="card mb-2">
                <div class="card-header">
                    <span class="card-title">📞 联系方式</span>
                </div>
                <div class="card-body">
                    <div class="flex-between" onclick="MarketDetailPage.callPhone('${item.admin_phone}')" style="cursor:pointer;">
                        <div class="flex-center gap-1">
                            <span style="font-size:24px;">📞</span>
                            <div>
                                <div style="font-size:12px;color:var(--text-secondary);">集市管理办电话</div>
                                <div style="font-weight:500;">${item.admin_phone}</div>
                            </div>
                        </div>
                        <span class="btn btn-outline-primary btn-sm">拨打</span>
                    </div>
                </div>
            </div>
            ` : ''}
            
            ${item.description ? `
            <div class="card mb-2">
                <div class="card-header">
                    <span class="card-title">📝 集市简介</span>
                </div>
                <div class="card-body">
                    <p style="color:var(--text-secondary);line-height:1.8;">${item.description}</p>
                </div>
            </div>
            ` : ''}
            
            <div class="card mb-2">
                <div class="card-header">
                    <span class="card-title">🏪 摊位列表</span>
                </div>
                <div class="card-body" id="boothPreviewList">
                    <div class="loading-container">
                        <div class="loading"></div>
                    </div>
                </div>
            </div>
            
            <div class="card mb-2">
                <div class="card-header">
                    <span class="card-title">💰 价格参考</span>
                </div>
                <div class="card-body" id="pricePreviewList">
                    <div class="loading-container">
                        <div class="loading"></div>
                    </div>
                </div>
            </div>
            
            <div class="card mb-2">
                <div class="card-header">
                    <span class="card-title">📝 用户评价</span>
                </div>
                <div class="card-body" id="reviewPreviewList">
                    <div class="loading-container">
                        <div class="loading"></div>
                    </div>
                </div>
            </div>
            
            <div class="card mb-2">
                <div class="card-header">
                    <span class="card-title">❓ 求助问答</span>
                </div>
                <div class="card-body" id="qaPreviewList">
                    <div class="loading-container">
                        <div class="loading"></div>
                    </div>
                </div>
            </div>
            
            <div style="height:80px;"></div>
            
            <div class="tab-bar" style="display:flex;gap:12px;padding:12px 16px;">
                <button class="btn btn-block ${this.hasCheckedIn ? 'btn-secondary' : 'btn-primary'}" onclick="MarketDetailPage.checkin()" ${this.hasCheckedIn ? 'disabled' : ''}>
                    ${this.hasCheckedIn ? '✓ 已打卡' : '📍 打卡'}
                </button>
                <button class="btn btn-block btn-outline-primary" onclick="MarketDetailPage.showShareModal()">
                    📤 分享
                </button>
                <button class="btn btn-block btn-outline-primary" onclick="MarketDetailPage.showReviewModal()">
                    📝 评价
                </button>
            </div>
        `;
        
        this.loadPreviewData();
    },
    
    async loadPreviewData() {
        try {
            const [boothResult, priceResult, reviewResult, qaResult] = await Promise.all([
                BoothService.getByMarket(this.marketId, 1, 5),
                PriceService.getByMarket(this.marketId, 1, 5),
                ReviewService.getList(1, 3, this.marketId),
                QAService.getList(1, 3, this.marketId)
            ]).catch(() => [null, null, null, null]);
            
            this.renderBoothPreview(boothResult);
            this.renderPricePreview(priceResult);
            this.renderReviewPreview(reviewResult);
            this.renderQAPreview(qaResult);
        } catch (error) {
            console.error('加载预览数据失败:', error);
        }
    },
    
    renderBoothPreview(result) {
        const container = document.getElementById('boothPreviewList');
        const items = result?.data?.items || result?.data || [];
        
        if (items.length === 0) {
            container.innerHTML = '<div class="empty-state" style="padding:16px;"><div class="icon" style="font-size:32px;">🏪</div><p>暂无摊位信息</p></div>';
            return;
        }
        
        container.innerHTML = items.slice(0, 3).map(item => `
            <div class="booth-card" style="margin-bottom:8px;padding:12px;">
                <div class="booth-header">
                    <span class="booth-name">${item.vendor_name || item.owner_name || '摊主'}</span>
                    ${item.is_verified ? '<span class="badge badge-success">已认证</span>' : ''}
                </div>
                <div class="booth-category">${item.categories || item.category || '未分类'}</div>
                <div class="booth-location">
                    <span>📍</span>
                    <span>${item.location_description || ''}</span>
                </div>
            </div>
        `).join('');
    },
    
    renderPricePreview(result) {
        const container = document.getElementById('pricePreviewList');
        const items = result?.data?.items || result?.data || [];
        
        if (items.length === 0) {
            container.innerHTML = '<div class="empty-state" style="padding:16px;"><div class="icon" style="font-size:32px;">💰</div><p>暂无价格信息</p></div>';
            return;
        }
        
        container.innerHTML = items.slice(0, 3).map(item => `
            <div class="price-card" style="margin-bottom:8px;padding:12px;">
                <div class="flex-between">
                    <span style="font-weight:500;">${item.item_name || '未知物品'}</span>
                    <span style="color:var(--primary-color);font-weight:600;">
                        ¥${item.min_price || 0} - ¥${item.max_price || 0}/${item.unit || '斤'}
                    </span>
                </div>
            </div>
        `).join('');
    },
    
    renderReviewPreview(result) {
        const container = document.getElementById('reviewPreviewList');
        const items = result?.data?.items || result?.data || [];
        
        if (items.length === 0) {
            container.innerHTML = '<div class="empty-state" style="padding:16px;"><div class="icon" style="font-size:32px;">⭐</div><p>暂无评价</p></div>';
            return;
        }
        
        container.innerHTML = items.slice(0, 2).map(item => `
            <div class="review-card" style="margin-bottom:8px;padding:12px;">
                <div class="review-header" style="margin-bottom:8px;">
                    <div class="review-avatar" style="width:32px;height:32px;font-size:14px;">${(item.user_nickname || 'U').charAt(0).toUpperCase()}</div>
                    <div class="review-info">
                        <div class="review-user">${item.user_nickname || '用户'}</div>
                        <div class="review-time">${item.created_at || ''}</div>
                    </div>
                    <div class="review-rating">${'★'.repeat(item.rating || 0)}</div>
                </div>
                <div class="review-content" style="margin:0;">${item.content || ''}</div>
            </div>
        `).join('');
    },
    
    renderQAPreview(result) {
        const container = document.getElementById('qaPreviewList');
        const items = result?.data?.items || result?.data || [];
        
        if (items.length === 0) {
            container.innerHTML = '<div class="empty-state" style="padding:16px;"><div class="icon" style="font-size:32px;">💬</div><p>暂无问答</p></div>';
            return;
        }
        
        container.innerHTML = items.slice(0, 2).map(item => `
            <div class="qa-card" style="margin-bottom:8px;padding:12px;">
                <div class="qa-question">${item.question || ''}</div>
                <div class="qa-meta" style="margin-bottom:8px;">
                    <span>提问人: 用户${item.user_id || ''}</span>
                    <span>${item.created_at || ''}</span>
                </div>
                ${item.best_answer ? `
                <div class="qa-answer">
                    <div class="qa-answer-label">最佳回答</div>
                    <div>${item.best_answer}</div>
                </div>
                ` : '<div class="qa-no-answer">暂无回答</div>'}
            </div>
        `).join('');
    },
    
    async toggleFavorite() {
        try {
            const result = await FavoriteService.toggle(this.marketId);
            
            if (result.code === 0) {
                this.isFavorite = result.data?.is_favorite;
                const favoriteBtn = document.getElementById('favoriteBtn');
                favoriteBtn.textContent = this.isFavorite ? '❤' : '🤍';
                Toast.success(this.isFavorite ? '已收藏' : '已取消收藏');
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error(error.message || '网络错误');
        }
    },
    
    async checkin() {
        if (this.hasCheckedIn) {
            Toast.warning('今天已打卡过了');
            return;
        }
        
        try {
            const result = await CheckinService.checkin(this.marketId);
            
            if (result.code === 0) {
                this.hasCheckedIn = true;
                Toast.success('打卡成功！');
            } else {
                Toast.error(result.msg || '打卡失败');
            }
        } catch (error) {
            Toast.error(error.message || '网络错误');
        }
    },
    
    callPhone(phone) {
        window.location.href = `tel:${phone}`;
    },
    
    showShareModal() {
        const modalHtml = `
            <div class="modal-overlay show" id="shareModal">
                <div class="modal">
                    <div class="modal-header">
                        <div class="modal-title">分享集市</div>
                        <button class="modal-close" onclick="MarketDetailPage.closeModal('shareModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="flex-center" style="flex-wrap:wrap;gap:24px;">
                            <div class="flex-column flex-center" style="cursor:pointer;" onclick="MarketDetailPage.shareToWeixin()">
                                <div style="width:50px;height:50px;background-color:#07c160;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;">💬</div>
                                <div style="font-size:12px;margin-top:8px;">微信</div>
                            </div>
                            <div class="flex-column flex-center" style="cursor:pointer;" onclick="MarketDetailPage.shareToMoments()">
                                <div style="width:50px;height:50px;background-color:#07c160;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;">🌍</div>
                                <div style="font-size:12px;margin-top:8px;">朋友圈</div>
                            </div>
                            <div class="flex-column flex-center" style="cursor:pointer;" onclick="MarketDetailPage.shareToQzone()">
                                <div style="width:50px;height:50px;background-color:#ffce00;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;">⭐</div>
                                <div style="font-size:12px;margin-top:8px;">QQ空间</div>
                            </div>
                            <div class="flex-column flex-center" style="cursor:pointer;" onclick="MarketDetailPage.copyLink()">
                                <div style="width:50px;height:50px;background-color:var(--primary-color);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;">🔗</div>
                                <div style="font-size:12px;margin-top:8px;">复制链接</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = document.getElementById('shareModal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal('shareModal');
            }
        });
    },
    
    shareToWeixin() {
        Toast.info('请在微信中打开此页面分享');
        this.closeModal('shareModal');
    },
    
    shareToMoments() {
        Toast.info('请在微信中打开此页面分享');
        this.closeModal('shareModal');
    },
    
    shareToQzone() {
        Toast.info('请在QQ中打开此页面分享');
        this.closeModal('shareModal');
    },
    
    copyLink() {
        const link = window.location.href;
        navigator.clipboard.writeText(link).then(() => {
            Toast.success('链接已复制');
            this.closeModal('shareModal');
        }).catch(() => {
            Toast.error('复制失败，请手动复制');
        });
    },
    
    showReviewModal() {
        const modalHtml = `
            <div class="modal-overlay show" id="reviewModal">
                <div class="modal">
                    <div class="modal-header">
                        <div class="modal-title">评价集市</div>
                        <button class="modal-close" onclick="MarketDetailPage.closeModal('reviewModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">评分</label>
                            <div class="flex-center gap-1" id="ratingSelect" style="font-size:28px;">
                                ${[1, 2, 3, 4, 5].map(i => `<span class="rating-star" data-rating="${i}" style="cursor:pointer;color:var(--text-light);">☆</span>`).join('')}
                            </div>
                            <input type="hidden" id="reviewRating" value="5">
                        </div>
                        <div class="form-group">
                            <label class="form-label">评价内容</label>
                            <textarea id="reviewContent" class="form-control" rows="4" placeholder="请输入评价内容..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="MarketDetailPage.closeModal('reviewModal')">取消</button>
                        <button class="btn btn-primary" onclick="MarketDetailPage.submitReview()">提交评价</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = document.getElementById('reviewModal');
        const ratingSelect = document.getElementById('ratingSelect');
        const reviewRating = document.getElementById('reviewRating');
        
        ratingSelect.querySelectorAll('.rating-star').forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                reviewRating.value = rating;
                
                ratingSelect.querySelectorAll('.rating-star').forEach((s, index) => {
                    s.textContent = index < rating ? '★' : '☆';
                    s.style.color = index < rating ? 'var(--warning-color)' : 'var(--text-light)';
                });
            });
            
            star.addEventListener('mouseenter', () => {
                const rating = parseInt(star.dataset.rating);
                ratingSelect.querySelectorAll('.rating-star').forEach((s, index) => {
                    s.textContent = index < rating ? '★' : '☆';
                    s.style.color = index < rating ? 'var(--warning-color)' : 'var(--text-light)';
                });
            });
        });
        
        ratingSelect.addEventListener('mouseleave', () => {
            const rating = parseInt(reviewRating.value);
            ratingSelect.querySelectorAll('.rating-star').forEach((s, index) => {
                s.textContent = index < rating ? '★' : '☆';
                s.style.color = index < rating ? 'var(--warning-color)' : 'var(--text-light)';
            });
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal('reviewModal');
            }
        });
    },
    
    async submitReview() {
        const rating = parseInt(document.getElementById('reviewRating').value);
        const content = document.getElementById('reviewContent').value.trim();
        
        if (!content) {
            Toast.error('请输入评价内容');
            return;
        }
        
        try {
            const result = await ReviewService.create({
                market_id: this.marketId,
                rating,
                content
            });
            
            if (result.code === 0) {
                Toast.success('评价成功');
                this.closeModal('reviewModal');
            } else {
                Toast.error(result.msg || '评价失败');
            }
        } catch (error) {
            Toast.error(error.message || '网络错误');
        }
    },
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    }
};
