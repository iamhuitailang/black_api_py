const IncomePage = {
    async render() {
        if (!Auth.checkAuth()) return;

        const user = Auth.getUser();
        const balance = user?.balance || 0;

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <div class="header">
                    <div class="header-back" id="backBtn">←</div>
                    <span class="header-title">收入记录</span>
                </div>

                <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); 
                    padding: 24px 20px; color: white; margin-bottom: 12px;">
                    <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">账户余额</div>
                    <div style="font-size: 32px; font-weight: 700;">
                        ¥${balance.toFixed(2)}
                    </div>
                    <div style="margin-top: 16px; display: flex; gap: 16px;">
                        <div style="flex: 1;">
                            <div style="font-size: 12px; opacity: 0.8; margin-bottom: 4px;">本月收入</div>
                            <div style="font-size: 18px; font-weight: 600;">¥${(balance * 0.6).toFixed(2)}</div>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 12px; opacity: 0.8; margin-bottom: 4px;">累计收入</div>
                            <div style="font-size: 18px; font-weight: 600;">¥${balance.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">
                        <span class="section-title-text">收入明细</span>
                    </div>
                    <div class="list" id="incomeList">
                        ${this.renderDemoList()}
                    </div>
                </div>

                ${this.getTabbar()}
            </div>
        `;

        this.bindEvents();
    },

    renderDemoList() {
        const items = [
            { type: '收入', order: '订单#101', amount: 15.00, time: '今天 14:30' },
            { type: '收入', order: '订单#102', amount: 16.00, time: '今天 10:15' },
            { type: '收入', order: '订单#100', amount: 25.50, time: '昨天 16:45' },
            { type: '收入', order: '订单#98', amount: 32.00, time: '3天前 09:20' },
            { type: '收入', order: '订单#96', amount: 18.80, time: '1周前 15:10' }
        ];

        return items.map(item => `
            <div class="list-item">
                <div class="list-item-content">
                    <div class="list-item-title">${item.type} - ${item.order}</div>
                    <div class="list-item-desc">${item.time}</div>
                </div>
                <div style="color: var(--primary-color); font-weight: 600; font-size: 15px;">
                    +¥${item.amount.toFixed(2)}
                </div>
            </div>
        `).join('');
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
