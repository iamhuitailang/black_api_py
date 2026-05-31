const ServiceDetailPage = {
    service: null,

    async render() {
        const params = Router.getParams();
        const serviceId = params.id;

        if (!serviceId) {
            Router.navigate('home');
            return;
        }

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page-container">
                <header class="header">
                    <div class="header-content">
                        <button class="back-btn" onclick="Router.navigate('home')">←</button>
                        <h1 class="header-title">服务详情</h1>
                        <div style="width:40px;"></div>
                    </div>
                </header>

                <div class="detail-content" id="detailContent">
                    <div class="loading">加载中...</div>
                </div>
            </div>
        `;

        await this.loadService(serviceId);
    },

    async loadService(id) {
        try {
            const result = await ServiceApi.get(id);
            if (result.code === 0) {
                this.service = result.data;
                this.renderDetail();
            } else {
                document.getElementById('detailContent').innerHTML = '<div class="empty">服务不存在</div>';
            }
        } catch (error) {
            document.getElementById('detailContent').innerHTML = '<div class="empty">加载失败</div>';
        }
    },

    renderDetail() {
        const container = document.getElementById('detailContent');
        const service = this.service;

        container.innerHTML = `
            <div class="service-detail">
                <div class="detail-image">
                    <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(service.name + ' 家政服务 清洁 专业 高清')}&image_size=landscape_16_9" alt="${service.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 60%22><rect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2235%22 text-anchor=%22middle%22 font-size=%2230%22>🏠</text></svg>'">
                </div>

                <div class="detail-info">
                    <div class="detail-header">
                        <h1>${service.name}</h1>
                        <span class="service-category">${service.category}</span>
                    </div>

                    <div class="detail-meta">
                        <div class="meta-item">
                            <span class="meta-label">价格</span>
                            <span class="meta-value price">${Utils.formatPrice(service.price)}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">时长</span>
                            <span class="meta-value">${service.duration || 60}分钟</span>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>服务描述</h3>
                        <p class="detail-desc">${service.description || '暂无详细描述'}</p>
                    </div>

                    ${service.content ? `
                    <div class="detail-section">
                        <h3>服务内容</h3>
                        <div class="service-content">${service.content}</div>
                    </div>
                    ` : ''}

                    <div class="detail-section">
                        <h3>服务保障</h3>
                        <div class="guarantees">
                            <div class="guarantee-item">✓ 专业人员</div>
                            <div class="guarantee-item">✓ 准时上门</div>
                            <div class="guarantee-item">✓ 满意保障</div>
                            <div class="guarantee-item">✓ 售后无忧</div>
                        </div>
                    </div>
                </div>

                <div class="detail-footer">
                    <div class="footer-price">
                        <span class="price-label">合计</span>
                        <span class="price-value">${Utils.formatPrice(service.price)}</span>
                    </div>
                    <button class="btn btn-primary btn-book" id="bookBtn">立即预约</button>
                </div>
            </div>
        `;

        document.getElementById('bookBtn').addEventListener('click', () => {
            if (!AuthService.isLoggedIn()) {
                Router.navigate('login');
                return;
            }
            Router.navigate('orderCreate', { serviceId: service.id });
        });
    }
};
