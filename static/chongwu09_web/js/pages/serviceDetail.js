const ServiceDetailPage = {
    serviceId: null,

    async render() {
        const params = Router.getParams();
        this.serviceId = params.service_id;
        if (!this.serviceId) { Router.navigate('home'); return; }
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="detail-page no-tabbar has-header">
                <header class="header">
                    <div class="header-back" onclick="Router.back()">←</div>
                    <h1 class="header-title">服务详情</h1>
                </header>
                <div id="detailContent"><div class="empty-state"><div class="empty-state-icon">🐾</div><div class="empty-state-text">加载中...</div></div></div>
                <div class="detail-footer">
                    <button class="btn btn-primary btn-block" id="bookingBtn">立即预约</button>
                </div>
            </div>
        `;
        await this.loadDetail();
        document.getElementById('bookingBtn').addEventListener('click', () => {
            Router.navigate('booking', { service_id: this.serviceId });
        });
    },

    async loadDetail() {
        try {
            const result = await ApiService.get('/chongwu09/service/detail/get', { service_id: this.serviceId });
            if (result.code === 0) {
                const s = result.data;
                const icon = Utils.getServiceIcon(s.type);
                const stars = s.avg_rating ? '⭐'.repeat(Math.round(s.avg_rating)) : '暂无评分';
                document.getElementById('detailContent').innerHTML = `
                    <div class="detail-cover">${icon}</div>
                    <div class="detail-info">
                        <div class="detail-title">${s.title}</div>
                        <div class="detail-price-row">
                            <span class="detail-price">¥${s.price}</span>
                            <span class="detail-price-unit">/${s.price_unit || '天'}</span>
                        </div>
                        <div class="detail-meta">
                            <span class="detail-meta-item">${s.type_name}</span>
                            <span class="detail-meta-item">${s.address || '暂无地址'}</span>
                            <span class="detail-meta-item">${s.current_booked || 0}/${s.capacity || 10} 已预约</span>
                        </div>
                        <div style="font-size:13px;color:var(--text-secondary)">${stars} ${s.avg_rating ? s.avg_rating + '分' : ''} (${s.rating_count || 0}条评价)</div>
                    </div>
                    <div class="detail-desc">
                        <h3>服务介绍</h3>
                        <p>${s.description || '暂无描述'}</p>
                    </div>
                    <div id="reviewSection" style="padding:0 16px;margin-top:12px">
                        <h3 style="font-size:15px;font-weight:500;margin-bottom:8px">用户评价</h3>
                        <div id="reviewList"><div class="text-center" style="padding:16px;color:var(--text-secondary)">暂无评价</div></div>
                    </div>
                `;
                this.loadReviews();
            } else { Toast.error(result.msg || '加载失败'); }
        } catch (error) { Toast.error('加载失败'); }
    },

    async loadReviews() {
        try {
            const result = await ApiService.get('/chongwu09/review/service/list/get', { service_id: this.serviceId, page: 1, page_size: 5 });
            if (result.code === 0 && result.data.items.length > 0) {
                document.getElementById('reviewList').innerHTML = result.data.items.map(r => `
                    <div style="padding:12px 0;border-bottom:1px solid var(--border-color)">
                        <div style="display:flex;align-items:center;justify-content:space-between">
                            <span style="font-weight:500">${(r.user && r.user.nickname) || '用户'}</span>
                            <span>${'⭐'.repeat(r.rating)}</span>
                        </div>
                        <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">${r.content || '未填写评价'}</div>
                        <div style="font-size:11px;color:var(--text-light);margin-top:4px">${Utils.formatTime(r.created_at)}</div>
                    </div>
                `).join('');
            }
        } catch (e) {}
    }
};
