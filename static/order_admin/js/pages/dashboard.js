class DashboardPage {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('pageChanged', (e) => {
            if (e.detail === 'dashboard') {
                this.loadData();
            }
        });
    }

    async loadData() {
        const today = formatDate(new Date());

        const [statsResult, ordersResult, dishesResult] = await Promise.all([
            OrderAdminAPI.statistics.daily(today),
            OrderAdminAPI.orders.all(1, 1000, null, today),
            OrderAdminAPI.dishes.all(1, 1000)
        ]);

        let todayOrders = 0;
        let todayRevenue = 0;

        if (statsResult.code === 0 && statsResult.data.summary) {
            todayOrders = statsResult.data.summary.total_orders || 0;
            todayRevenue = statsResult.data.summary.total_amount || 0;
        }

        let pendingOrders = 0;
        if (ordersResult.code === 0) {
            pendingOrders = (ordersResult.data.items || []).filter(o => o.status === 'pending').length;
        }

        let totalDishes = 0;
        if (dishesResult.code === 0) {
            totalDishes = ordersResult.data.total || 0;
        }

        this.renderStats(todayOrders, todayRevenue, totalDishes, pendingOrders);
        this.renderChart(statsResult.data.items || []);
    }

    renderStats(todayOrders, todayRevenue, totalDishes, pendingOrders) {
        document.getElementById('today-orders').textContent = todayOrders;
        document.getElementById('today-revenue').textContent = formatPrice(todayRevenue);
        document.getElementById('pending-orders').textContent = pendingOrders;
    }

    renderChart(data) {
        const canvas = document.getElementById('order-chart');
        const ctx = canvas.getContext('2d');

        canvas.width = canvas.parentElement.offsetWidth - 48;
        canvas.height = 300;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (data.length === 0) {
            ctx.fillStyle = '#999';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('暂无数据', canvas.width / 2, canvas.height / 2);
            return;
        }

        const maxOrders = Math.max(...data.map(d => d.total_orders || 0));
        const padding = 40;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;
        const barWidth = chartWidth / data.length * 0.6;
        const barGap = chartWidth / data.length * 0.4;

        ctx.fillStyle = '#667eea';
        data.forEach((item, index) => {
            const x = padding + index * (barWidth + barGap) + barGap / 2;
            const barHeight = (item.total_orders || 0) / maxOrders * chartHeight;
            const y = padding + chartHeight - barHeight;

            ctx.fillRect(x, y, barWidth, barHeight);

            ctx.fillStyle = '#333';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${item.total_orders || 0}单`, x + barWidth / 2, y - 8);

            ctx.fillStyle = '#666';
            ctx.font = '11px sans-serif';
            ctx.fillText(getMealTypeName(item.meal_type), x + barWidth / 2, canvas.height - 15);
            ctx.fillStyle = '#667eea';
        });
    }
}

let dashboardPage;
document.addEventListener('DOMContentLoaded', () => {
    dashboardPage = new DashboardPage();
});