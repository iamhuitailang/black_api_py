const DashboardPage = {
    stats: null,
    
    async render() {
        Layout.render('<div class="empty-state"><div class="loading"></div><p>加载中...</p></div>', '仪表盘');
        
        try {
            const statsResult = await StatisticsService.getToday();
            if (statsResult.code === 0) {
                this.stats = statsResult.data;
            }
        } catch (e) {
            console.error('Load stats error:', e);
        }
        
        this.renderContent();
    },
    
    renderContent() {
        const stats = this.stats || {
            today_purchase: { count: 0, amount: 0 },
            today_sale: { count: 0, amount: 0 },
            total_inventory: { quantity: 0, cost: 0, warning_count: 0 },
            today_profit: 0
        };
        
        const content = `
            <div class="page-header">
                <h1 class="page-title">数据概览</h1>
                <p class="page-subtitle">今日数据统计摘要</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon blue">
                        <span>📥</span>
                    </div>
                    <div class="stat-info">
                        <h3>${Layout.formatPrice(stats.today_purchase.amount)}</h3>
                        <p>今日进货 (${stats.today_purchase.count} 笔)</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon green">
                        <span>📤</span>
                    </div>
                    <div class="stat-info">
                        <h3>${Layout.formatPrice(stats.today_sale.amount)}</h3>
                        <p>今日销售 (${stats.today_sale.count} 笔)</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon orange">
                        <span>📦</span>
                    </div>
                    <div class="stat-info">
                        <h3>${stats.total_inventory.quantity}</h3>
                        <p>总库存数量</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon ${stats.today_profit >= 0 ? 'green' : 'red'}">
                        <span>💰</span>
                    </div>
                    <div class="stat-info">
                        <h3>${stats.today_profit >= 0 ? '+' : ''}${Layout.formatPrice(stats.today_profit)}</h3>
                        <p>今日利润</p>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">快捷操作</h3>
                </div>
                <div class="card-body">
                    <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="Router.navigate('purchase')">
                            📥 新增进货
                        </button>
                        <button class="btn btn-success" onclick="Router.navigate('sale')">
                            📤 新增销售
                        </button>
                        <button class="btn btn-secondary" onclick="Router.navigate('inventory')">
                            📦 查看库存
                        </button>
                        <button class="btn btn-secondary" onclick="Router.navigate('statistics')">
                            📊 查看报表
                        </button>
                    </div>
                </div>
            </div>
            
            ${stats.total_inventory.warning_count > 0 ? `
            <div class="card mt-2">
                <div class="card-header">
                    <h3 class="card-title" style="color: var(--warning-color);">⚠️ 库存预警</h3>
                </div>
                <div class="card-body">
                    <p>有 <strong>${stats.total_inventory.warning_count}</strong> 个品种的库存低于预警阈值，请及时补货。</p>
                    <button class="btn btn-warning btn-sm mt-2" onclick="Router.navigate('inventory')">
                        查看详情
                    </button>
                </div>
            </div>
            ` : ''}
        `;
        
        document.getElementById('mainContent').innerHTML = content;
    }
};
