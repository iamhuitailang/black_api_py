const StatisticsPage = {
    state: { range: 'week', year: new Date().getFullYear(), month: new Date().getMonth() + 1 },

    async render() {
        if (!AuthService.requireAuth()) return;
        AppLayout.render(`<div class="content"><div class="loading"><div class="spinner"></div></div></div>`, '统计');
        await this.load();
    },

    async load() {
        try {
            const [summary, trend, distribution, calendar] = await Promise.all([
                ApiService.get('/jianshen/statistics/summary/get'),
                ApiService.get('/jianshen/statistics/trend/get', { range_type: this.state.range }),
                ApiService.get('/jianshen/statistics/project/get'),
                ApiService.get('/jianshen/statistics/calendar/get', { year: this.state.year, month: this.state.month })
            ]);
            this.renderContent(summary.data, trend.data, distribution.data, calendar.data);
        } catch (e) {
            console.error(e);
            AppLayout.render(`
                <div class="content">
                    <div class="empty"><div class="icon">📊</div>加载失败</div>
                    <button class="btn btn-primary btn-block" onclick="StatisticsPage.load()">重试</button>
                </div>
            `, '统计');
        }
    },

    renderContent(summary, trend, distribution, calendar) {
        const s = this.state;
        const tabs = [
            { key: 'week', label: '周' },
            { key: 'month', label: '月' },
            { key: 'year', label: '年' }
        ];
        const trendChart = this.renderBarChart(trend);
        const calendarHtml = this.renderCalendar(calendar, s.year, s.month);
        const pieHtml = this.renderPie(distribution);
        AppLayout.render(`
            <div class="content">
                <div class="card">
                    <div class="card-header"><h2>📊 数据汇总</h2></div>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="value">${summary.total_count || 0}</div>
                            <div class="label">总打卡次数</div>
                        </div>
                        <div class="summary-item">
                            <div class="value">${summary.total_days || 0}</div>
                            <div class="label">总打卡天数</div>
                        </div>
                        <div class="summary-item">
                            <div class="value">${summary.total_duration || 0}</div>
                            <div class="label">总时长(分钟)</div>
                        </div>
                        <div class="summary-item">
                            <div class="value">${summary.total_calories || 0}</div>
                            <div class="label">总消耗(kcal)</div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><h2>📈 训练趋势</h2></div>
                    <div class="stat-tabs">
                        ${tabs.map(t => `<div class="stat-tab ${s.range === t.key ? 'active' : ''}" onclick="StatisticsPage.setRange('${t.key}')">${t.label}</div>`).join('')}
                    </div>
                    ${trendChart}
                </div>

                ${calendarHtml}

                ${pieHtml}
            </div>
        `, '统计');
    },

    renderBarChart(trend) {
        if (!trend || !trend.labels || !trend.labels.length) {
            return '<div class="empty"><div class="icon">📊</div>暂无数据</div>';
        }
        const rangeType = this.state.range;
        let displayLabels = [];
        let displayDurations = [];

        if (rangeType === 'week') {
            displayLabels = trend.labels.map(l => {
                const p = l.split('-');
                return `${parseInt(p[1])}/${parseInt(p[2])}`;
            });
            displayDurations = trend.durations.slice();
        } else if (rangeType === 'month') {
            const weekBuckets = { '第1周': 0, '第2周': 0, '第3周': 0, '第4周': 0, '第5周': 0 };
            trend.labels.forEach((label, i) => {
                const p = label.split('-');
                const day = parseInt(p[2]);
                const weekIdx = Math.min(Math.floor((day - 1) / 7), 4);
                const weekKey = `第${weekIdx + 1}周`;
                weekBuckets[weekKey] += trend.durations[i];
            });
            const weeks = ['第1周', '第2周', '第3周', '第4周', '第5周'];
            displayLabels = weeks.filter(w => weekBuckets[w] > 0 || weeks.indexOf(w) < 4);
            displayDurations = displayLabels.map(w => weekBuckets[w]);
        } else {
            const monthData = {};
            trend.labels.forEach((label, i) => {
                const m = parseInt(label.split('-')[1]);
                const key = `${m}月`;
                if (!monthData[key]) monthData[key] = 0;
                monthData[key] += trend.durations[i];
            });
            for (let m = 1; m <= 12; m++) {
                const key = `${m}月`;
                if (!monthData[key]) monthData[key] = 0;
            }
            displayLabels = Object.keys(monthData).sort((a, b) => parseInt(a) - parseInt(b));
            displayDurations = displayLabels.map(k => monthData[k]);
        }

        const max = Math.max(...displayDurations, 1);
        const totalBars = displayLabels.length;
        const barWidth = rangeType === 'year' ? 22 : (rangeType === 'month' ? 50 : 36);
        const chartWidth = totalBars * barWidth + (totalBars - 1) * 6;
        const bars = displayLabels.map((label, i) => {
            const h = (displayDurations[i] / max) * 100;
            return `<div class="bar" style="height:${Math.max(h, 2)}%;width:${barWidth}px;" title="${label}: ${displayDurations[i]}分钟"><div class="label">${label}</div></div>`;
        }).join('');
        return `<div class="bar-chart" style="min-width:${chartWidth}px;">${bars}</div>`;
    },

    renderCalendar(data, year, month) {
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const startWeekday = firstDay.getDay();
        const totalDays = lastDay.getDate();
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        let days = '';
        weekdays.forEach(w => { days += `<div class="weekday">${w}</div>`; });
        for (let i = 0; i < startWeekday; i++) days += '<div class="day empty"></div>';
        const today = new Date().toISOString().split('T')[0];
        for (let d = 1; d <= totalDays; d++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const record = data[dateStr];
            const classes = ['day'];
            if (record) classes.push('checked');
            if (dateStr === today) classes.push('today');
            if (record && record.projects && record.projects.length) classes.push('has-project');
            days += `<div class="${classes.join(' ')}">${d}</div>`;
        }
        return `
            <div class="calendar">
                <div class="calendar-header">
                    <button onclick="StatisticsPage.changeMonth(-1)">‹</button>
                    <div class="title">${year}年 ${month}月</div>
                    <button onclick="StatisticsPage.changeMonth(1)">›</button>
                </div>
                <div class="calendar-grid">${days}</div>
            </div>
        `;
    },

    changeMonth(delta) {
        let m = this.state.month + delta;
        let y = this.state.year;
        if (m < 1) { m = 12; y--; }
        if (m > 12) { m = 1; y++; }
        this.state.month = m;
        this.state.year = y;
        this.load();
    },

    setRange(r) { this.state.range = r; this.load(); },

    renderPie(dist) {
        if (!dist || !dist.labels || !dist.labels.length) {
            return '';
        }
        const colors = ['#4361ee', '#10b981', '#f59e0b', '#ef4444', '#805ad5', '#06b6d4', '#ec4899', '#84cc16'];
        const items = dist.labels.map((label, i) => `
            <div class="item">
                <div class="dot" style="background:${colors[i % colors.length]}"></div>
                <div class="name">${label}</div>
                <div class="value">${dist.counts[i]}次 · ${dist.percentages[i]}%</div>
            </div>
        `).join('');
        return `
            <div class="card">
                <div class="card-header"><h2>🥧 项目分布</h2></div>
                <div class="pie-legend">${items}</div>
            </div>
        `;
    }
};
