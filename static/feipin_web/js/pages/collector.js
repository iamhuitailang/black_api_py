const CollectorPage = {
    collectors: [],

    async render() {
        if (!Auth.checkAuth()) return;

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <div class="header">
                    <div class="header-back" id="backBtn">←</div>
                    <span class="header-title">附近回收员</span>
                </div>

                <div class="section" style="margin-top: 12px;">
                    <div class="collector-list" id="collectorList">
                        ${this.renderLoading()}
                    </div>
                </div>

                ${this.getTabbar()}
            </div>
        `;

        this.bindEvents();
        this.renderDemoCollectors();
    },

    renderLoading() {
        return Array(3).fill(0).map(() => `
            <div class="collector-item" style="opacity: 0.5;">
                <div class="collector-avatar" style="background: #e5e7eb;"></div>
                <div class="collector-info">
                    <div style="width: 80px; height: 16px; background: #e5e7eb; border-radius: 4px; margin-bottom: 6px;"></div>
                    <div style="width: 120px; height: 12px; background: #e5e7eb; border-radius: 4px;"></div>
                </div>
            </div>
        `).join('');
    },

    renderDemoCollectors() {
        const listEl = document.getElementById('collectorList');
        if (!listEl) return;

        const demoCollectors = [
            { id: 1, name: '张师傅', rating: 4.8, reviews: 156, status: '在线', distance: '500m', completed: 234 },
            { id: 2, name: '李师傅', rating: 4.9, reviews: 203, status: '服务中', distance: '800m', completed: 356 },
            { id: 3, name: '王师傅', rating: 4.7, reviews: 98, status: '在线', distance: '1.2km', completed: 178 },
            { id: 4, name: '赵师傅', rating: 4.6, reviews: 67, status: '在线', distance: '1.5km', completed: 145 },
            { id: 5, name: '刘师傅', rating: 4.9, reviews: 312, status: '服务中', distance: '2km', completed: 489 }
        ];

        this.collectors = demoCollectors;

        listEl.innerHTML = demoCollectors.map(c => `
            <div class="collector-item" data-id="${c.id}">
                <div class="collector-avatar">${c.name.charAt(0)}</div>
                <div class="collector-info">
                    <div class="collector-name">${c.name}</div>
                    <div class="collector-rating">
                        <span class="collector-stars">★★★★★</span>
                        <span class="collector-review-count">${c.rating}分 · ${c.reviews}单</span>
                    </div>
                    <div style="margin-top: 4px; font-size: 12px; color: var(--text-secondary);">
                        距离 ${c.distance} · 完成 ${c.completed} 单
                    </div>
                </div>
                <div class="collector-status">
                    <span class="badge ${c.status === '在线' ? 'badge-success' : 'badge-warning'}">
                        ${c.status}
                    </span>
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
                <div class="tabbar-item" data-route="price">
                    <span class="tabbar-icon">💰</span>
                    <span class="tabbar-text">价格</span>
                </div>
                <div class="tabbar-item" data-route="order">
                    <span class="tabbar-icon">📦</span>
                    <span class="tabbar-text">订单</span>
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
            Router.navigate('home');
        });

        const tabbarItems = document.querySelectorAll('.tabbar-item');
        tabbarItems.forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                Router.navigate(route);
            });
        });

        document.addEventListener('click', (e) => {
            const collectorItem = e.target.closest('.collector-item');
            if (collectorItem) {
                const id = collectorItem.dataset.id;
                const collector = this.collectors.find(c => c.id === parseInt(id));
                if (collector) {
                    Toast.info(`回收员电话: 1380000000${id}`);
                }
            }
        });
    }
};
