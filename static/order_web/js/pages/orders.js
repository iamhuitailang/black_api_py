class OrdersPage {
    constructor() {
        this.orders = [];
        this.currentStatus = '';
        this.init();
    }

    init() {
        document.addEventListener('pageChanged', (e) => {
            if (e.detail === 'orders') {
                this.loadData();
            }
        });

        this.bindEvents();
    }

    async loadData() {
        if (!app.currentUser) return;

        const result = await OrderWebAPI.orders.getByUser(app.currentUser.id);
        if (result.code === 0) {
            this.orders = result.data.items || [];
            this.renderOrders();
        }
    }

    renderOrders() {
        const container = document.getElementById('order-list');
        let filteredOrders = this.orders;

        if (this.currentStatus) {
            filteredOrders = filteredOrders.filter(o => o.status === this.currentStatus);
        }

        if (filteredOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📋</div>
                    <p>暂无订单</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        filteredOrders.forEach(order => {
            const statusClass = `status-${order.status}`;
            const statusText = getStatusName(order.status);

            container.innerHTML += `
                <div class="order-card">
                    <div class="order-header">
                        <span class="order-no">${order.order_no}</span>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                    <div class="order-info">
                        <p>📅 ${order.menu_date} · ${getMealTypeName(order.meal_type)}</p>
                    </div>
                    <div class="order-footer">
                        <span class="order-amount">${formatPrice(order.total_amount)}</span>
                        <div class="order-actions">
                            ${order.status === 'pending' ? `
                                <button class="btn btn-small btn-danger" onclick="ordersPage.cancelOrder(${order.id})">取消</button>
                                <button class="btn btn-small btn-primary" onclick="ordersPage.showQrcode('${order.qrcode}')">取餐码</button>
                            ` : ''}
                            <button class="btn btn-small btn-secondary" onclick="ordersPage.reorder(${order.id})">再来一单</button>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    bindEvents() {
        document.querySelectorAll('.order-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.order-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentStatus = btn.dataset.status;
                this.renderOrders();
            });
        });
    }

    async cancelOrder(id) {
        if (confirm('确定要取消这个订单吗？')) {
            const result = await OrderWebAPI.orders.cancel({
                order_id: id,
                user_id: app.currentUser.id,
                reason: '用户取消'
            });

            if (result.code === 0) {
                showToast('订单已取消');
                this.loadData();
            } else {
                showToast(result.msg || '取消失败', 'error');
            }
        }
    }

    async reorder(id) {
        const result = await OrderWebAPI.orders.reorder(id, app.currentUser.id);
        if (result.code === 0) {
            showToast('下单成功');
            this.loadData();
            app.navigateTo('orders');
        } else {
            showToast(result.msg || '下单失败', 'error');
        }
    }

    showQrcode(qrcode) {
        document.getElementById('qrcode-text').textContent = qrcode;

        const canvas = document.getElementById('qrcode-canvas');
        canvas.innerHTML = '';

        const size = 200;
        const cellSize = size / 8;
        const colors = ['#667eea', '#764ba2'];

        let html = '<div style="display:grid;grid-template-columns:repeat(8,1fr);gap:1px;width:' + size + 'px;height:' + size + 'px;background:#fff;padding:8px;border-radius:8px;">';

        for (let i = 0; i < 64; i++) {
            const hash = qrcode.charCodeAt(i % qrcode.length) + i;
            const color = colors[hash % 2];
            html += '<div style="background:' + color + ';"></div>';
        }
        html += '</div>';

        canvas.innerHTML = html;
        document.getElementById('qrcode-modal').classList.add('active');
    }
}

let ordersPage;
document.addEventListener('DOMContentLoaded', () => {
    ordersPage = new OrdersPage();
});