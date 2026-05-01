const StatsPage = {
    async render() {
        if (!Auth.checkAuth()) return;

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <div class="header">
                    <div class="header-back" id="backBtn">←</div>
                    <span class="header-title">我的业绩</span>
                </div>

                <div style="padding: 16px; background-color: var(--card-bg);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                        <h3 style="font-size: 16px; font-weight: 600;">${year}年${month}月</h3>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                        <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); 
                            padding: 16px; border-radius: var(--radius-md); text-align: center;">
                            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">本月收入</div>
                            <div style="font-size: 24px; font-weight: 700; color: var(--primary-color);">¥1,280.50</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); 
                            padding: 16px; border-radius: var(--radius-md); text-align: center;">
                            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">完成订单</div>
                            <div style="font-size: 24px; font-weight: 700; color: var(--info-color);">86</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); 
                            padding: 16px; border-radius: var(--radius-md); text-align: center;">
                            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">日均单量</div>
                            <div style="font-size: 24px; font-weight: 700; color: var(--warning-color);">3.4</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); 
                            padding: 16px; border-radius: var(--radius-md); text-align: center;">
                            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">平均评分</div>
                            <div style="font-size: 24px; font-weight: 700; color: var(--secondary-color);">4.9</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">
                        <span class="section-title-text">业绩趋势</span>
                    </div>
                    <div class="card" style="margin-top: 0;">
                        <div class="card-body">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid var(--border-color);">
                                <div style="font-size: 13px; color: var(--text-secondary);">日期</div>
                                <div style="font-size: 13px; color: var(--text-secondary);">收入</div>
                            </div>
                            ${this.renderTrendList()}
                        </div>
                    </div>
                </div>

                ${this.getTabbar()}
            </div>
        `;

        this.bindEvents();
    },

    renderTrendList() {
        const days = [
            { date: '今天', amount: 126.50, orders: 5 },
            { date: '昨天', amount: 98.00, orders: 4 },
            { date: '前天', amount: 156.80, orders: 6 },
            { date: '3天前', amount: 85.20, orders: 3 },
            { date: '4天前', amount: 198.00, orders: 7 }
        ];

        const maxAmount = Math.max(...days.map(d => d.amount));

        return days.map(day => {
            const barWidth = (day.amount / maxAmount) * 100;
            return `
                <div style="margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <div style="font-size: 13px; color: var(--text-primary);">${day.date}</div>
                        <div style="font-size: 13px; color: var(--primary-color); font-weight: 500;">
                            ¥${day.amount.toFixed(2)} · ${day.orders}单
                        </div>
                    </div>
                    <div style="height: 8px; background-color: var(--bg-color); border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${barWidth}%; 
                            background: linear-gradient(90deg, var(--primary-color) 0%, var(--primary-dark) 100%);
                            border-radius: 4px;"></div>
                    </div>
                </div>
            `;
        }).join('');
    },

    getTabbar() {
        return `
            <div class="tabbar">
                <div class="tabbar-item" data-route="home">
                    <span class="tabbar-icon">🏠</span>
                    <span class="tabbar-text">首页</span>
                </div>
                <div class="tabbar-item" data-route="order-hall">
                    <span class="tabbar-icon">📋</span>
                    <span class="tabbar-text">订单大厅</span>
                </div>
                <div class="tabbar-item" data-route="collector-orders">
                    <span class="tabbar-icon">📦</span>
                    <span class="tabbar-text">我的订单</span>
                </div>
                <div class="tabbar-item" data-route="profile">
                    <span class="tabbar-icon">👤</span>
                    <span class="tabbar-text">我的</span>
                </div>
            </div>
        `;
    },

    bindEvents() {
        document.getElementById('backBtn').addEventListener('click', () => {
            Router.navigate('profile');
        });

        const tabbarItems = document.querySelectorAll('.tabbar-item');
        tabbarItems.forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                Router.navigate(route);
            });
        });
    }
};
