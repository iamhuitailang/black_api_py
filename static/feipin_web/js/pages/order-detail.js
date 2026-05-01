const OrderDetailPage = {
    order: null,

    async render() {
        if (!Auth.checkAuth()) return;

        const orderId = Router.getParam('id');
        if (!orderId) {
            Router.navigate('order');
            return;
        }

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header order-detail">
                <div class="header">
                    <div class="header-back" id="backBtn">←</div>
                    <span class="header-title">订单详情</span>
                </div>

                <div id="orderContent">
                    <div class="empty-state">
                        <div class="empty-state-icon">⏳</div>
                        <div class="empty-state-text">加载中...</div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        await this.loadOrder(orderId);
    },

    async loadOrder(orderId) {
        try {
            const result = await API.get('/order/detail/get', { id: orderId });
            if (result.code === 200) {
                this.order = result.data;
                this.renderOrderDetail();
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (e) {
            console.error('Load order error:', e);
            this.renderDemoOrder(orderId);
        }
    },

    renderDemoOrder(orderId) {
        this.order = {
            id: orderId,
            status: 'accepted',
            category_name: '纸类',
            weight: 10,
            total_price: 10.00,
            address: 'XX小区XX栋XX室',
            contact_name: '张先生',
            contact_phone: '13800138000',
            created_at: new Date().toISOString(),
            collector_name: '李师傅',
            collector_phone: '13800138002'
        };
        this.renderOrderDetail();
    },

    renderOrderDetail() {
        const contentEl = document.getElementById('orderContent');
        if (!contentEl) return;

        const order = this.order;
        const statusMap = {
            'pending': { 
                text: '待接单', 
                icon: '⏳', 
                color: '#f59e0b',
                steps: ['下单', '接单', '上门', '完成'],
                activeStep: 0
            },
            'accepted': { 
                text: '已接单', 
                icon: '🚚', 
                color: '#3b82f6',
                steps: ['下单', '接单', '上门', '完成'],
                activeStep: 1
            },
            'completed': { 
                text: '已完成', 
                icon: '✅', 
                color: '#10b981',
                steps: ['下单', '接单', '上门', '完成'],
                activeStep: 3
            },
            'cancelled': { 
                text: '已取消', 
                icon: '❌', 
                color: '#ef4444',
                steps: ['下单', '取消'],
                activeStep: 1
            }
        };

        const status = statusMap[order.status] || statusMap['pending'];
        const totalPrice = order.total_price ? order.total_price.toFixed(2) : '0.00';

        contentEl.innerHTML = `
            <div class="order-detail-header" style="background: linear-gradient(135deg, ${status.color} 0%, ${status.color}dd 100%);">
                <div class="order-detail-status">
                    <span class="order-detail-status-icon">${status.icon}</span>
                    <div>
                        <div class="order-detail-status-text">${status.text}</div>
                        <div class="order-detail-status-desc">
                            ${order.status === 'pending' ? '等待回收员接单' : 
                              order.status === 'accepted' ? '回收员已接单，准备上门' :
                              order.status === 'completed' ? '订单已完成' :
                              '订单已取消'}
                        </div>
                    </div>
                </div>
                ${this.renderSteps(status.steps, status.activeStep)}
            </div>

            <div class="order-detail-section">
                <div class="order-detail-section-header">废品种类</div>
                <div class="order-detail-section-body">
                    <div class="order-detail-category">
                        <div class="order-detail-category-icon">📦</div>
                        <div class="order-detail-category-info">
                            <div class="order-detail-category-name">${order.category_name || '废品回收'}</div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                                预估重量: ${order.weight || 0} 公斤
                            </div>
                        </div>
                        <div class="order-detail-price">
                            <div class="order-detail-price-value">¥${totalPrice}</div>
                            <div class="order-detail-price-label">预估总价</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="order-detail-section">
                <div class="order-detail-section-header">回收地址</div>
                <div class="order-detail-section-body">
                    <div class="order-detail-row">
                        <span class="order-detail-label">地址</span>
                        <span class="order-detail-value">${order.address || '待填写'}</span>
                    </div>
                    <div class="order-detail-row">
                        <span class="order-detail-label">联系人</span>
                        <span class="order-detail-value">${order.contact_name || '-'}</span>
                    </div>
                    <div class="order-detail-row">
                        <span class="order-detail-label">联系电话</span>
                        <span class="order-detail-value">${order.contact_phone || '-'}</span>
                    </div>
                </div>
            </div>

            ${order.collector_name ? `
            <div class="order-detail-section">
                <div class="order-detail-section-header">回收员信息</div>
                <div class="order-detail-section-body">
                    <div class="collector-detail-section">
                        <div class="collector-detail-avatar">${order.collector_name.charAt(0)}</div>
                        <div class="collector-detail-info">
                            <div class="collector-detail-name">${order.collector_name}</div>
                            <div class="collector-detail-meta">
                                <span style="font-size: 12px; color: var(--text-secondary);">
                                    ${order.collector_phone || '电话: 待显示'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}

            <div class="order-detail-section">
                <div class="order-detail-section-header">订单信息</div>
                <div class="order-detail-section-body">
                    <div class="order-detail-row">
                        <span class="order-detail-label">订单号</span>
                        <span class="order-detail-value">${order.id}</span>
                    </div>
                    <div class="order-detail-row">
                        <span class="order-detail-label">下单时间</span>
                        <span class="order-detail-value">${this.formatDate(order.created_at)}</span>
                    </div>
                </div>
            </div>

            ${this.renderActionButtons(order)}
        `;

        this.bindDetailEvents();
    },

    renderSteps(steps, activeStep) {
        if (!steps || steps.length === 0) return '';

        return `
            <div class="order-detail-steps">
                ${steps.map((step, index) => `
                    ${index > 0 ? `
                    <div class="order-detail-line ${index <= activeStep ? 'active' : ''}"></div>
                    ` : ''}
                    <div class="order-detail-step">
                        <div class="order-detail-step-dot ${index <= activeStep ? 'active' : ''}"></div>
                        <span class="order-detail-step-text ${index <= activeStep ? 'active' : ''}">${step}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderActionButtons(order) {
        if (order.status === 'pending') {
            return `
                <div class="order-detail-footer">
                    <button class="btn btn-outline btn-lg" id="cancelBtn">取消订单</button>
                </div>
            `;
        }

        if (order.status === 'accepted') {
            return `
                <div class="order-detail-footer">
                    <button class="btn btn-outline btn-lg" id="contactBtn">联系回收员</button>
                    <button class="btn btn-primary btn-lg" id="completeBtn">确认完成</button>
                </div>
            `;
        }

        if (order.status === 'completed') {
            return `
                <div class="order-detail-footer">
                    <button class="btn btn-primary btn-lg" id="reviewBtn">去评价</button>
                </div>
            `;
        }

        return '';
    },

    bindEvents() {
        document.getElementById('backBtn').addEventListener('click', () => {
            Router.navigate('order');
        });
    },

    bindDetailEvents() {
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelOrder());
        }

        const contactBtn = document.getElementById('contactBtn');
        if (contactBtn) {
            contactBtn.addEventListener('click', () => {
                const phone = this.order.collector_phone || '13800138002';
                Toast.info(`回收员电话: ${phone}`);
            });
        }

        const completeBtn = document.getElementById('completeBtn');
        if (completeBtn) {
            completeBtn.addEventListener('click', () => this.completeOrder());
        }

        const reviewBtn = document.getElementById('reviewBtn');
        if (reviewBtn) {
            reviewBtn.addEventListener('click', () => {
                Router.navigate('review', { id: this.order.id });
            });
        }
    },

    async cancelOrder() {
        try {
            const result = await API.post('/order/cancel', { order_id: this.order.id });
            if (result.code === 200) {
                Toast.success('订单已取消');
                setTimeout(() => {
                    Router.navigate('order');
                }, 1000);
            } else {
                Toast.error(result.msg || '取消失败');
            }
        } catch (e) {
            Toast.error('取消失败，请稍后重试');
        }
    },

    async completeOrder() {
        try {
            const result = await API.post('/order/complete', { order_id: this.order.id });
            if (result.code === 200) {
                Toast.success('订单已完成');
                setTimeout(() => {
                    Router.navigate('order');
                }, 1000);
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (e) {
            Toast.error('操作失败，请稍后重试');
        }
    },

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
};
