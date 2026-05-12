class OrdersPage {
    constructor() {
        this.orders = [];
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
        const status = document.getElementById('order-status-filter').value;
        const date = document.getElementById('order-date-filter').value;

        const result = await OrderAdminAPI.orders.all(1, 100,
            status || null,
            date || null,
            null
        );

        if (result.code === 0) {
            this.orders = result.data.items || [];
            this.renderOrdersTable();
        }
    }

    renderOrdersTable() {
        const tbody = document.querySelector('#orders-table tbody');
        tbody.innerHTML = '';

        this.orders.forEach(order => {
            const statusClass = `status-${order.status}`;
            const statusText = getStatusName(order.status);

            tbody.innerHTML += `
                <tr>
                    <td>${order.order_no}</td>
                    <td>用户${order.user_id}</td>
                    <td>${order.menu_date}</td>
                    <td>${getMealTypeName(order.meal_type)}</td>
                    <td>${formatPrice(order.total_amount)}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td><code>${order.qrcode}</code></td>
                    <td class="actions">
                        <button class="btn btn-small btn-secondary" onclick="ordersPage.viewOrder(${order.id})">详情</button>
                        ${order.status === 'pending' ? `
                            <button class="btn btn-small btn-danger" onclick="ordersPage.cancelOrder(${order.id})">取消</button>
                        ` : ''}
                    </td>
                </tr>
            `;
        });
    }

    bindEvents() {
        document.getElementById('order-status-filter').addEventListener('change', () => {
            this.loadData();
        });

        document.getElementById('order-date-filter').addEventListener('change', () => {
            this.loadData();
        });
    }

    async viewOrder(id) {
        const result = await OrderAdminAPI.orders.get(id);
        if (result.code === 0) {
            const order = result.data.order;
            const details = result.data.details;
            let detailText = details.map(d => `${d.name} x ${d.quantity}`).join('\n');
            alert(`订单详情:\n订单号: ${order.order_no}\n菜品:\n${detailText}\n金额: ${formatPrice(order.total_amount)}\n状态: ${getStatusName(order.status)}`);
        }
    }

    async cancelOrder(id) {
        if (confirm('确定要取消这个订单吗？')) {
            const result = await OrderAdminAPI.orders.cancel({
                order_id: id,
                user_id: 1,
                reason: '管理员取消'
            });

            if (result.code === 0) {
                showToast('订单已取消');
                this.loadData();
            } else {
                showToast(result.msg || '取消失败', 'error');
            }
        }
    }
}

let ordersPage;
document.addEventListener('DOMContentLoaded', () => {
    ordersPage = new OrdersPage();
});