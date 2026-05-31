const OrderDetailPage = {
    order: null,
    review: null,

    async render() {
        const params = Router.getParams();
        const orderId = params.id;

        if (!orderId) {
            Router.navigate('myOrders');
            return;
        }

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page-container">
                <header class="header">
                    <div class="header-content">
                        <button class="back-btn" onclick="Router.back()">←</button>
                        <h1 class="header-title">订单详情</h1>
                        <div style="width:40px;"></div>
                    </div>
                </header>

                <div class="order-detail-content" id="orderDetailContent">
                    <div class="loading">加载中...</div>
                </div>
            </div>
        `;

        await this.loadData(orderId);
    },

    async loadData(id) {
        try {
            const [orderResult, reviewResult] = await Promise.all([
                OrderApi.get(id),
                ReviewApi.getByOrder(id).catch(() => ({ code: 1, data: null }))
            ]);

            if (orderResult.code === 0) {
                this.order = orderResult.data;
                if (reviewResult.code === 0) {
                    this.review = reviewResult.data;
                }
                this.renderDetail();
            } else {
                document.getElementById('orderDetailContent').innerHTML = '<div class="empty">订单不存在</div>';
            }
        } catch (error) {
            document.getElementById('orderDetailContent').innerHTML = '<div class="empty">加载失败</div>';
        }
    },

    renderDetail() {
        const container = document.getElementById('orderDetailContent');
        const order = this.order;

        container.innerHTML = `
            <div class="order-detail">
                <div class="detail-status">
                    <span class="status-badge ${Utils.getStatusClass(order.status)}">${Utils.getStatusText(order.status)}</span>
                </div>

                <div class="detail-section">
                    <h3>服务信息</h3>
                    <div class="info-row">
                        <span class="label">服务名称</span>
                        <span class="value">${order.service_name}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">服务分类</span>
                        <span class="value">${order.service_category || '-'}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">服务价格</span>
                        <span class="value price">${Utils.formatPrice(order.price)}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>预约信息</h3>
                    <div class="info-row">
                        <span class="label">联系人</span>
                        <span class="value">${order.contact_name}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">联系电话</span>
                        <span class="value">${order.contact_phone}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">服务地址</span>
                        <span class="value">${order.address}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">预约时间</span>
                        <span class="value">${order.appointment_date} ${order.appointment_time}</span>
                    </div>
                    ${order.remarks ? `
                    <div class="info-row">
                        <span class="label">备注</span>
                        <span class="value">${order.remarks}</span>
                    </div>
                    ` : ''}
                </div>

                ${order.staff_name ? `
                <div class="detail-section">
                    <h3>服务人员</h3>
                    <div class="info-row">
                        <span class="label">姓名</span>
                        <span class="value">${order.staff_name}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">电话</span>
                        <span class="value">${order.staff_phone || '-'}</span>
                    </div>
                </div>
                ` : ''}

                <div class="detail-section">
                    <h3>订单信息</h3>
                    <div class="info-row">
                        <span class="label">订单编号</span>
                        <span class="value">${order.order_no}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">下单时间</span>
                        <span class="value">${Utils.formatDate(order.created_at)}</span>
                    </div>
                </div>

                ${this.review ? `
                <div class="detail-section">
                    <h3>我的评价</h3>
                    <div class="review-info">
                        <div class="review-stars">${Utils.generateStars(this.review.rating)}</div>
                        <p class="review-content">${this.review.content || '暂无评价内容'}</p>
                        <p class="review-time">${Utils.formatDate(this.review.created_at)}</p>
                    </div>
                </div>
                ` : ''}

                <div class="detail-actions">
                    ${order.status === 'confirmed' ? `
                        <button class="btn btn-primary btn-block" id="completeBtn">确认服务完成</button>
                    ` : ''}
                    ${order.status === 'completed' && !this.review ? `
                        <button class="btn btn-primary btn-block" id="reviewBtn">去评价</button>
                    ` : ''}
                    ${order.status === 'pending' ? `
                        <button class="btn btn-danger btn-block" id="cancelBtn">取消订单</button>
                    ` : ''}
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const completeBtn = document.getElementById('completeBtn');
        const reviewBtn = document.getElementById('reviewBtn');
        const cancelBtn = document.getElementById('cancelBtn');

        if (completeBtn) {
            completeBtn.addEventListener('click', async () => {
                const confirmed = await Utils.confirm('确认服务已完成吗？');
                if (!confirmed) return;
                try {
                    const result = await OrderApi.complete(this.order.id);
                    if (result.code === 0) {
                        Utils.showToast('订单已完成');
                        this.loadData(this.order.id);
                    } else {
                        Utils.showToast(result.msg || '操作失败', 'error');
                    }
                } catch (error) {
                    Utils.showToast('操作失败', 'error');
                }
            });
        }

        if (reviewBtn) {
            reviewBtn.addEventListener('click', () => {
                Router.navigate('reviewCreate', { orderId: this.order.id });
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', async () => {
                const confirmed = await Utils.confirm('确认取消该订单吗？');
                if (!confirmed) return;
                try {
                    const result = await OrderApi.cancel(this.order.id);
                    if (result.code === 0) {
                        Utils.showToast('订单已取消');
                        Router.navigate('myOrders');
                    } else {
                        Utils.showToast(result.msg || '操作失败', 'error');
                    }
                } catch (error) {
                    Utils.showToast('操作失败', 'error');
                }
            });
        }
    }
};
