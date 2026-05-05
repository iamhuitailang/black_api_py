const StatsPage = {
    currentPeriod: 'today',
    statsData: null,
    trendData: null,
    bestRecords: null,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <div class="header">
                    <div class="header-title">数据统计</div>
                </div>

                <div class="stats-tabs">
                    <div class="stats-tab ${this.currentPeriod === 'today' ? 'active' : ''}" data-period="today">今日</div>
                    <div class="stats-tab ${this.currentPeriod === 'week' ? 'active' : ''}" data-period="week">本周</div>
                    <div class="stats-tab ${this.currentPeriod === 'month' ? 'active' : ''}" data-period="month">本月</div>
                </div>

                <div class="stats-summary" id="stats-summary">
                    <div class="stats-summary-item">
                        <div class="stats-summary-value">--</div>
                        <div class="stats-summary-label">跳绳数量</div>
                    </div>
                    <div class="stats-summary-item">
                        <div class="stats-summary-value">--</div>
                        <div class="stats-summary-label">跳绳时长</div>
                    </div>
                    <div class="stats-summary-item">
                        <div class="stats-summary-value">--</div>
                        <div class="stats-summary-label">消耗卡路里</div>
                    </div>
                </div>

                <div class="chart-container">
                    <div class="chart-title">📈 趋势图表</div>
                    <div class="chart-canvas" id="trend-chart">
                        <div class="empty-state" style="padding: 40px 20px;">
                            <div class="empty-state-icon" style="font-size: 48px;">📊</div>
                            <div class="empty-state-text">暂无数据</div>
                        </div>
                    </div>
                </div>

                <div class="best-records" id="best-records">
                    <div class="best-records-header">🏆 最佳记录</div>
                    <div class="best-records-list">
                        <div class="best-record-item">
                            <div class="best-record-icon">🏃</div>
                            <div class="best-record-value" id="best-single">--</div>
                            <div class="best-record-label">最高单次</div>
                        </div>
                        <div class="best-record-item">
                            <div class="best-record-icon">📅</div>
                            <div class="best-record-value" id="best-daily">--</div>
                            <div class="best-record-label">最高单日</div>
                        </div>
                        <div class="best-record-item">
                            <div class="best-record-icon">⚡</div>
                            <div class="best-record-value" id="best-speed">--</div>
                            <div class="best-record-label">最快速度</div>
                        </div>
                    </div>
                </div>

                <div class="section-title">完成情况</div>
                <div class="card">
                    <div class="card-body">
                        <div class="form-group">
                            <label class="form-label">目标完成率</label>
                            <div class="today-progress-bar" style="height: 12px; margin-top: 8px;">
                                <div class="today-progress-fill" id="completion-rate-bar" style="width: 0%"></div>
                            </div>
                            <div class="today-progress-text" style="margin-top: 8px;">
                                <span id="completion-rate">0%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="tabbar">
                    <div class="tabbar-item" data-tab="home">
                        <div class="tabbar-icon">🏠</div>
                        <div class="tabbar-text">首页</div>
                    </div>
                    <div class="tabbar-item" data-tab="record">
                        <div class="tabbar-icon">➕</div>
                        <div class="tabbar-text">记录</div>
                    </div>
                    <div class="tabbar-item active" data-tab="stats">
                        <div class="tabbar-icon">📊</div>
                        <div class="tabbar-text">统计</div>
                    </div>
                    <div class="tabbar-item" data-tab="social">
                        <div class="tabbar-icon">👥</div>
                        <div class="tabbar-text">社交</div>
                    </div>
                    <div class="tabbar-item" data-tab="profile">
                        <div class="tabbar-icon">👤</div>
                        <div class="tabbar-text">我的</div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        await this.loadData();
    },

    bindEvents() {
        document.querySelectorAll('.stats-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const period = tab.dataset.period;
                this.currentPeriod = period;
                document.querySelectorAll('.stats-tab').forEach(t => {
                    t.classList.toggle('active', t.dataset.period === period);
                });
                this.updateStatsDisplay();
            });
        });

        document.querySelectorAll('.tabbar-item').forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                Router.navigate(tab);
            });
        });
    },

    async loadData() {
        try {
            const todayResult = await ApiService.get('/ts/record/daily/get');
            const weeklyResult = await ApiService.get('/ts/record/weekly/get');
            const monthlyResult = await ApiService.get('/ts/record/monthly/get');
            const bestResult = await ApiService.get('/ts/record/best/get');

            this.statsData = {
                today: todayResult.code === 0 ? todayResult.data : null,
                week: weeklyResult.code === 0 ? weeklyResult.data : null,
                month: monthlyResult.code === 0 ? monthlyResult.data : null
            };

            this.bestRecords = bestResult.code === 0 ? bestResult.data : null;

            this.updateStatsDisplay();
            this.updateBestRecords();
        } catch (e) {
            console.error('Load stats error:', e);
        }
    },

    updateStatsDisplay() {
        const data = this.statsData?.[this.currentPeriod];
        if (!data) return;

        const stats = data.stats || {};
        const summaryItems = document.querySelectorAll('.stats-summary-item');

        if (summaryItems[0]) {
            summaryItems[0].querySelector('.stats-summary-value').textContent = Utils.formatNumber(stats.total_count || 0);
        }
        if (summaryItems[1]) {
            summaryItems[1].querySelector('.stats-summary-value').textContent = Utils.formatDuration(stats.total_duration || 0);
        }
        if (summaryItems[2]) {
            summaryItems[2].querySelector('.stats-summary-value').textContent = Utils.formatCalories(stats.total_calories || 0);
        }

        this.updateTrendChart();
        this.updateCompletionRate();
    },

    updateTrendChart() {
        const chart = document.getElementById('trend-chart');
        const data = this.statsData?.[this.currentPeriod];
        const trendData = data?.trend_data || [];

        if (trendData.length === 0) {
            chart.innerHTML = `
                <div class="empty-state" style="padding: 40px 20px;">
                    <div class="empty-state-icon" style="font-size: 48px;">📊</div>
                    <div class="empty-state-text">暂无数据</div>
                </div>
            `;
            return;
        }

        const maxCount = Math.max(...trendData.map(d => d.total_count || 0), 1);
        const chartWidth = chart.offsetWidth || 300;
        const chartHeight = chart.offsetHeight || 200;
        const padding = 40;
        const barWidth = Math.max(20, (chartWidth - padding * 2) / trendData.length - 8);

        let barsHtml = '';
        trendData.forEach((item, index) => {
            const count = item.total_count || 0;
            const height = (count / maxCount) * (chartHeight - padding * 2);
            const x = padding + index * ((chartWidth - padding * 2) / trendData.length) + 4;

            barsHtml += `
                <div style="
                    position: absolute;
                    bottom: ${padding}px;
                    left: ${x}px;
                    width: ${barWidth}px;
                    height: ${height}px;
                    background: linear-gradient(to top, #6366f1, #a855f7);
                    border-radius: 4px 4px 0 0;
                    transition: height 0.3s ease;
                " title="${item.record_date}: ${count}个"></div>
            `;
        });

        const maxY = chartHeight - padding;
        const minY = padding;
        const step = Math.ceil(maxCount / 5) || 1;

        let gridLines = '';
        for (let i = 0; i <= 5; i++) {
            const value = step * i;
            const y = maxY - (value / maxCount) * (maxY - minY);
            gridLines += `
                <div style="
                    position: absolute;
                    left: ${padding}px;
                    right: ${padding}px;
                    top: ${y}px;
                    border-top: 1px dashed #e2e8f0;
                ">
                    <span style="position: absolute; left: -35px; top: -8px; font-size: 10px; color: #94a3b8;">${value}</span>
                </div>
            `;
        }

        chart.innerHTML = gridLines + barsHtml;
    },

    updateBestRecords() {
        if (!this.bestRecords) return;

        const bestSingle = document.getElementById('best-single');
        const bestDaily = document.getElementById('best-daily');
        const bestSpeed = document.getElementById('best-speed');

        if (bestSingle) {
            bestSingle.textContent = Utils.formatNumber(this.bestRecords.max_single_count || 0) + '个';
        }
        if (bestDaily) {
            bestDaily.textContent = Utils.formatNumber(this.bestRecords.max_daily_count || 0) + '个';
        }
        if (bestSpeed) {
            bestSpeed.textContent = (this.bestRecords.max_speed || 0).toFixed(1) + '个/分';
        }
    },

    updateCompletionRate() {
        const user = AuthService.getCurrentUser() || {};
        const dailyGoal = user.daily_goal || Storage.getDailyGoal();
        const todayData = this.statsData?.today?.stats;
        const todayCount = todayData?.total_count || 0;

        const completionRate = dailyGoal > 0 ? Math.min(100, (todayCount / dailyGoal) * 100) : 0;

        const rateBar = document.getElementById('completion-rate-bar');
        const rateText = document.getElementById('completion-rate');

        if (rateBar) {
            rateBar.style.width = `${completionRate}%`;
        }
        if (rateText) {
            rateText.textContent = `${completionRate.toFixed(1)}% (${Utils.formatNumber(todayCount)}/${Utils.formatNumber(dailyGoal)})`;
        }
    }
};
