const StatisticsPage = {
    todayStats: null,
    startDate: '',
    endDate: '',
    trendData: null,
    purchaseVarietyData: null,
    saleVarietyData: null,
    inventoryDistribution: null,
    trendChart: null,
    profitChart: null,
    salePieChart: null,
    inventoryChart: null,
    
    async render() {
        Layout.render('', '数据统计');
        Layout.updateTitle('数据统计');
        
        const today = Layout.getTodayString();
        this.endDate = today;
        
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        this.startDate = weekAgo.toISOString().split('T')[0];
        
        await Promise.all([
            this.loadTodayStats(),
            this.loadAllChartData()
        ]);
        
        this.renderContent();
        this.initCharts();
    },
    
    async loadTodayStats() {
        try {
            const result = await StatisticsService.getToday();
            if (result.code === 0) {
                this.todayStats = result.data;
            }
        } catch (e) {
            console.error('Load today stats error:', e);
        }
    },
    
    async loadAllChartData() {
        await Promise.all([
            this.loadTrendData(),
            this.loadPurchaseVarietyData(),
            this.loadSaleVarietyData(),
            this.loadInventoryDistribution()
        ]);
    },
    
    async loadTrendData() {
        if (!this.startDate || !this.endDate) return;
        
        try {
            const result = await StatisticsService.getTrendChart(this.startDate, this.endDate);
            if (result.code === 0) {
                this.trendData = result.data;
            }
        } catch (e) {
            console.error('Load trend data error:', e);
        }
    },
    
    async loadPurchaseVarietyData() {
        try {
            const result = await StatisticsService.getPurchaseVarietyChart(this.startDate, this.endDate);
            if (result.code === 0) {
                this.purchaseVarietyData = result.data;
            }
        } catch (e) {
            console.error('Load purchase variety error:', e);
        }
    },
    
    async loadSaleVarietyData() {
        try {
            const result = await StatisticsService.getSaleVarietyChart(this.startDate, this.endDate);
            if (result.code === 0) {
                this.saleVarietyData = result.data;
            }
        } catch (e) {
            console.error('Load sale variety error:', e);
        }
    },
    
    async loadInventoryDistribution() {
        try {
            const result = await StatisticsService.getInventoryDistributionChart();
            if (result.code === 0) {
                this.inventoryDistribution = result.data;
            }
        } catch (e) {
            console.error('Load inventory distribution error:', e);
        }
    },
    
    renderContent() {
        const stats = this.todayStats || {
            today_purchase: { count: 0, amount: 0 },
            today_sale: { count: 0, amount: 0 },
            total_inventory: { quantity: 0, cost: 0, warning_count: 0 },
            today_profit: 0
        };
        
        const content = `
            <div class="page-header">
                <h1 class="page-title">数据统计</h1>
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
            
            <div class="card mt-2">
                <div class="card-header">
                    <div class="flex-between">
                        <h3 class="card-title">趋势分析</h3>
                        <div class="filter-group">
                            <input type="date" class="form-control" style="width: auto;" 
                                value="${this.startDate}" onchange="StatisticsPage.changeStartDate(this)">
                            <span>至</span>
                            <input type="date" class="form-control" style="width: auto;"
                                value="${this.endDate}" onchange="StatisticsPage.changeEndDate(this)">
                            <button class="btn btn-primary btn-sm" onclick="StatisticsPage.refreshRange()">
                                查询
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="charts-grid">
                        <div class="chart-card">
                            <div class="card-header" style="padding: 0 0 16px 0; border-bottom: 1px solid var(--border-color); margin-bottom: 16px;">
                                <h3 class="card-title">进货/销售趋势</h3>
                            </div>
                            <div class="chart-container">
                                <canvas id="trendChart"></canvas>
                            </div>
                        </div>
                        
                        <div class="chart-card">
                            <div class="card-header" style="padding: 0 0 16px 0; border-bottom: 1px solid var(--border-color); margin-bottom: 16px;">
                                <h3 class="card-title">利润趋势</h3>
                            </div>
                            <div class="chart-container">
                                <canvas id="profitChart"></canvas>
                            </div>
                        </div>
                    </div>
                    
                    <div class="charts-grid mt-2">
                        <div class="chart-card">
                            <div class="card-header" style="padding: 0 0 16px 0; border-bottom: 1px solid var(--border-color); margin-bottom: 16px;">
                                <h3 class="card-title">销售分布</h3>
                            </div>
                            <div class="chart-container">
                                <canvas id="pieChart"></canvas>
                            </div>
                        </div>
                        
                        <div class="chart-card">
                            <div class="card-header" style="padding: 0 0 16px 0; border-bottom: 1px solid var(--border-color); margin-bottom: 16px;">
                                <h3 class="card-title">库存分布</h3>
                            </div>
                            <div class="chart-container">
                                <canvas id="inventoryChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('mainContent').innerHTML = content;
    },
    
    changeStartDate(input) {
        this.startDate = input.value;
    },
    
    changeEndDate(input) {
        this.endDate = input.value;
    },
    
    async refreshRange() {
        await this.loadAllChartData();
        this.updateAllCharts();
    },
    
    getChartColors() {
        return [
            '#1a73e8',
            '#188038',
            '#f9ab00',
            '#d93025',
            '#9334e6',
            '#e3742f',
            '#5f6368',
            '#202124',
            '#34a853',
            '#fb4c02'
        ];
    },
    
    getTrendChartData() {
        const colors = this.getChartColors();
        
        if (this.trendData && this.trendData.labels && this.trendData.labels.length > 0) {
            return {
                labels: this.trendData.labels.map(d => d.substring(5)),
                purchaseData: this.trendData.purchase_amounts || [],
                saleData: this.trendData.sale_amounts || [],
                profitData: this.trendData.profits || []
            };
        }
        
        return {
            labels: [],
            purchaseData: [],
            saleData: [],
            profitData: []
        };
    },
    
    getSalePieChartData() {
        const colors = this.getChartColors();
        
        if (this.saleVarietyData && this.saleVarietyData.labels && this.saleVarietyData.labels.length > 0) {
            return {
                labels: this.saleVarietyData.labels,
                data: this.saleVarietyData.amounts || this.saleVarietyData.quantities || []
            };
        }
        
        return {
            labels: ['暂无数据'],
            data: [1]
        };
    },
    
    getInventoryChartData() {
        const colors = this.getChartColors();
        
        if (this.inventoryDistribution && this.inventoryDistribution.labels && this.inventoryDistribution.labels.length > 0) {
            return {
                labels: this.inventoryDistribution.labels,
                data: this.inventoryDistribution.quantities || [],
                warningStatus: this.inventoryDistribution.warning_status || []
            };
        }
        
        return {
            labels: ['暂无库存数据'],
            data: [1],
            warningStatus: [false]
        };
    },
    
    initCharts() {
        this.destroyCharts();
        this.initTrendChart();
        this.initProfitChart();
        this.initSalePieChart();
        this.initInventoryChart();
    },
    
    updateAllCharts() {
        this.destroyCharts();
        this.initCharts();
    },
    
    destroyCharts() {
        if (this.trendChart) {
            this.trendChart.destroy();
            this.trendChart = null;
        }
        if (this.profitChart) {
            this.profitChart.destroy();
            this.profitChart = null;
        }
        if (this.salePieChart) {
            this.salePieChart.destroy();
            this.salePieChart = null;
        }
        if (this.inventoryChart) {
            this.inventoryChart.destroy();
            this.inventoryChart = null;
        }
    },
    
    initTrendChart() {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;
        
        const trendData = this.getTrendChartData();
        
        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendData.labels,
                datasets: [
                    {
                        label: '进货金额',
                        data: trendData.purchaseData,
                        borderColor: '#1a73e8',
                        backgroundColor: 'rgba(26, 115, 232, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: '销售金额',
                        data: trendData.saleData,
                        borderColor: '#188038',
                        backgroundColor: 'rgba(24, 128, 56, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '¥' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    },
    
    initProfitChart() {
        const ctx = document.getElementById('profitChart');
        if (!ctx) return;
        
        const trendData = this.getTrendChartData();
        
        this.profitChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: trendData.labels,
                datasets: [{
                    label: '利润',
                    data: trendData.profitData,
                    backgroundColor: trendData.profitData.map(v => 
                        v >= 0 ? 'rgba(24, 128, 56, 0.7)' : 'rgba(217, 48, 37, 0.7)'
                    ),
                    borderColor: trendData.profitData.map(v => 
                        v >= 0 ? '#188038' : '#d93025'
                    ),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return '¥' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    },
    
    initSalePieChart() {
        const ctx = document.getElementById('pieChart');
        if (!ctx) return;
        
        const saleData = this.getSalePieChartData();
        const colors = this.getChartColors();
        
        this.salePieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: saleData.labels,
                datasets: [{
                    data: saleData.data,
                    backgroundColor: colors.slice(0, saleData.labels.length)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 10,
                        right: 30,
                        bottom: 10,
                        left: 10
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 16,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            boxWidth: 10
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label}: ¥${value.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    initInventoryChart() {
        const ctx = document.getElementById('inventoryChart');
        if (!ctx) return;
        
        const inventoryData = this.getInventoryChartData();
        const colors = this.getChartColors();
        
        const bgColors = inventoryData.warningStatus.map((isWarning, index) => {
            if (isWarning) {
                return 'rgba(249, 171, 0, 0.7)';
            }
            return colors[index % colors.length];
        });
        
        const maxData = Math.max(...inventoryData.data, 1);
        const suggestedMax = Math.ceil(maxData * 1.2);
        
        this.inventoryChart = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: inventoryData.labels,
                datasets: [{
                    data: inventoryData.data,
                    backgroundColor: bgColors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 15,
                        right: 60,
                        bottom: 15,
                        left: 15
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            boxWidth: 8
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                return `${label}: ${value} 件`;
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        suggestedMax: suggestedMax,
                        ticks: {
                            display: true,
                            padding: 12,
                            backdropPadding: 8,
                            backdropColor: 'rgba(255, 255, 255, 0.9)',
                            showLabelBackdrop: true,
                            maxTicksLimit: 5,
                            z: 10
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)',
                            circular: true
                        },
                        angleLines: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        pointLabels: {
                            display: false
                        }
                    }
                }
            }
        });
    }
};
